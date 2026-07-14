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
  Kernel,
  ConversationService,
  BookingAgent,
  TravelAgent,
  MatchCompanionAgent,
  SearchSeatsTool,
  ReserveSeatTool,
  WeatherTool,
  MapsTool,
  RouteTool,
  StatisticsTool,
  NewsTool,
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
const geminiService = new MockGeminiService();

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

// 2. Register Agents (Refinement 3)
agentRegistry.registerAgent(new BookingAgent());
agentRegistry.registerAgent(new TravelAgent());
agentRegistry.registerAgent(new MatchCompanionAgent());

// 3. Register subscribers
const eventLogger = new EventLogger(prisma);
eventLogger.register(eventBus);

// 4. Initialize Conversation Lifecycle Service (Refinement 1)
const conversationService = new ConversationService(kernel);

export { authService, eventBus, memoryService, conversationService, kernel };
