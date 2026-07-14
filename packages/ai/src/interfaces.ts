import { z } from 'zod';

// -------------------------------------------------------------
// 1. Session Context Interface
// -------------------------------------------------------------
export interface ISessionContext {
  currentUser: { id: string; email: string; role: string } | null;
  currentMatch: string | null;
  currentStadium: string | null;
  language: string;
  timezone: string;
  conversationState: Record<string, unknown>;
  authenticationState: boolean;
  fanMemory: Record<string, unknown> | null; // Snapshot of FanMemory, avoids repeating DB reads
  conversationId: string;
  executionId: string;
  promptVersion: string;
}

// -------------------------------------------------------------
// 2. Tool Interface (Exposing discover/validate/execute/observe)
// -------------------------------------------------------------
export interface ToolMetadata {
  name: string;
  description: string;
  schema: z.ZodType<unknown>;
}

export interface ITool {
  name: string;
  description: string;
  discover(): ToolMetadata;
  validate(input: unknown): boolean;
  execute(input: unknown): Promise<unknown>;
  observe(executionId: string, input: unknown, output: unknown, error?: Error): void;
}

// -------------------------------------------------------------
// 3. Agent Interface (Exposing metadata & execute)
// -------------------------------------------------------------
export interface AgentResult {
  agentName: string;
  success: boolean;
  data: Record<string, unknown>;
  confidence: number;
  reasoning: string;
}

export interface IAgent {
  name: string;
  version: string;
  description: string;
  capabilities: string[]; // Dynamically checked capabilities
  priority: number;       // Execution priority weighting
  execute(context: ISessionContext, kernel: IKernel): Promise<AgentResult>;
}

// -------------------------------------------------------------
// 4. Memory Service Interface
// -------------------------------------------------------------
export interface IMemoryService {
  loadFanMemory(userId: string): Promise<Record<string, unknown> | null>;
  updateFanMemory(userId: string, data: Record<string, unknown>): Promise<void>;
  saveConversationTurn(userId: string, role: string, content: string, agentUsed?: string): Promise<void>;
}

// -------------------------------------------------------------
// 5. RAG Interface (Retrieval abstraction)
// -------------------------------------------------------------
export interface RAGResult {
  id: string;
  sourceType: string;
  title: string;
  content: string;
  score: number;
}

export interface RAGDocument {
  id?: string;
  sourceType: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface IRAGProvider {
  search(query: string, limit?: number): Promise<RAGResult[]>;
  retrieve(documentId: string): Promise<RAGDocument | null>;
  index(document: RAGDocument): Promise<void>;
}

// -------------------------------------------------------------
// 6. Event Bus Interface
// -------------------------------------------------------------
export interface IEventBus {
  publish(event: string, payload: unknown): void;
  subscribe(event: string, callback: (payload: unknown) => void): void;
  unsubscribe(event: string, callback: (payload: unknown) => void): void;
}

// -------------------------------------------------------------
// 7. Registries Interfaces
// -------------------------------------------------------------
export interface IAgentRegistry {
  registerAgent(agent: IAgent): void;
  getAgent(name: string): IAgent | null;
  listAgents(): IAgent[];
  findAgentsByCapability(capability: string): IAgent[];
}

export interface IToolRegistry {
  registerTool(tool: ITool): void;
  getTool(name: string): ITool | null;
  listTools(): ITool[];
  executeTool(name: string, input: unknown): Promise<unknown>;
}

// -------------------------------------------------------------
// 8. AI Observability & Tracing Interface
// -------------------------------------------------------------
export interface AgentTrace {
  executionId: string;
  conversationId: string;
  timestamp: string;
  intent: string;
  agent: string;
  tools: string[];
  toolCalls: Array<{ toolName: string; duration: number; success: boolean }>;
  memoryReads: string[];
  memoryInjected: boolean;
  ragReads: string[];
  executionTime: number;
  success: boolean;
  confidence: number;
  reasoningPath: string[];
  promptVersion: string;
  latency: number;
}

export interface IObservabilityService {
  startTrace(intent: string, agent: string): string;
  addReasoningStep(executionId: string, step: string): void;
  recordToolInvocation(executionId: string, toolName: string): void;
  recordMemoryRead(executionId: string, variable: string): void;
  recordRagRead(executionId: string, docId: string): void;
  completeTrace(executionId: string, success: boolean, confidence: number): Promise<AgentTrace>;
  getTrace(executionId: string): AgentTrace | null;
}

// -------------------------------------------------------------
// 9. Execution Planner Interface
// -------------------------------------------------------------
export interface PlanStep {
  agentName: string;
  input: string;
  order: number;
}

export interface ExecutionPlan {
  intent: string;
  steps: PlanStep[];
  confidence: number;
  reasoningPath: string[];
}

export interface IExecutionPlanner {
  plan(userMessage: string, context: ISessionContext, kernel: IKernel): Promise<ExecutionPlan>;
}

export interface IGeminiService {
  generateCompletion(prompt: string, options?: { temperature?: number }): Promise<string>;
}

// -------------------------------------------------------------
// 10. AI Kernel Interface
// -------------------------------------------------------------
export interface IKernel {
  agentRegistry: IAgentRegistry;
  toolRegistry: IToolRegistry;
  eventBus: IEventBus;
  observability: IObservabilityService;
  memoryService: IMemoryService;
  ragProvider: IRAGProvider;
  geminiService: IGeminiService;
}
