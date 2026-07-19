/**
 * Shared contracts between apps/api, packages/ai, and apps/web.
 * These types are the load-bearing interfaces of the whole AI system —
 * do not change their shape without updating every consumer.
 */
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────
// Chat contract (POST /api/v1/chat)
// ─────────────────────────────────────────────────────────────────────────

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const AgentTraceEntrySchema = z.object({
  agent: z.enum(['booking', 'travel', 'matchCompanion', 'master']),
  summary: z.string(),
  toolsUsed: z.array(z.string()).default([]),
});
export type AgentTraceEntry = z.infer<typeof AgentTraceEntrySchema>;

export const ChatResponseSchema = z.object({
  conversationId: z.string().uuid(),
  response: z.string(),
  agentTrace: z.array(AgentTraceEntrySchema),
  payload: z
    .object({
      ticketId: z.string().uuid().optional(),
      travelPlanId: z.string().uuid().optional(),
      matchEvent: z.record(z.unknown()).optional(),
    })
    .partial()
    .optional(),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Memory
// ─────────────────────────────────────────────────────────────────────────

export const FanMemorySchema = z.object({
  userId: z.string().uuid(),
  favoriteTeam: z.string().nullable(),
  favoritePlayers: z.array(z.string()).default([]),
  language: z.string().default('en'),
  budget: z.number().nullable(),
  travelStyle: z.string().nullable(),
  foodPreference: z.string().nullable(),
  accessibilityNeeds: z.union([z.string(), z.array(z.string())]).nullable().default(null),
  seatPreference: z.string().nullable(),
  atmospherePreference: z.string().nullable(),
  groupType: z.string().nullable(),
  pastTicketsSummary: z.string().nullable(),
  travelHistorySummary: z.string().nullable(),
});
export type FanMemory = z.infer<typeof FanMemorySchema>;

/** Partial delta any agent can write back after handling a turn. */
export type FanMemoryDelta = Partial<Omit<FanMemory, 'userId'>>;

export const ConversationTurnSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  agentUsed: z.string().nullable(),
  timestamp: z.date(),
});
export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;

// ─────────────────────────────────────────────────────────────────────────
// RAG
// ─────────────────────────────────────────────────────────────────────────

export const RagChunkSchema = z.object({
  id: z.string().uuid(),
  sourceType: z.enum([
    'venue', 'city', 'faq', 'rule', 'emergency', 'travelGuide', 'restaurant', 'match',
  ]),
  title: z.string(),
  content: z.string(),
  score: z.number(),
});
export type RagChunk = z.infer<typeof RagChunkSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Tool layer
// ─────────────────────────────────────────────────────────────────────────

/** Minimal JSON-Schema-like shape the Gemini function-calling API accepts. */
export interface JsonSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
}

export interface ToolContext {
  userId: string;
  memory: FanMemory;
}

export interface Tool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  parameters: JsonSchema;
  inputSchema: z.ZodType<TInput>;
  execute(input: TInput, ctx: ToolContext): Promise<TOutput>;
}

// ─────────────────────────────────────────────────────────────────────────
// Specialized agent contract
// ─────────────────────────────────────────────────────────────────────────

export interface AgentInvocation {
  query: string;
  userId: string;
  memory: FanMemory;
  ragContext: RagChunk[];
  recentTurns: ConversationTurn[];
}

export interface AgentResult {
  summary: string;
  data?: Record<string, unknown>;
  toolsUsed: string[];
  memoryDelta?: FanMemoryDelta;
  /** Domain events this result should trigger on the Event Bus, e.g. 'BookingCompleted'. */
  events?: Array<{ type: string; payload: Record<string, unknown> }>;
}

export interface AgentModule {
  name: 'booking' | 'travel' | 'matchCompanion';
  description: string;
  run(input: AgentInvocation): Promise<AgentResult>;
}
