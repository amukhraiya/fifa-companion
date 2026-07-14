import crypto from 'crypto';
import { IAgent, IAgentRegistry, ITool, IToolRegistry } from '../interfaces';


export class AgentRegistry implements IAgentRegistry {
  private agents = new Map<string, IAgent>();

  registerAgent(agent: IAgent): void {
    if (this.agents.has(agent.name)) {
      throw new Error(`Agent ${agent.name} is already registered.`);
    }
    this.agents.set(agent.name, agent);
  }

  getAgent(name: string): IAgent | null {
    return this.agents.get(name) || null;
  }

  listAgents(): IAgent[] {
    return Array.from(this.agents.values());
  }

  findAgentsByCapability(capability: string): IAgent[] {
    return this.listAgents().filter(agent => agent.capabilities.includes(capability));
  }
}

export class ToolRegistry implements IToolRegistry {
  private tools = new Map<string, ITool>();

  registerTool(tool: ITool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} is already registered.`);
    }
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): ITool | null {
    return this.tools.get(name) || null;
  }

  listTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  async executeTool(name: string, input: unknown): Promise<unknown> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found in registry.`);
    }

    if (!tool.validate(input)) {
      throw new Error(`Invalid arguments supplied to tool ${name}.`);
    }

    const executionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

    try {
      const output = await tool.execute(input);
      tool.observe(executionId, input, output);
      return output;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      tool.observe(executionId, input, null, err);
      throw error;
    }
  }
}
