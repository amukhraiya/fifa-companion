import crypto from 'crypto';
import { IObservabilityService, AgentTrace } from '../interfaces';

export class ObservabilityService implements IObservabilityService {
  private traces = new Map<string, AgentTrace>();
  private startTimes = new Map<string, number>();

  startTrace(intent: string, agent: string): string {
    const executionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    this.startTimes.set(executionId, Date.now());

    this.traces.set(executionId, {
      executionId,
      timestamp: new Date().toISOString(),
      intent,
      agent,
      tools: [],
      memoryReads: [],
      ragReads: [],
      executionTime: 0,
      success: false,
      confidence: 0,
      reasoningPath: [],
    });

    return executionId;
  }

  addReasoningStep(executionId: string, step: string): void {
    const trace = this.traces.get(executionId);
    if (trace) {
      trace.reasoningPath.push(step);
    }
  }

  recordToolInvocation(executionId: string, toolName: string): void {
    const trace = this.traces.get(executionId);
    if (trace && !trace.tools.includes(toolName)) {
      trace.tools.push(toolName);
    }
  }

  recordMemoryRead(executionId: string, variable: string): void {
    const trace = this.traces.get(executionId);
    if (trace && !trace.memoryReads.includes(variable)) {
      trace.memoryReads.push(variable);
    }
  }

  recordRagRead(executionId: string, docId: string): void {
    const trace = this.traces.get(executionId);
    if (trace && !trace.ragReads.includes(docId)) {
      trace.ragReads.push(docId);
    }
  }

  async completeTrace(
    executionId: string,
    success: boolean,
    confidence: number,
  ): Promise<AgentTrace> {
    const trace = this.traces.get(executionId);
    const startTime = this.startTimes.get(executionId);

    if (!trace) {
      throw new Error(`Trace not found for execution ID: ${executionId}`);
    }

    if (startTime) {
      trace.executionTime = Date.now() - startTime;
    }

    trace.success = success;
    trace.confidence = confidence;

    return trace;
  }

  getTrace(executionId: string): AgentTrace | null {
    return this.traces.get(executionId) || null;
  }
}
