import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { AgentRegistry, ToolRegistry } from './registry';
import { SessionContext } from './context';
import { ExecutionPlanner } from './planner';
import { EventBus } from './events';
import { PromptManager } from './prompts';
import { ObservabilityService } from './trace';
import { MasterAgent } from './master-agent';
import { IAgent, ITool, ToolMetadata, IKernel } from './interfaces';
import { MockGeminiService } from './gemini';

// -------------------------------------------------------------
// Mocks for Tests
// -------------------------------------------------------------
class MockRAGProvider {
  async search(_query: string) {
    return [{ id: 'doc-1', sourceType: 'FifaFAQ', title: 'Ticket rules', content: 'You can transfer tickets.', score: 0.95 }];
  }
  async retrieve() { return null; }
  async index() {}
}

class MockMemoryService {
  async loadFanMemory() { return { favoriteTeam: 'Argentina' }; }
  async updateFanMemory() {}
  async saveConversationTurn() {}
}

const mockAgent: IAgent = {
  name: 'TestBookingAgent',
  version: '1.0.0',
  description: 'Handles seat bookings',
  capabilities: ['booking'],
  priority: 10,
  execute: async (_context, _kernel) => {
    return {
      agentName: 'TestBookingAgent',
      success: true,
      data: { message: 'Booking processed successfully.' },
      confidence: 0.95,
      reasoning: 'Mock processed ticket booking.',
    };
  },
};

const AddSchema = z.object({
  a: z.number(),
  b: z.number(),
});

class AddTool implements ITool {
  name = 'AddTool';
  description = 'Adds two numbers';
  discover(): ToolMetadata {
    return { name: this.name, description: this.description, schema: AddSchema };
  }
  validate(input: unknown): boolean {
    return AddSchema.safeParse(input).success;
  }
  async execute(input: unknown): Promise<number> {
    const parsed = AddSchema.parse(input);
    return parsed.a + parsed.b;
  }
  observe(_executionId: string, _input: unknown, _output: unknown, _error?: Error): void {}
}

// -------------------------------------------------------------
// Test Suites
// -------------------------------------------------------------
describe('1. Registry Tests', () => {
  it('should register and retrieve agents', () => {
    const registry = new AgentRegistry();
    registry.registerAgent(mockAgent);
    
    expect(registry.getAgent('TestBookingAgent')).toBe(mockAgent);
    expect(registry.listAgents().length).toBe(1);
  });

  it('should discover agents dynamically based on capabilities', () => {
    const registry = new AgentRegistry();
    registry.registerAgent(mockAgent);

    const bookingAgents = registry.findAgentsByCapability('booking');
    expect(bookingAgents.length).toBe(1);
    expect(bookingAgents[0]?.name).toBe('TestBookingAgent');

    const travelAgents = registry.findAgentsByCapability('travel');
    expect(travelAgents.length).toBe(0);
  });

  it('should register and execute tools with validation checks', async () => {
    const registry = new ToolRegistry();
    const addTool = new AddTool();
    registry.registerTool(addTool);

    expect(registry.getTool('AddTool')).toBe(addTool);

    // Valid execution
    const result = await registry.executeTool('AddTool', { a: 5, b: 10 });
    expect(result).toBe(15);

    // Invalid execution
    await expect(registry.executeTool('AddTool', { a: '5', b: 10 })).rejects.toThrow();
  });
});

describe('2. Session Context Tests', () => {
  it('should initialize context correctly and store FanMemory snapshot', () => {
    const context = new SessionContext({
      currentUser: { id: 'u-1', email: 'test@fifa.com', role: 'Fan' },
      language: 'es',
      fanMemory: { favoriteTeam: 'Spain' },
    });

    expect(context.currentUser?.role).toBe('Fan');
    expect(context.language).toBe('es');
    expect(context.fanMemory?.favoriteTeam).toBe('Spain');
  });
});

describe('3. Execution Planner Tests', () => {
  it('should map capability requirements and order steps based on query keywords', async () => {
    const kernel: IKernel = {
      agentRegistry: new AgentRegistry(),
      toolRegistry: new ToolRegistry(),
      eventBus: new EventBus(),
      observability: new ObservabilityService(),
      memoryService: new MockMemoryService(),
      ragProvider: new MockRAGProvider(),
      geminiService: new MockGeminiService(),
    };
    kernel.agentRegistry.registerAgent(mockAgent);

    const planner = new ExecutionPlanner();
    const context = new SessionContext();
    
    // Test transactional intent mapping
    const plan = await planner.plan('I want to book seat tickets', context, kernel);
    expect(plan.intent).toBe('booking');
    expect(plan.steps.length).toBe(1);
    expect(plan.steps[0]?.agentName).toBe('TestBookingAgent');

    // Test default fallback
    const fallbackPlan = await planner.plan('Hello there', context, kernel);
    expect(fallbackPlan.intent).toBe('q&a');
    expect(fallbackPlan.steps.length).toBe(0);
  });
});

describe('4. Event Bus Tests', () => {
  it('should publish events and invoke subscribers asynchronously', () => {
    return new Promise<void>((resolve) => {
      const bus = new EventBus();
      bus.subscribe('BookingCompleted', (payload) => {
        const typedPayload = payload as { userId: string };
        expect(typedPayload.userId).toBe('user-100');
        resolve();
      });
      bus.publish('BookingCompleted', { userId: 'user-100' });
    });
  });
});

describe('5. Prompt Manager Tests', () => {
  it('should fetch prompt template files from prompts directory', () => {
    const manager = new PromptManager();
    const prompt = manager.getPrompt('master-agent', 'system', 'v1');
    expect(prompt).toContain('Master Agent System Prompt');
  });
});

describe('6. Observability and Master Agent Tests', () => {
  it('should complete coordinated Master Agent turns and write trace telemetry', async () => {
    const kernel: IKernel = {
      agentRegistry: new AgentRegistry(),
      toolRegistry: new ToolRegistry(),
      eventBus: new EventBus(),
      observability: new ObservabilityService(),
      memoryService: new MockMemoryService(),
      ragProvider: new MockRAGProvider(),
      geminiService: new MockGeminiService(),
    };
    kernel.agentRegistry.registerAgent(mockAgent);

    const planner = new ExecutionPlanner();
    const master = new MasterAgent(kernel, planner);
    const context = new SessionContext({
      fanMemory: { favoriteTeam: 'France' },
    });

    const result = await master.handleMessage('book seats for the game', context);
    expect(result.response).toContain('Booking processed successfully.');
    expect(result.traceId).toBeDefined();

    const trace = kernel.observability.getTrace(result.traceId);
    expect(trace).toBeDefined();
    expect(trace?.intent).toBe('booking');
    expect(trace?.success).toBe(true);
    expect(trace?.reasoningPath.length).toBeGreaterThan(0);
    expect(trace?.memoryReads).toContain('fanMemory');
  });
});
