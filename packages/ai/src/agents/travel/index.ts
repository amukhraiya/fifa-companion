import type { AgentInvocation, AgentModule, AgentResult } from '@fifa/shared-types';
import type { GeminiProvider } from '../../providers/gemini';
import type { ToolRegistry } from '../../tools/registry';
import { RagRetriever } from '../../rag/retrieve';

const TRAVEL_TOOL_NAMES = ['getWeather', 'findRestaurants'];

const SYSTEM_INSTRUCTION = `You are the Travel specialist inside the FIFA AI Companion.
You build personalized, time-aware itineraries around a fan's match day, and
answer free-form city-exploration questions ("I have 4 hours before kickoff").

Rules you must follow:
- Respect stated budget, group type (family/friends/solo), and dietary
  preferences from memory when recommending restaurants or activities.
- Be explicit about timing — every itinerary stop should have an estimated
  time, not just an order.
- Use tools for weather and restaurant data — never invent specific facts
  about a real city or venue.
- If a time constraint makes the request infeasible (e.g. "visit 5 museums in
  1 hour"), say so plainly and offer a realistic alternative instead of
  silently ignoring the constraint.`;

export function createTravelAgent(gemini: GeminiProvider, tools: ToolRegistry): AgentModule {
  const scopedTools = tools.subset(TRAVEL_TOOL_NAMES);

  return {
    name: 'travel',
    description:
      'Builds travel itineraries, recommends restaurants and attractions, and answers city-exploration questions.',

    async run(input: AgentInvocation): Promise<AgentResult> {
      const grounding = RagRetriever.toGroundingText(input.ragContext);
      const memoryContext = `Fan preferences: travel style=${input.memory.travelStyle ?? 'unstated'}, budget=${
        input.memory.budget ?? 'unstated'
      }, group type=${input.memory.groupType ?? 'unstated'}, food preference=${
        input.memory.foodPreference ?? 'none stated'
      }.`;

      const toolsUsed: string[] = [];
      const round = await gemini.generateWithTools({
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: scopedTools.asGeminiFunctionDeclarations(),
        contents: [
          { role: 'user', text: `${memoryContext}\n\nRelevant knowledge:\n${grounding}\n\nFan request: ${input.query}` },
        ],
      });

      let toolOutputSummary = '';
      for (const call of round.functionCalls) {
        const result = await scopedTools.execute(call.name!, call.args, {
          userId: input.userId,
          memory: input.memory,
        });
        toolsUsed.push(call.name!);
        toolOutputSummary += `\n\nTool "${call.name}" result: ${JSON.stringify(result)}`;
      }

      if (round.functionCalls.length > 0) {
        const finalText = await gemini.generateText(
          SYSTEM_INSTRUCTION,
          `Fan request: ${input.query}\n${toolOutputSummary}\n\nWrite the final itinerary/answer for the fan.`,
        );
        return { summary: finalText, toolsUsed, data: { toolOutputSummary } };
      }

      return { summary: round.text ?? '', toolsUsed };
    },
  };
}
