import type { AgentInvocation, AgentModule, AgentResult } from '@fifa/shared-types';
import type { GeminiProvider } from '../../providers/gemini';
import type { ToolRegistry } from '../../tools/registry';
import { RagRetriever } from '../../rag/retrieve';

const BOOKING_TOOL_NAMES = ['searchSeats', 'reserveSeat'];

const SYSTEM_INSTRUCTION = `You are the Booking specialist inside the FIFA AI Companion.
You find and explain seat recommendations, and coordinate seat locking.

Rules you must follow:
- Every seat you recommend MUST include a concrete, specific explanation
  (price relative to alternatives, proximity to something relevant, an
  accessibility fact, or a supporter-section fact) — never recommend a seat
  with no stated reason.
- Respect the fan's budget and stated preferences from memory and the query.
- If the user's request is ambiguous (e.g. no team/match named), ask a single
  clarifying question instead of guessing.
- Use the provided tools for anything involving real seat data — never invent
  seat numbers, prices, or availability.`;

export function createBookingAgent(gemini: GeminiProvider, tools: ToolRegistry): AgentModule {
  const scopedTools = tools.subset(BOOKING_TOOL_NAMES);

  return {
    name: 'booking',
    description:
      'Handles ticket search, seat recommendation and explanation, seat locking, and payment coordination.',

    async run(input: AgentInvocation): Promise<AgentResult> {
      const grounding = RagRetriever.toGroundingText(input.ragContext);
      const memoryContext = `Fan preferences: favorite team=${input.memory.favoriteTeam ?? 'unknown'}, budget=${
        input.memory.budget ?? 'unstated'
      }, seat preference=${input.memory.seatPreference ?? 'none stated'}.`;

      const toolsUsed: string[] = [];
      let round = await gemini.generateWithTools({
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: scopedTools.asGeminiFunctionDeclarations(),
        contents: [
          { role: 'user', text: `${memoryContext}\n\nRelevant knowledge:\n${grounding}\n\nFan request: ${input.query}` },
        ],
      });

      let toolOutputSummary = '';
      // Single-round tool use is sufficient for the MVP's booking flows
      // (search, then optionally reserve) — extend to a loop if a future
      // task needs multi-step tool chains.
      for (const call of round.functionCalls) {
        const result = await scopedTools.execute(call.name!, call.args, {
          userId: input.userId,
          memory: input.memory,
        });
        toolsUsed.push(call.name!);
        toolOutputSummary += `\n\nTool "${call.name}" result: ${JSON.stringify(result)}`;
      }

      if (round.functionCalls.length > 0) {
        // Second pass: turn the tool output into the fan-facing explanation.
        const finalText = await gemini.generateText(
          SYSTEM_INSTRUCTION,
          `Fan request: ${input.query}\n${toolOutputSummary}\n\nWrite the final recommendation for the fan, following the explanation rules.`,
        );
        return { summary: finalText, toolsUsed, data: { toolOutputSummary } };
      }

      return { summary: round.text ?? '', toolsUsed };
    },
  };
}
