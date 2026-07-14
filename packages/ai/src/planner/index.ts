import { IExecutionPlanner, ExecutionPlan, ISessionContext, IKernel, PlanStep } from '../interfaces';

export class ExecutionPlanner implements IExecutionPlanner {
  async plan(userMessage: string, context: ISessionContext, kernel: IKernel): Promise<ExecutionPlan> {
    const reasoningPath: string[] = ['Initiating execution planning.'];
    const msgLower = userMessage.toLowerCase();
    const steps: PlanStep[] = [];
    let detectedCapabilities: string[] = [];

    // 1. Capability Discovery
    reasoningPath.push('Analyzing query string for dynamic capability requirements.');
    if (msgLower.includes('book') || msgLower.includes('seat') || msgLower.includes('reserve') || msgLower.includes('ticket')) {
      detectedCapabilities.push('booking');
      reasoningPath.push('Detected "booking" capability requirement.');
    }
    if (msgLower.includes('travel') || msgLower.includes('plan') || msgLower.includes('weather') || msgLower.includes('restaurant') || msgLower.includes('itinerary')) {
      detectedCapabilities.push('travel');
      reasoningPath.push('Detected "travel" capability requirement.');
    }
    if (msgLower.includes('stats') || msgLower.includes('match') || msgLower.includes('commentary') || msgLower.includes('timeline')) {
      detectedCapabilities.push('match-companion');
      reasoningPath.push('Detected "match-companion" capability requirement.');
    }

    // Fallback: If no explicit capability matches, assign default Q&A matching Master Agent itself
    if (detectedCapabilities.length === 0) {
      detectedCapabilities.push('q&a');
      reasoningPath.push('No specific transactional capability detected. Defaulting to general Q&A.');
    }

    // 2. Dynamic Agent Selection via capabilities
    let stepCount = 1;
    for (const capability of detectedCapabilities) {
      const candidates = kernel.agentRegistry.findAgentsByCapability(capability);
      reasoningPath.push(`Searching Agent Registry for agents supporting capability "${capability}". Found ${candidates.length} candidate(s).`);

      if (candidates.length > 0 && candidates[0]) {
        steps.push({
          agentName: candidates[0].name,
          input: userMessage,
          order: stepCount++,
        });
        reasoningPath.push(`Assigned task step ${stepCount - 1} to agent "${candidates[0].name}" (v${candidates[0].version}).`);
      } else {
        reasoningPath.push(`No specialized agent available for capability "${capability}". Query will be answered using standard knowledge bases.`);
      }
    }

    // 3. Formulate the Execution Plan
    const confidence = steps.length > 0 ? 0.95 : 0.8;
    reasoningPath.push('Execution plan construction completed.');

    return {
      intent: detectedCapabilities.join('+'),
      steps,
      confidence,
      reasoningPath,
    };
  }
}
