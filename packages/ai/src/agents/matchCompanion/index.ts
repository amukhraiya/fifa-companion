import type { AgentInvocation, AgentModule, AgentResult } from '@fifa/shared-types';
import type { GeminiProvider } from '../../providers/gemini';
import type { ToolRegistry } from '../../tools/registry';
import { RagRetriever } from '../../rag/retrieve';

const MATCH_TOOL_NAMES = ['getMatchStatistics'];

const SYSTEM_INSTRUCTION = `You are the Match Companion specialist inside the FIFA AI Companion.
You explain goals, cards, VAR decisions, substitutions, and tactics in plain,
non-jargon language, and generate match summaries and personalized post-match
stories.

Rules you must follow:
- Match your vocabulary to the moment: a goal explanation should feel
  exciting; a tactical explanation should be clear but not condescending.
- Never invent a scoreline, player name, or statistic — pull real facts from
  the getMatchStatistics tool, and say so plainly if the requested match
  isn't in the dataset.
- When generating a post-match story, reference only real data the fan
  actually has (their ticket, their travel plan) — never fabricate specific
  numbers like distance traveled if that data isn't available.`;

export function createMatchCompanionAgent(gemini: GeminiProvider, tools: ToolRegistry): AgentModule {
  const scopedTools = tools.subset(MATCH_TOOL_NAMES);

  return {
    name: 'matchCompanion',
    description:
      'Explains live match events, provides tactical analysis, and generates match summaries and post-match stories.',

    async run(input: AgentInvocation): Promise<AgentResult> {
      const grounding = RagRetriever.toGroundingText(input.ragContext);

      const toolsUsed: string[] = [];
      const round = await gemini.generateWithTools({
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: scopedTools.asGeminiFunctionDeclarations(),
        contents: [
          { role: 'user', text: `Relevant knowledge:\n${grounding}\n\nFan request: ${input.query}` },
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
          `Fan request: ${input.query}\n${toolOutputSummary}\n\nWrite the final explanation/summary for the fan.`,
        );
        return { summary: finalText, toolsUsed, data: { toolOutputSummary } };
      }

      return { summary: round.text ?? '', toolsUsed };
    },
  };
}
