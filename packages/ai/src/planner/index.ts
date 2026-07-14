import { IExecutionPlanner, ExecutionPlan, ISessionContext, IKernel, PlanStep } from '../interfaces';
import { IntentEngine } from './intent';

export class ExecutionPlanner implements IExecutionPlanner {
  private intentEngine = new IntentEngine();

  async plan(userMessage: string, context: ISessionContext, kernel: IKernel): Promise<ExecutionPlan> {
    const reasoningPath: string[] = ['Initiating execution planning.'];
    const steps: PlanStep[] = [];

    // 1. Analyze Intent via IntentEngine
    reasoningPath.push('Running query analysis through the Intent Engine.');
    const intentResult = this.intentEngine.classify(userMessage);
    reasoningPath.push(`Classified query intent as "${intentResult.intent}" with confidence ${intentResult.confidence}.`);

    // Map intent to required capabilities
    let capability = 'q&a';
    if (intentResult.intent === 'booking') capability = 'booking';
    if (intentResult.intent === 'travel') capability = 'travel';
    if (intentResult.intent === 'companion') capability = 'match-companion';

    reasoningPath.push(`Mapping query intent to required capability: "${capability}".`);

    // 2. Discover Agents Supporting Capability & Rank by Priority (Refinement 3)
    const candidates = kernel.agentRegistry.findAgentsByCapability(capability);
    reasoningPath.push(
      `Discovered ${candidates.length} candidate agent(s) for capability "${capability}" in registry.`,
    );

    // Sort matching agents by priority descending
    const sortedCandidates = [...candidates].sort((a, b) => b.priority - a.priority);

    if (sortedCandidates.length > 0 && sortedCandidates[0]) {
      const selectedAgent = sortedCandidates[0];
      reasoningPath.push(
        `Selected highest priority agent: "${selectedAgent.name}" (priority: ${selectedAgent.priority}, version: ${selectedAgent.version}).`,
      );

      steps.push({
        agentName: selectedAgent.name,
        input: userMessage,
        order: 1,
      });
    } else {
      reasoningPath.push(
        `No specialized agent matches capability "${capability}". Defaulting to general assistant fallback.`,
      );
    }

    reasoningPath.push('Execution plan construction completed.');

    return {
      intent: intentResult.intent,
      steps,
      confidence: intentResult.confidence,
      reasoningPath,
    };
  }
}
