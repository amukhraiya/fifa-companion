import {
  IKernel,
  IAgentRegistry,
  IToolRegistry,
  IEventBus,
  IObservabilityService,
  IMemoryService,
  IRAGProvider,
} from '../interfaces';

export class Kernel implements IKernel {
  agentRegistry: IAgentRegistry;
  toolRegistry: IToolRegistry;
  eventBus: IEventBus;
  observability: IObservabilityService;
  memoryService: IMemoryService;
  ragProvider: IRAGProvider;

  constructor(init: {
    agentRegistry: IAgentRegistry;
    toolRegistry: IToolRegistry;
    eventBus: IEventBus;
    observability: IObservabilityService;
    memoryService: IMemoryService;
    ragProvider: IRAGProvider;
  }) {
    this.agentRegistry = init.agentRegistry;
    this.toolRegistry = init.toolRegistry;
    this.eventBus = init.eventBus;
    this.observability = init.observability;
    this.memoryService = init.memoryService;
    this.ragProvider = init.ragProvider;
  }
}
