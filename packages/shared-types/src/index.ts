import { z } from 'zod';

// Base API Error Schema
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// Standard API Response Wrapper
export const createApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: ApiErrorSchema.optional(),
  });

// User schemas
export const UserRoleSchema = z.enum(['Fan', 'Admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: UserRoleSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type User = z.infer<typeof UserSchema>;

// Fan Memory (long-term profile)
export const FanMemorySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  favoriteTeam: z.string().nullable(),
  favoritePlayers: z.array(z.string()).default([]),
  language: z.string().default('en'),
  budget: z.number().nullable(),
  travelStyle: z.string().nullable(),
  foodPreference: z.string().nullable(),
  accessibilityNeeds: z.string().nullable(),
  seatPreference: z.string().nullable(),
  atmospherePreference: z.string().nullable(),
  groupType: z.string().nullable(),
  pastTicketsSummary: z.string().nullable(),
  travelHistorySummary: z.string().nullable(),
  updatedAt: z.date(),
});
export type FanMemory = z.infer<typeof FanMemorySchema>;

// Conversation Turn (short-term memory)
export const ConversationTurnSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  agentUsed: z.string().nullable(),
  timestamp: z.date(),
});
export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;

// Health Status Response Schema
export const HealthStatusSchema = z.object({
  status: z.string(),
  uptime: z.number(),
  environment: z.string(),
  database: z.string(),
});
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export * from './agents';
