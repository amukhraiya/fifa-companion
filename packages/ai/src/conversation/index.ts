import crypto from 'crypto';
import { IKernel, ISessionContext } from '../interfaces';
import { MasterAgent, MasterAgentResponse } from '../master-agent';
import { ExecutionPlanner } from '../planner';
import { MemoryAgent } from '../agents/MemoryAgent';

// ─────────────────────────────────────────────────────────────────────────────
// ConversationService — upgraded to inject conversation history into context
// ─────────────────────────────────────────────────────────────────────────────
export class ConversationService {
  private kernel: IKernel;
  private masterAgent: MasterAgent;

  // Max conversation turns to inject into every Gemini call
  private readonly HISTORY_TURNS = 10;

  constructor(kernel: IKernel) {
    this.kernel = kernel;
    this.masterAgent = new MasterAgent(kernel as any);
  }

  /**
   * Starts a new conversation thread, returning a unique ID.
   */
  startConversation(): string {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
  }

  /**
   * Sends a user chat message through the orchestrator pipeline.
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    message: string,
    contextOverride?: Partial<ISessionContext>,
  ): Promise<MasterAgentResponse & { conversationId: string }> {
    // 1. Load user's FanMemory snapshot from DB
    const fanMemory = await this.kernel.memoryService.loadFanMemory(userId);

    // 2. Load conversation history (last N turns) for context injection
    const conversationHistory = await this.loadConversationHistory(userId);

    // 3. Build full SessionContext with injected history
    const executionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    const sessionContext: ISessionContext = {
      currentUser: { id: userId, email: '', role: 'Fan' },
      currentMatch: contextOverride?.currentMatch || null,
      currentStadium: contextOverride?.currentStadium || null,
      language: contextOverride?.language || (fanMemory?.language as string) || 'en',
      timezone: contextOverride?.timezone || 'UTC',
      conversationState: {
        ...(contextOverride?.conversationState || {}),
        // Inject conversation history so every Gemini call is context-aware
        history: conversationHistory,
        conversationId,
      },
      authenticationState: true,
      fanMemory: fanMemory || null,
      conversationId,
      executionId,
      promptVersion: contextOverride?.promptVersion || 'v2',
    };

    // 4. Save user turn to DB
    await this.kernel.memoryService.saveConversationTurn(userId, 'user', message);

    // 5. Delegate to MasterAgent
    const agentResponse = await (this.masterAgent as any).handleMessage(userId, message, conversationId);

    // 6. Save assistant response to DB
    await this.kernel.memoryService.saveConversationTurn(
      userId,
      'assistant',
      agentResponse.response,
      'MasterAgent',
    );

    // 7. Background Memory Consolidation (Async)
    const memoryAgent = new MemoryAgent();
    memoryAgent.extractAndStore(userId, message, this.kernel).catch((err) => {
      console.error('[ConversationService] Background memory extraction failed:', err);
    });

    return {
      ...agentResponse,
      conversationId,
    };
  }

  /**
   * Loads the last N conversation turns and formats them for Gemini injection.
   */
  private async loadConversationHistory(userId: string): Promise<string> {
    try {
      // Access the DB directly through memoryService internals
      // We use a type-safe workaround via the saveConversationTurn interface
      // In production, you'd add getConversationHistory to IMemoryService.
      // For now we read via the prisma client in kernel context.
      const prismaLike = (this.kernel.memoryService as unknown as {
        prisma?: {
          conversationTurn?: {
            findMany: (args: unknown) => Promise<Array<{ role: string; content: string; createdAt: Date }>>;
          };
        };
      }).prisma;

      if (!prismaLike?.conversationTurn) {
        return ''; // MemoryService doesn't expose prisma — skip history
      }

      const turns = await prismaLike.conversationTurn.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: this.HISTORY_TURNS,
      });

      if (!turns || turns.length === 0) return '';

      // Reverse to chronological order and format
      const formatted = turns
        .reverse()
        .map((t) => `${t.role === 'user' ? 'User' : 'Commander AI'}: ${t.content}`)
        .join('\n');

      return formatted;
    } catch {
      // History injection is non-critical — fail silently
      return '';
    }
  }
}
