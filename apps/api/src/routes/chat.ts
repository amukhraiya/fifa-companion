import { Router, Response } from 'express';
import { z } from 'zod';
import { RequireAuth, AuthenticatedRequest } from '../middleware/auth';
import { conversationService, kernel } from '../lib/di';
import { prisma } from '../lib/db';

export const chatRouter = Router();

const SendMessageSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
});

// -------------------------------------------------------------
// POST /api/v1/chat/stream (SSE Streaming Chat completions)
// -------------------------------------------------------------
chatRouter.post(
  '/stream',
  RequireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User is missing from context' },
        });
        return;
      }

      const parsed = SendMessageSchema.parse(req.body);
      const conversationId = parsed.conversationId || conversationService.startConversation();

      // Set headers for Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Trigger orchestrator run
      const agentResponse = await conversationService.sendMessage(
        userId,
        conversationId,
        parsed.message,
      );

      // Stream words asynchronously to simulate/expose a streaming interface
      const words = agentResponse.response.split(' ');
      for (const word of words) {
        res.write(
          `data: ${JSON.stringify({
            chunk: word + ' ',
            conversationId,
          })}\n\n`,
        );
        // Add a micro-delay to let client render streaming output
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      // Output final done metadata (including trace ID and explanations)
      res.write(
        `data: ${JSON.stringify({
          done: true,
          traceId: agentResponse.traceId,
          explanation: agentResponse.explanation,
        })}\n\n`,
      );
      res.end();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Chat execution failed';
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      res.end();
    }
  },
);

// -------------------------------------------------------------
// GET /api/v1/chat/debug/traces/:traceId (Observability debug logs)
// -------------------------------------------------------------
chatRouter.get(
  '/debug/traces/:traceId',
  RequireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const trace = kernel.observability.getTrace(req.params.traceId);
      if (!trace) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Trace not found for requested ID' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { trace },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Trace fetch failed';
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: msg },
      });
    }
  },
);

// -------------------------------------------------------------
// GET /api/v1/chat/debug/events (Event Bus logging timelines)
// -------------------------------------------------------------
chatRouter.get(
  '/debug/events',
  RequireAuth,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const events = await prisma.event.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
      });

      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Events fetch failed';
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: msg },
      });
    }
  },
);
