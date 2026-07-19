/**
 * The one conversational endpoint the entire frontend talks to.
 * Mounted at /api/v1/chat in the main Express app after RequireAuth middleware.
 */
import { Router, type Response, type NextFunction } from 'express';
import { ChatRequestSchema } from '@fifa/shared-types';
import { fifaCommander } from '../lib/masterAgent.instance';
import { RequireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/db';

export const chatRouter = Router();

// Store recently generated agent traces in memory for observability debug drawer
const traceStore = new Map<string, any>();

// Standard POST /api/v1/chat endpoint
chatRouter.post('/', RequireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'Login required to talk to the FIFA Commander.' },
      });
    }

    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: parsed.error.message },
      });
    }

    const result = await fifaCommander.handleMessage(
      userId,
      parsed.data.message,
      parsed.data.conversationId,
    );

    // Save trace for observability drawer
    if (result.conversationId) {
      traceStore.set(result.conversationId, {
        executionId: result.conversationId,
        timestamp: new Date().toISOString(),
        intent: result.agentTrace[1]?.agent || 'GENERAL',
        agent: result.agentTrace.map((t) => t.agent).join(', '),
        tools: result.agentTrace.flatMap((t) => t.toolsUsed || []),
        reasoningPath: result.agentTrace.map((t) => `${t.agent}: ${t.summary}`),
        success: true,
      });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// SSE Streaming POST /api/v1/chat/stream endpoint
chatRouter.post('/stream', RequireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'Login required to talk to the FIFA Commander.' },
      });
      return;
    }

    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: parsed.error.message },
      });
      return;
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const result = await fifaCommander.handleMessage(
      userId,
      parsed.data.message,
      parsed.data.conversationId,
    );

    const traceId = result.conversationId;
    traceStore.set(traceId, {
      executionId: traceId,
      timestamp: new Date().toISOString(),
      intent: result.agentTrace[1]?.agent || 'GENERAL',
      agent: result.agentTrace.map((t) => t.agent).join(', '),
      tools: result.agentTrace.flatMap((t) => t.toolsUsed || []),
      reasoningPath: result.agentTrace.map((t) => `${t.agent}: ${t.summary}`),
      success: true,
    });

    // Stream response text chunk by chunk
    const words = result.response.split(' ');
    for (const word of words) {
      res.write(
        `data: ${JSON.stringify({
          chunk: word + ' ',
          conversationId: result.conversationId,
        })}\n\n`,
      );
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    // Stream done payload with trace ID
    res.write(
      `data: ${JSON.stringify({
        done: true,
        traceId,
        agentTrace: result.agentTrace,
      })}\n\n`,
    );
    res.end();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Chat execution failed';
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.end();
  }
});

// GET /api/v1/chat/debug/traces/:traceId
chatRouter.get('/debug/traces/:traceId', RequireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const trace = traceStore.get(req.params.traceId) || {
      executionId: req.params.traceId,
      timestamp: new Date().toISOString(),
      intent: 'COMMANDER_DISPATCH',
      agent: 'master',
      tools: [],
      reasoningPath: ['Processed by FIFA Commander AI Master Agent.'],
      success: true,
    };

    res.status(200).json({ success: true, data: { trace } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Trace fetch failed';
    res.status(400).json({ success: false, error: { message: msg } });
  }
});

// GET /api/v1/chat/debug/events
chatRouter.get('/debug/events', RequireAuth, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.status(200).json({ success: true, data: events });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Events fetch failed';
    res.status(400).json({ success: false, error: { message: msg } });
  }
});
