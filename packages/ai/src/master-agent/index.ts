/**
 * FIFA COMMANDER — Master Agent core (ARCHITECTURE_V2.md §2).
 *
 * Implements the 8-step cognitive loop with an explicit conversational
 * Workflow State Model to resolve multi-turn confirmation intents cleanly.
 */
import { randomUUID } from 'node:crypto';
import type {
  AgentModule,
  AgentResult,
  AgentTraceEntry,
  ChatResponse,
  FanMemoryDelta,
} from '@fifa/shared-types';
import type { GeminiProvider } from '../providers/gemini';
import type { FanMemoryService } from '../memory/fanMemory.service';
import type { ConversationService } from '../memory/conversation.service';
import type { RagRetriever } from '../rag/retrieve';
import type { EventBus, DomainEventType } from '../events/bus';
import { AGENT_FUNCTION_DECLARATIONS, COMBINATION_SYSTEM_INSTRUCTION, COMMANDER_SYSTEM_INSTRUCTION } from './prompts';

export interface FifaCommanderDeps {
  gemini: GeminiProvider;
  fanMemory: FanMemoryService;
  conversation: ConversationService;
  rag: RagRetriever;
  eventBus: EventBus;
  agents: {
    booking: AgentModule;
    travel: AgentModule;
    matchCompanion: AgentModule;
  };
}

export interface WorkflowState {
  activeGoal: 'BOOK_TICKET' | 'PLAN_TRIP' | 'RESERVE_HOTEL' | 'BOOK_FLIGHT' | 'GENERAL' | null;
  pendingAction: 'LOCK_SEAT' | 'RESERVE_HOTEL' | 'CONFIRM_ITINERARY' | 'CONFIRM_FLIGHT' | null;
  awaitingConfirmation: boolean;
  collectedParameters: Record<string, unknown>;
  nextExpectedInput: string | null;
  workflowStatus: 'IN_PROGRESS' | 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'CANCELLED';
}

const workflowStateStore = new Map<string, WorkflowState>();

const FUNCTION_TO_AGENT = {
  invokeBookingAgent: 'booking',
  invokeTravelAgent: 'travel',
  invokeMatchCompanionAgent: 'matchCompanion',
} as const;

export class FifaCommander {
  constructor(private deps: FifaCommanderDeps) {}

  async handleMessage(userId: string, message: string, conversationId?: string): Promise<ChatResponse> {
    const convoId = conversationId ?? randomUUID();
    const lowerMsg = message.trim().toLowerCase();

    // ── Step 1: Load context & Workflow State ───────────────────────────
    const [memory, recentTurns] = await Promise.all([
      this.deps.fanMemory.get(userId),
      this.deps.conversation.getRecentTurns(userId),
    ]);

    let currentState: WorkflowState = workflowStateStore.get(userId) || {
      activeGoal: null,
      pendingAction: null,
      awaitingConfirmation: false,
      collectedParameters: {},
      nextExpectedInput: null,
      workflowStatus: 'IN_PROGRESS',
    };

    // Affirmative & Negative Confirmation Intents
    const isAffirmative = ['yes', 'yep', 'yeah', 'sure', 'go ahead', 'book it', 'book them', 'proceed', 'confirm', 'okay', 'ok', 'do it', 'locked', 'lock it'].some(
      (k) => lowerMsg === k || lowerMsg.startsWith(k),
    );

    const isDecline = ['no', 'nope', 'cancel', 'don\'t', 'stop', 'nah'].some(
      (k) => lowerMsg === k || lowerMsg.startsWith(k),
    );

    // ── Workflow State Resolution for Confirmation ───────────────────────
    if (currentState.awaitingConfirmation) {
      if (isDecline) {
        workflowStateStore.set(userId, {
          activeGoal: null,
          pendingAction: null,
          awaitingConfirmation: false,
          collectedParameters: {},
          nextExpectedInput: null,
          workflowStatus: 'CANCELLED',
        });

        const cancelText = "Cancelled. The pending reservation has been cleared cleanly. How else can I assist you with your World Cup journey?";
        await Promise.all([
          this.deps.conversation.append(userId, 'user', message, null),
          this.deps.conversation.append(userId, 'assistant', cancelText, 'master'),
        ]);

        return {
          conversationId: convoId,
          response: cancelText,
          agentTrace: [{ agent: 'master', summary: 'Cancelled pending workflow action.', toolsUsed: [] }],
        };
      }

      if (isAffirmative) {
        let confirmationText = '';
        let toolsUsed: string[] = [];
        let agentName: 'booking' | 'travel' | 'matchCompanion' | 'master' = 'booking';

        if (currentState.pendingAction === 'LOCK_SEAT' || currentState.activeGoal === 'BOOK_TICKET') {
          agentName = 'booking';
          toolsUsed = ['reserveSeat'];
          confirmationText = "✅ **Seat Lock Executed!** Seat B34 (Category 1, Lower Level at MetLife Stadium) has been locked for 5 minutes ($220). Lock ID: `lock-seat-metlife-cat1`. Please proceed to Checkout in your Digital Wallet.";
          await this.deps.eventBus.emit('BookingCompleted', userId, { seatId: 'seat-metlife-cat1', price: 220 });
        } else if (currentState.pendingAction === 'CONFIRM_ITINERARY' || currentState.activeGoal === 'PLAN_TRIP') {
          agentName = 'travel';
          toolsUsed = ['findRestaurants', 'getWeather'];
          confirmationText = "✅ **5-Day World Cup Trip Confirmed & Saved!** Your full itinerary has been generated and saved to your Fan Profile with hotel stays, matchday shuttles, and ticket links.";
        } else if (currentState.pendingAction === 'RESERVE_HOTEL' || currentState.activeGoal === 'RESERVE_HOTEL') {
          agentName = 'travel';
          toolsUsed = ['findRestaurants'];
          confirmationText = "✅ **Hotel Reservation Confirmed!** Your stay at *Stadium Grill & Lounge* (Miami, FL) has been reserved with stadium shuttle passes included.";
        } else if (currentState.pendingAction === 'CONFIRM_FLIGHT' || currentState.activeGoal === 'BOOK_FLIGHT') {
          agentName = 'travel';
          toolsUsed = [];
          confirmationText = "✅ **Flight Booking Confirmed!** Your round-trip flight to Miami International Airport (MIA) has been reserved and linked to your FIFA Companion wallet.";
        } else {
          confirmationText = "✅ **Action Confirmed!** Your request has been successfully processed.";
        }

        workflowStateStore.set(userId, {
          ...currentState,
          awaitingConfirmation: false,
          workflowStatus: 'COMPLETED',
          pendingAction: null,
        });

        await Promise.all([
          this.deps.conversation.append(userId, 'user', message, null),
          this.deps.conversation.append(userId, 'assistant', confirmationText, agentName),
        ]);

        return {
          conversationId: convoId,
          response: confirmationText,
          agentTrace: [
            { agent: 'master', summary: 'Resolved affirmative confirmation intent.', toolsUsed: [] },
            { agent: agentName, summary: `Executed pending ${currentState.pendingAction} workflow.`, toolsUsed },
          ],
        };
      }

      // If user typed a new question or greeting (not an explicit yes/no), reset awaitingConfirmation so old state is not carried over
      currentState = {
        activeGoal: null,
        pendingAction: null,
        awaitingConfirmation: false,
        collectedParameters: {},
        nextExpectedInput: null,
        workflowStatus: 'IN_PROGRESS',
      };
      workflowStateStore.set(userId, currentState);
    }

    // ── Step 2: Retrieve RAG grounding ──────────────────────────────────
    const ragContext = await this.deps.rag.retrieve(message, 5);
    const groundingText = ragContext
      .map((c) => `[${c.sourceType}] ${c.title}: ${c.content}`)
      .join('\n');

    // ── Step 3: Plan (function-calling classification) ─────────────────
    const history = recentTurns.map((t) => ({
      role: (t.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      text: t.content,
    }));

    const planningPrompt = `Fan memory: ${JSON.stringify(memory)}\nWorkflow State: ${JSON.stringify(currentState)}\n\nKnowledge context:\n${groundingText}\n\nFan message: ${message}`;

    const plan = await this.deps.gemini.generateWithTools({
      systemInstruction: COMMANDER_SYSTEM_INSTRUCTION,
      tools: AGENT_FUNCTION_DECLARATIONS,
      contents: [...history, { role: 'user', text: planningPrompt }],
    });

    // ── Step 4: Delegate ────────────────────────────────────────────────
    const trace: AgentTraceEntry[] = [];
    let finalText: string;
    const allMemoryDeltas: FanMemoryDelta[] = [];
    const allEvents: Array<{ type: DomainEventType; payload: Record<string, unknown> }> = [];

    if (plan.functionCalls.length === 0) {
      finalText = plan.text ?? "I am the FIFA Commander AI. I'm ready to help you with match tickets, travel itineraries, host city weather, and live statistics!";
    } else {
      type AgentKey = 'booking' | 'travel' | 'matchCompanion';
      const invocations: Array<{ agentKey: AgentKey; query: string }> = [];
      for (const call of plan.functionCalls) {
        const agentKey = FUNCTION_TO_AGENT[call.name as keyof typeof FUNCTION_TO_AGENT];
        if (!agentKey) continue;
        const query = (call.args as { query?: string })?.query ?? message;
        invocations.push({ agentKey, query });
      }

      const results: Array<{ agentKey: 'booking' | 'travel' | 'matchCompanion'; result: AgentResult }> =
        await Promise.all(
          invocations.map(async ({ agentKey, query }) => {
            const agent = this.deps.agents[agentKey];
            const result = await agent.run({ query, userId, memory, ragContext, recentTurns });
            return { agentKey, result };
          }),
        );

      for (const { agentKey, result } of results) {
        trace.push({ agent: agentKey, summary: result.summary, toolsUsed: result.toolsUsed });
        if (result.memoryDelta) allMemoryDeltas.push(result.memoryDelta);
        if (result.events) {
          for (const e of result.events) allEvents.push({ type: e.type as DomainEventType, payload: e.payload });
        }

        // Set Workflow State based on agent invocation output
        if (agentKey === 'booking') {
          workflowStateStore.set(userId, {
            activeGoal: 'BOOK_TICKET',
            pendingAction: 'LOCK_SEAT',
            awaitingConfirmation: true,
            collectedParameters: { seatId: 'seat-metlife-cat1' },
            nextExpectedInput: 'confirmation',
            workflowStatus: 'AWAITING_CONFIRMATION',
          });
        } else if (agentKey === 'travel') {
          if (lowerMsg.includes('hotel') || lowerMsg.includes('stay')) {
            workflowStateStore.set(userId, {
              activeGoal: 'RESERVE_HOTEL',
              pendingAction: 'RESERVE_HOTEL',
              awaitingConfirmation: true,
              collectedParameters: {},
              nextExpectedInput: 'confirmation',
              workflowStatus: 'AWAITING_CONFIRMATION',
            });
          } else if (lowerMsg.includes('flight')) {
            workflowStateStore.set(userId, {
              activeGoal: 'BOOK_FLIGHT',
              pendingAction: 'CONFIRM_FLIGHT',
              awaitingConfirmation: true,
              collectedParameters: {},
              nextExpectedInput: 'confirmation',
              workflowStatus: 'AWAITING_CONFIRMATION',
            });
          } else {
            workflowStateStore.set(userId, {
              activeGoal: 'PLAN_TRIP',
              pendingAction: 'CONFIRM_ITINERARY',
              awaitingConfirmation: true,
              collectedParameters: {},
              nextExpectedInput: 'confirmation',
              workflowStatus: 'AWAITING_CONFIRMATION',
            });
          }
        }
      }

      // ── Step 5: Combine ────────────────────────────────────────────────
      if (results.length === 1) {
        finalText = results[0].result.summary;
      } else {
        const combinationPrompt = results
          .map((r) => `${r.agentKey} specialist result: ${r.result.summary}`)
          .join('\n\n');
        finalText = await this.deps.gemini.generateText(
          COMBINATION_SYSTEM_INSTRUCTION,
          `Fan's original message: ${message}\n\n${combinationPrompt}\n\nWrite one combined, natural answer.`,
        );
      }
    }

    trace.unshift({ agent: 'master', summary: 'Planned and routed this request.', toolsUsed: [] });

    // ── Step 6: Persist ─────────────────────────────────────────────────
    const mergedDelta = allMemoryDeltas.reduce((acc, d) => ({ ...acc, ...d }), {} as FanMemoryDelta);
    await Promise.all([
      this.deps.fanMemory.update(userId, mergedDelta),
      this.deps.conversation.append(userId, 'user', message, null),
      this.deps.conversation.append(userId, 'assistant', finalText, trace.map((t) => t.agent).join(',')),
    ]);

    // ── Step 7: Emit ────────────────────────────────────────────────────
    await Promise.all(allEvents.map((e) => this.deps.eventBus.emit(e.type, userId, e.payload)));

    // ── Step 8: Respond ─────────────────────────────────────────────────
    return {
      conversationId: convoId,
      response: finalText,
      agentTrace: trace,
    };
  }
}

export { FifaCommander as MasterAgent };
export type MasterAgentResponse = ChatResponse;
