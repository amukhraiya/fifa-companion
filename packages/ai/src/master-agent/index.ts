import { IKernel, IExecutionPlanner, ISessionContext, AgentResult } from '../interfaces';
import { AISafetyLayer } from '../safety';
import { ResponseSynthesizer } from '../synthesizer';

export interface MasterAgentResponse {
  response: string;
  traceId: string;
  confidence: number;
  explanation?: {
    recommendedMatch: string;
    justifications: string[];
  };
}

export class MasterAgent {
  private kernel: IKernel;
  private planner: IExecutionPlanner;
  private safetyLayer = new AISafetyLayer();
  private synthesizer = new ResponseSynthesizer();

  constructor(kernel: IKernel, planner: IExecutionPlanner) {
    this.kernel = kernel;
    this.planner = planner;
  }

  async handleMessage(
    message: string,
    context: ISessionContext,
  ): Promise<MasterAgentResponse> {
    // 1. Initialize observability trace
    const traceId = this.kernel.observability.startTrace(message, 'MasterAgent');
    const trace = this.kernel.observability.getTrace(traceId);
    if (trace) {
      trace.conversationId = context.conversationId;
      trace.promptVersion = context.promptVersion;
    }

    try {
      this.kernel.observability.addReasoningStep(traceId, 'MasterAgent received query.');

      // 2. AI Safety Layer Gate (Refinement 2)
      const sanitized = this.safetyLayer.sanitizePrompt(message);
      this.kernel.observability.addReasoningStep(traceId, 'Ran query through prompt sanitization.');

      if (!this.safetyLayer.validatePromptSize(sanitized)) {
        this.kernel.observability.addReasoningStep(traceId, 'AISafetyLayer: Input prompt exceeded maximum allowed size.');
        await this.kernel.observability.completeTrace(traceId, false, 0);
        return {
          response: 'Adversarial query blocked: Input exceeds safety length limits.',
          traceId,
          confidence: 0.0,
        };
      }

      if (this.safetyLayer.detectPromptInjection(sanitized)) {
        this.kernel.observability.addReasoningStep(traceId, 'AISafetyLayer: Detected potential prompt injection vector.');
        await this.kernel.observability.completeTrace(traceId, false, 0);
        return {
          response: 'Adversarial query blocked: Unsafe prompt template input detected.',
          traceId,
          confidence: 0.0,
        };
      }

      // Record memory snapshots read
      if (context.fanMemory) {
        this.kernel.observability.recordMemoryRead(traceId, 'fanMemory');
        if (trace) {
          trace.memoryInjected = true;
        }
      }

      // 3. Delegate Planning
      const executionPlan = await this.planner.plan(sanitized, context, this.kernel);
      if (trace) {
        trace.intent = executionPlan.intent;
      }
      executionPlan.reasoningPath.forEach((step) => {
        this.kernel.observability.addReasoningStep(traceId, `[Planner] ${step}`);
      });

      // 4. RAG Search Grounding
      const ragResults = await this.kernel.ragProvider.search(sanitized);
      ragResults.forEach((doc) => {
        this.kernel.observability.recordRagRead(traceId, doc.id);
      });
      this.kernel.observability.addReasoningStep(traceId, `Grounding search matched ${ragResults.length} chunks.`);

      // 5. Plan Step Execution (Standardized AgentResult mapping)
      const agentResults: AgentResult[] = [];
      for (const step of executionPlan.steps) {
        const agent = this.kernel.agentRegistry.getAgent(step.agentName);
        if (agent) {
          this.kernel.observability.addReasoningStep(
            traceId,
            `Executing step ${step.order}: Delegating to agent ${agent.name} (v${agent.version})`,
          );

          // Execute agent
          const res = await agent.execute(context, this.kernel);
          agentResults.push(res);

          this.kernel.observability.addReasoningStep(
            traceId,
            `Agent ${agent.name} completed. Confidence: ${res.confidence}. Reasoning: ${res.reasoning}`,
          );
        }
      }

      // 6. Response Synthesis (Refinement 1 & 6)
      const synthesis = this.synthesizer.synthesize(sanitized, context, executionPlan, agentResults);

      await this.kernel.observability.completeTrace(traceId, true, synthesis.confidence);

      return {
        response: synthesis.message,
        traceId,
        confidence: synthesis.confidence,
        explanation: synthesis.explanation,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown execution error';
      this.kernel.observability.addReasoningStep(traceId, `Execution failed: ${msg}`);
      await this.kernel.observability.completeTrace(traceId, false, 0);
      throw error;
    }
  }
}
