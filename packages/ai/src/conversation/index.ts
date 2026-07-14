import crypto from 'crypto';
import { IKernel, ISessionContext } from '../interfaces';
import { MasterAgent, MasterAgentResponse } from '../master-agent';
import { ExecutionPlanner } from '../planner';

export class ConversationService {
  private kernel: IKernel;
  private masterAgent: MasterAgent;

  constructor(kernel: IKernel) {
    this.kernel = kernel;
    this.masterAgent = new MasterAgent(kernel, new ExecutionPlanner());
  }

  /**
   * Starts a new conversation thread, returning a unique ID.
   */
  startConversation(): string {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
  }

  /**
   * Sends a user chat message turn through the orchestrator pipeline.
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    message: string,
    contextOverride?: Partial<ISessionContext>,
  ): Promise<MasterAgentResponse & { conversationId: string }> {
    // 1. Load user's FanMemory snapshot from DB (Refinement 6)
    const fanMemory = await this.kernel.memoryService.loadFanMemory(userId);

    // 2. Build full SessionContext object
    const executionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    const sessionContext: ISessionContext = {
      currentUser: { id: userId, email: '', role: 'Fan' },
      currentMatch: contextOverride?.currentMatch || null,
      currentStadium: contextOverride?.currentStadium || null,
      language: contextOverride?.language || (fanMemory?.language as string) || 'en',
      timezone: contextOverride?.timezone || 'UTC',
      conversationState: contextOverride?.conversationState || {},
      authenticationState: true,
      fanMemory: fanMemory || null,
      conversationId,
      executionId,
      promptVersion: contextOverride?.promptVersion || 'v1',
    };

    // 3. Save User turn turn in DB
    await this.kernel.memoryService.saveConversationTurn(userId, 'user', message);

    // 4. Delegate handleMessage call to MasterAgent
    const agentResponse = await this.masterAgent.handleMessage(message, sessionContext);

    // 5. Save Assistant response turn in DB
    await this.kernel.memoryService.saveConversationTurn(
      userId,
      'assistant',
      agentResponse.response,
      'MasterAgent',
    );

    return {
      ...agentResponse,
      conversationId,
    };
  }
}
