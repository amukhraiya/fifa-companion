import {
  IKernel,
  IAgentRegistry,
  IToolRegistry,
  IEventBus,
  IObservabilityService,
  IMemoryService,
  IRAGProvider,
  IGeminiService,
} from '../interfaces';

export class Kernel implements IKernel {
  agentRegistry: IAgentRegistry;
  toolRegistry: IToolRegistry;
  eventBus: IEventBus;
  observability: IObservabilityService;
  memoryService: IMemoryService;
  ragProvider: IRAGProvider;
  geminiService: IGeminiService;

  constructor(init: {
    agentRegistry: IAgentRegistry;
    toolRegistry: IToolRegistry;
    eventBus: IEventBus;
    observability: IObservabilityService;
    memoryService: IMemoryService;
    ragProvider: IRAGProvider;
    geminiService: IGeminiService;
  }) {
    this.agentRegistry = init.agentRegistry;
    this.toolRegistry = init.toolRegistry;
    this.eventBus = init.eventBus;
    this.observability = init.observability;
    this.memoryService = init.memoryService;
    this.ragProvider = init.ragProvider;
    this.geminiService = init.geminiService;
  }
}
