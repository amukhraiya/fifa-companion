/**
 * Composition root for the FIFA Commander.
 *
 * ANTIGRAVITY: this file is the integration point. Wired with the real singleton from
 * apps/api/src/lib/db.ts.
 */
import {
  GeminiProvider,
  V2ToolRegistry as ToolRegistry,
  allPlaceholderTools,
  FanMemoryService,
  V2ConversationService as ConversationService,
  RagRetriever,
  V2EventBus as EventBus,
  registerCoreEventFlows,
  createBookingAgent,
  createTravelAgent,
  createMatchCompanionAgent,
  FifaCommander,
} from '@fifa/ai';
import { prisma } from './db';

const gemini = new GeminiProvider();

const tools = new ToolRegistry();
for (const tool of allPlaceholderTools) tools.register(tool);

const fanMemory = new FanMemoryService(prisma as any);
const conversation = new ConversationService(prisma as any);
const rag = new RagRetriever(prisma as any, gemini);

const eventBus = new EventBus(prisma as any);
registerCoreEventFlows(eventBus);

const agents = {
  booking: createBookingAgent(gemini, tools),
  travel: createTravelAgent(gemini, tools),
  matchCompanion: createMatchCompanionAgent(gemini, tools),
};

export const fifaCommander = new FifaCommander({
  gemini,
  fanMemory,
  conversation,
  rag,
  eventBus,
  agents,
});
