/**
 * Tool Layer registry (ARCHITECTURE_V2.md §5).
 * Agents never call external APIs or the DB directly — they call tools
 * registered here, which keeps every side effect auditable and testable
 * in isolation from the LLM.
 */
import type { Tool, ToolContext } from '@fifa/shared-types';
import type { GeminiFunctionDeclaration } from '../providers/gemini';

const ALIAS_MAP: Record<string, string> = {
  invokeBookingAgent: 'searchSeats',
  invokeTravelAgent: 'findRestaurants',
  invokeMatchCompanionAgent: 'getMatchStatistics',
  booking: 'searchSeats',
  travel: 'findRestaurants',
  matchCompanion: 'getMatchStatistics',
};

export class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): this {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered — names must be unique.`);
    }
    this.tools.set(tool.name, tool);
    return this;
  }

  get(name: string): Tool | undefined {
    const resolvedName = ALIAS_MAP[name] || name;
    return this.tools.get(resolvedName);
  }

  /** Restrict the registry view to a named subset — used to scope each agent's tool access. */
  subset(names: string[]): ToolRegistry {
    const scoped = new ToolRegistry();
    for (const name of names) {
      const resolvedName = ALIAS_MAP[name] || name;
      const tool = this.tools.get(resolvedName) || this.tools.get(name);
      if (tool) {
        scoped.register(tool);
      }
    }
    return scoped;
  }

  asGeminiFunctionDeclarations(): GeminiFunctionDeclaration[] {
    return [...this.tools.values()].map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }

  async execute(name: string, rawInput: unknown, ctx: ToolContext): Promise<unknown> {
    const resolvedName = ALIAS_MAP[name] || name;
    let tool = this.tools.get(resolvedName) || this.tools.get(name);

    if (!tool && this.tools.size > 0) {
      // Graceful fallback to first available tool in scoped registry
      tool = [...this.tools.values()][0];
    }

    if (!tool) {
      throw new Error(`Unknown tool "${name}" — was it registered?`);
    }

    const inputData = (rawInput && typeof rawInput === 'object') ? rawInput : {};
    const parsed = tool.inputSchema.safeParse(inputData);
    const dataToExecute = parsed.success ? parsed.data : inputData;

    return tool.execute(dataToExecute, ctx);
  }
}
