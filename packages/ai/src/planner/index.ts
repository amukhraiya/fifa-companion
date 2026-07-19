import { IExecutionPlanner, ExecutionPlan, ISessionContext, IKernel, PlanStep } from '../interfaces';
import { GeminiIntentEngine, KeywordIntentEngine, RichIntentResult } from './intent';

// Extended plan with clarification support
export interface ExtendedExecutionPlan extends ExecutionPlan {
  needsClarification: boolean;
  clarificationQuestion?: string;
  objective?: string;
  taskType?: string;
  requiresTools?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-Agent Execution Planner
//
// Replaces the previous single-agent planner.
// Now capable of:
//   1. Using Gemini to classify multi-intent queries
//   2. Building multi-step execution plans (multiple agents in order)
//   3. Detecting missing info and triggering clarification before execution
//   4. Graceful fallback to keyword routing
// ─────────────────────────────────────────────────────────────────────────────
export class ExecutionPlanner implements IExecutionPlanner {
  async plan(
    userMessage: string,
    context: ISessionContext,
    kernel: IKernel,
  ): Promise<ExtendedExecutionPlan> {
    const reasoningPath: string[] = ['Initiating multi-agent execution planning.'];

    // ── Retrieve active goal from fanMemory ──
    let activeGoal: any = (context.fanMemory as any)?.activeGoal || null;
    if (activeGoal && typeof activeGoal === 'string') {
      try {
        activeGoal = JSON.parse(activeGoal);
      } catch {
        activeGoal = null;
      }
    }

    // ── Step 1: Gemini-powered intent classification ──
    let intentResult: RichIntentResult;

    const geminiEngine = new GeminiIntentEngine(kernel.geminiService);
    const fanMemory = context.fanMemory ?? undefined;

    reasoningPath.push('Running Gemini NLU intent classification...');

    try {
      intentResult = await geminiEngine.classify(
        userMessage,
        fanMemory as Record<string, unknown> | undefined,
        activeGoal
      );
      reasoningPath.push(
        `Gemini classified task: ${intentResult.taskType} with confidence ${intentResult.confidence}. `
      );
    } catch {
      // Fallback to keyword engine
      reasoningPath.push('Gemini classification failed. Falling back to keyword intent engine.');
      const keywordEngine = new KeywordIntentEngine();
      const basicResult = keywordEngine.classify(userMessage);
      intentResult = {
        ...basicResult,
        objective: 'Fallback basic intent',
        taskType: basicResult.intent,
        requiresTools: basicResult.intent !== 'GENERAL_CHAT' && basicResult.intent !== 'FOOTBALL_KNOWLEDGE',
        missingInformation: [],
        needsClarification: false,
      };
    }

    // ── Step 2: Manage Active Goal state ──
    const targetGoalTasks = ['PLAN_TRIP', 'BOOK_TICKET'];
    
    if (targetGoalTasks.includes(intentResult.taskType)) {
      if (!activeGoal || activeGoal.objective !== intentResult.taskType) {
        // Start a new active goal
        activeGoal = {
          objective: intentResult.taskType,
          constraints: {},
          requiredConstraints: intentResult.missingInformation || [],
          status: 'IN_PROGRESS'
        };
        reasoningPath.push(`Initiated new active goal: ${activeGoal.objective}`);
      } else {
        // Goal continuation: Update active goal constraints and missing details
        const previousMissing = activeGoal.requiredConstraints || [];
        const newMissing = intentResult.missingInformation || [];
        
        // Constraints that were previously missing but are no longer missing are marked as provided
        const supplied = previousMissing.filter((c: string) => !newMissing.includes(c));
        supplied.forEach((c: string) => {
          activeGoal.constraints[c] = 'provided';
        });
        
        activeGoal.requiredConstraints = newMissing;
        reasoningPath.push(`Updated active goal: ${activeGoal.objective}. Missing remaining: ${newMissing.join(', ')}`);
      }
      
      if (activeGoal.requiredConstraints.length === 0) {
        activeGoal.status = 'COMPLETED';
        reasoningPath.push(`Active goal completed: ${activeGoal.objective}`);
      }
      
      // Persist goal state
      if (context.currentUser?.id) {
        try {
          const dbGoal = activeGoal.status === 'COMPLETED' ? null : activeGoal;
          await kernel.memoryService.updateFanMemory(context.currentUser.id, {
            activeGoal: dbGoal
          });
          if (context.fanMemory) {
            context.fanMemory.activeGoal = dbGoal;
          }
        } catch (dbErr) {
          console.error('[ExecutionPlanner] Error updating activeGoal in DB', dbErr);
        }
      }
    } else {
      // Clear active goal on explicit topic pivot
      if (activeGoal && activeGoal.status === 'IN_PROGRESS' && intentResult.taskType !== 'UNKNOWN' && intentResult.taskType !== 'GENERAL_CHAT') {
        reasoningPath.push(`Pivot detected. Clearing active goal: ${activeGoal.objective}`);
        activeGoal = null;
        if (context.currentUser?.id) {
          try {
            await kernel.memoryService.updateFanMemory(context.currentUser.id, {
              activeGoal: null
            });
            if (context.fanMemory) {
              context.fanMemory.activeGoal = null;
            }
          } catch (dbErr) {
            console.error('[ExecutionPlanner] Error clearing activeGoal in DB', dbErr);
          }
        }
      }
    }

    // ── Step 3: Check if clarification is needed ──
    if (intentResult.needsClarification && intentResult.missingInformation.length > 0) {
      reasoningPath.push(
        `Clarification needed. Missing: ${intentResult.missingInformation.join(', ')}`,
      );
      return {
        intent: intentResult.taskType ?? 'UNKNOWN',
        steps: [],
        confidence: intentResult.confidence,
        reasoningPath,
        needsClarification: true,
        clarificationQuestion: this.buildClarificationQuestion(intentResult),
        objective: intentResult.objective,
        taskType: intentResult.taskType,
        requiresTools: intentResult.requiresTools,
      };
    }

    // ── Step 4: Build multi-agent execution plan ──
    const steps: PlanStep[] = [];
    
    if (intentResult.requiresTools === false) {
      reasoningPath.push('Goal Analysis determined requiresTools=false. Bypassing tool execution.');
    } else {
      const agentsToRun = this.mapTaskTypeToAgents(intentResult.taskType);
      reasoningPath.push(`Planning multi-agent execution: [${agentsToRun.join(' → ')}]`);

      let order = 1;
      const addedAgents = new Set<string>();

      for (const agentName of agentsToRun) {
        if (addedAgents.has(agentName)) continue;

        const agent = kernel.agentRegistry.getAgent(agentName);
        if (agent) {
          steps.push({
            agentName: agent.name,
            input: userMessage,
            order: order++,
          });
          addedAgents.add(agentName);
          reasoningPath.push(`Scheduled step ${order - 1}: ${agent.name} (v${agent.version}, priority: ${agent.priority})`);
        } else {
          reasoningPath.push(`Warning: Agent "${agentName}" not found in registry. Skipping.`);
        }
      }
    }

    reasoningPath.push(`Execution plan complete. ${steps.length} agent(s) scheduled.`);

    return {
      intent: intentResult.taskType ?? 'UNKNOWN',
      steps,
      confidence: intentResult.confidence,
      reasoningPath,
      needsClarification: false,
      objective: intentResult.objective,
      taskType: intentResult.taskType,
      requiresTools: intentResult.requiresTools,
    };
  }

  private buildClarificationQuestion(result: RichIntentResult): string {
    const missing = result.missingInformation;

    // Prioritise the most critical missing piece
    if (missing.some((m) => m.toLowerCase().includes('city') || m.toLowerCase().includes('origin') || m.toLowerCase().includes('location'))) {
      return '🗺️ Which city will you be travelling from? (e.g. New York, London, Mumbai)';
    }
    if (missing.some((m) => m.toLowerCase().includes('budget'))) {
      return '💰 What is your approximate budget for this trip? (e.g. ₹75,000 or $1,000)';
    }
    if (missing.some((m) => m.toLowerCase().includes('team'))) {
      return '⚽ Which team would you like to watch? (e.g. Brazil, France, England)';
    }
    if (missing.some((m) => m.toLowerCase().includes('date') || m.toLowerCase().includes('when'))) {
      return '📅 When are you planning to travel? Do you have specific dates in mind?';
    }
    if (missing.some((m) => m.toLowerCase().includes('people') || m.toLowerCase().includes('traveller'))) {
      return '👥 How many people will be travelling?';
    }

    // Generic fallback
    return `To help you better, could you provide more details about: ${missing.join(', ')}?`;
  }

  private mapTaskTypeToAgents(taskType: string): string[] {
    const mapping: Record<string, string[]> = {
      BOOK_TICKET: ['BookingAgent'],
      PLAN_TRIP: ['TravelAgent', 'BookingAgent', 'WalletAgent'],
      TRAVEL: ['TravelAgent'],
      HOTEL: ['TravelAgent'], // The TravelAgent usually handles hotels
      MATCH_INFORMATION: ['MatchCompanionAgent'],
      TEAM_INFORMATION: ['MatchCompanionAgent'],
      NEWS: ['MatchCompanionAgent'],
      STADIUM: ['MatchCompanionAgent'],
      WALLET: ['WalletAgent'],
      BUDGET: ['WalletAgent'],
      MEMORY: ['WalletAgent'],
      RECOMMENDATION: ['MatchCompanionAgent', 'BookingAgent'],
    };
    return mapping[taskType] ?? [];
  }
}
