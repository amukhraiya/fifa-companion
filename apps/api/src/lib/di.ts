import { env } from '@fifa/config';
import { IAuthService, FirebaseAuthService, MockAuthService } from '../services/auth.service';
import { prisma } from './db';
import {
  EventBus,
  EventLogger,
  MemoryService,
  AgentRegistry,
  ToolRegistry,
  ObservabilityService,
  RAGService,
  MockGeminiService,
  GoogleGeminiService,
  Kernel,
  ConversationService,
  BookingAgent,
  TravelAgent,
  MatchCompanionAgent,
  WalletAgent,
  PostMatchAgent,
  SearchSeatsTool,
  ReserveSeatTool,
  WeatherTool,
  MapsTool,
  RouteTool,
  StatisticsTool,
  NewsTool,
  RestaurantTool,
  StadiumGuideTool,
  HotelTool,
  MedicalTool,
  CrowdPredictionTool,
  StadiumNavigationTool,
  EmergencyTool,
  TranslationTool,
  ReplayGuidanceTool,
} from '@fifa/ai';

let authService: IAuthService;

// Single configuration check to instantiate the requested Strategy.
if (env.AUTH_PROVIDER === 'firebase') {
  authService = new FirebaseAuthService();
} else {
  authService = new MockAuthService();
}

const agentRegistry = new AgentRegistry();
const toolRegistry = new ToolRegistry();
const eventBus = new EventBus();
const observability = new ObservabilityService();
const memoryService = new MemoryService(prisma);
const ragProvider = new RAGService(prisma);

// Instantiate Gemini Service based on environment
const hasGeminiKey = !!env.GEMINI_API_KEY;
console.log(`\n[AI TRACE] GEMINI_API_KEY detected: ${hasGeminiKey}`);
console.log(`[AI TRACE] Instantiating ${hasGeminiKey ? 'GoogleGeminiService' : 'MockGeminiService'}`);

const geminiService = hasGeminiKey
  ? new GoogleGeminiService(env.GEMINI_API_KEY!, env.GEMINI_MODEL!)
  : new MockGeminiService();

const kernel = new Kernel({
  agentRegistry,
  toolRegistry,
  eventBus,
  observability,
  memoryService,
  ragProvider,
  geminiService,
});

// 1. Register Tools (Refinement 5)
toolRegistry.registerTool(new SearchSeatsTool());
toolRegistry.registerTool(new ReserveSeatTool());
toolRegistry.registerTool(new WeatherTool());
toolRegistry.registerTool(new MapsTool());
toolRegistry.registerTool(new RouteTool());
toolRegistry.registerTool(new StatisticsTool());
toolRegistry.registerTool(new NewsTool());
toolRegistry.registerTool(new RestaurantTool());
toolRegistry.registerTool(new StadiumGuideTool());
toolRegistry.registerTool(new HotelTool());
toolRegistry.registerTool(new MedicalTool());
toolRegistry.registerTool(new CrowdPredictionTool());
toolRegistry.registerTool(new StadiumNavigationTool());
toolRegistry.registerTool(new EmergencyTool());
toolRegistry.registerTool(new TranslationTool());
toolRegistry.registerTool(new ReplayGuidanceTool());

// 2. Register Agents (Refinement 3)
agentRegistry.registerAgent({ name: 'booking', run: async () => ({ summary: '', toolsUsed: [] }) } as any);
agentRegistry.registerAgent({ name: 'travel', run: async () => ({ summary: '', toolsUsed: [] }) } as any);
agentRegistry.registerAgent({ name: 'matchCompanion', run: async () => ({ summary: '', toolsUsed: [] }) } as any);
agentRegistry.registerAgent(new WalletAgent());
agentRegistry.registerAgent(new PostMatchAgent());

// 3. Register subscribers
const eventLogger = new EventLogger(prisma);
eventLogger.register(eventBus);

// 4. Initialize Conversation Lifecycle Service (Refinement 1)
const conversationService = new ConversationService(kernel);

import { reservationService } from '../services/reservation.service';

export { authService, eventBus, memoryService, conversationService, kernel, reservationService };
