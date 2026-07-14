import { IKernel, IExecutionPlanner, ISessionContext, AgentResponse } from '../interfaces';

export class MasterAgent {
  private kernel: IKernel;
  private planner: IExecutionPlanner;

  constructor(kernel: IKernel, planner: IExecutionPlanner) {
    this.kernel = kernel;
    this.planner = planner;
  }

  async handleMessage(
    message: string,
    context: ISessionContext,
  ): Promise<{ response: string; traceId: string }> {
    // 1. Initialize observability trace
    const traceId = this.kernel.observability.startTrace(message, 'MasterAgent');
    
    try {
      this.kernel.observability.addReasoningStep(traceId, 'MasterAgent received query.');

      // Record memory snapshots read
      if (context.fanMemory) {
        this.kernel.observability.recordMemoryRead(traceId, 'fanMemory');
      }

      // 2. Delegate Planning
      const executionPlan = await this.planner.plan(message, context, this.kernel);
      const trace = this.kernel.observability.getTrace(traceId);
      if (trace) {
        trace.intent = executionPlan.intent;
      }
      executionPlan.reasoningPath.forEach((step) => {
        this.kernel.observability.addReasoningStep(traceId, `[Planner] ${step}`);
      });

      // 3. RAG Search Grounding
      const ragResults = await this.kernel.ragProvider.search(message);
      ragResults.forEach((doc) => {
        this.kernel.observability.recordRagRead(traceId, doc.id);
      });
      this.kernel.observability.addReasoningStep(traceId, `Grounding search matched ${ragResults.length} chunks.`);

      // 4. Plan Step Execution
      const responses: AgentResponse[] = [];
      for (const step of executionPlan.steps) {
        const agent = this.kernel.agentRegistry.getAgent(step.agentName);
        if (agent) {
          this.kernel.observability.addReasoningStep(
            traceId,
            `Executing step ${step.order}: Delegating to agent ${agent.name}`,
          );
          
          // Execute agent (which may run tools and publish events)
          const res = await agent.execute(context, this.kernel);
          responses.push(res);
          
          this.kernel.observability.addReasoningStep(
            traceId,
            `Agent ${agent.name} finished execution successfully.`,
          );
        }
      }

      // 5. Merge Outputs & Complete Trace
      let finalMessage = '';
      if (responses.length > 0) {
        finalMessage = responses.map((r) => r.message).join('\n\n');
      } else {
        // Fallback Q&A mapping
        const matchingDocsText = ragResults.map(r => r.content).join(' ');
        finalMessage = matchingDocsText 
          ? `[Grounding Context] ${matchingDocsText}` 
          : "Infrastructure Ready. I'm waiting for downstream logic connection in next milestones.";
      }

      await this.kernel.observability.completeTrace(traceId, true, executionPlan.confidence);
      return {
        response: finalMessage,
        traceId,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown execution error';
      this.kernel.observability.addReasoningStep(traceId, `Execution failed: ${msg}`);
      await this.kernel.observability.completeTrace(traceId, false, 0);
      throw error;
    }
  }
}
