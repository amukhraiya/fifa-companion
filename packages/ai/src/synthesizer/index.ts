import { AgentResult, ISessionContext, ExecutionPlan, IGeminiService } from '../interfaces';
import { ExtendedExecutionPlan } from '../planner';
import {
  FIFA_2026_FIXTURES,
  FIFA_2026_TEAMS,
  getFixturesForTeam,
  getCheapestFixtureForTeam,
  findMatchesWithinBudgetINR,
  estimateTripCostINR,
} from '../data/fifaFixtures';

export interface SynthesizerResponse {
  message: string;
  confidence: number;
  explanation?: {
    recommendedMatch: string;
    justifications: string[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ResponseSynthesizer
//
// Upgraded to:
//   1. Use Gemini to generate natural, contextual, reasoning-rich responses
//   2. Inject real agent data + fan memory + conversation context into prompts
//   3. Leverage FIFA 2026 demo dataset for factual grounding
//   4. Graceful fallback to structured template response
// ─────────────────────────────────────────────────────────────────────────────
export class ResponseSynthesizer {

  synthesize(
    query: string,
    context: ISessionContext,
    plan: ExecutionPlan,
    results: AgentResult[],
  ): SynthesizerResponse {
    // This synchronous entry point is kept for backward compatibility.
    // It uses the structured fallback logic. For Gemini responses, use synthesizeWithAI().
    return this.structuredFallback(query, context, plan, results);
  }

  /**
   * Primary synthesis path — uses Gemini for intelligent, contextual responses.
   * Falls back to structuredFallback if Gemini is unavailable.
   */
  async synthesizeWithAI(
    query: string,
    context: ISessionContext,
    plan: ExecutionPlan,
    results: AgentResult[],
    gemini: IGeminiService,
    extraContext?: { memoryContext: string; knowledgeContext: string; liveDataContext: string }
  ): Promise<SynthesizerResponse> {
    try {
      return await this.geminiSynthesize(query, context, plan, results, gemini, extraContext);
    } catch {
      return this.structuredFallback(query, context, plan, results);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Gemini Synthesis
  // ──────────────────────────────────────────────────────────────────────────
  private async geminiSynthesize(
    query: string,
    context: ISessionContext,
    plan: ExecutionPlan,
    results: AgentResult[],
    gemini: IGeminiService,
    extraContext?: { memoryContext: string; knowledgeContext: string; liveDataContext: string }
  ): Promise<SynthesizerResponse> {
    const memory = context.fanMemory as Record<string, unknown> | null;
    const conversationHistory = (context.conversationState?.history as string) ?? '';

    // Build FIFA dataset context relevant to the query
    const fixtureContext = this.buildFixtureContext(query, memory);

    // Build agent results summary
    const agentSummary = results.map(r => (
      `Agent: ${r.agentName} | Success: ${r.success} | Confidence: ${r.confidence}\n` +
      `Reasoning: ${r.reasoning}\n` +
      `Data: ${JSON.stringify(r.data, null, 2)}`
    )).join('\n\n---\n\n');

    // Build fan memory context
    const memoryStr = memory
      ? `Fan DNA Profile:
- Favorite Team: ${memory.favoriteTeam ?? 'Not set'}
- Budget: $${memory.budget ?? 'Not specified'}
- Travel Style: ${memory.travelStyle ?? 'Balanced'}
- Seat Preference: ${memory.seatPreference ?? 'Category 2'}
- Food Preference: ${memory.foodPreference ?? 'No restrictions'}
- Accessibility: ${memory.accessibilityNeeds ?? 'None'}
- Favorite Players: ${Array.isArray(memory.favoritePlayers) ? memory.favoritePlayers.join(', ') : 'Not specified'}
- Match Interests: ${Array.isArray(memory.matchInterests) ? memory.matchInterests.join(', ') : 'All stages'}`
      : 'No fan profile available yet.';

    const prompt = `# COMMANDER AI COGNITIVE ARCHITECTURE

You are Commander AI.

You are NOT a chatbot.

You are an intelligent decision-making system whose primary responsibility is to understand the user's objective before deciding how to respond.

Never rush to answer.

Always determine the best next action first.

==========================================================
MISSION
==========================================================

Your job is NOT to answer questions.

Your job is to help users accomplish their goals.

Every request should be treated as a problem-solving task.

Sometimes the correct action is answering.

Sometimes it is asking follow-up questions.

Sometimes it is retrieving memory.

Sometimes it is searching knowledge.

Sometimes it is invoking tools.

Sometimes it is combining all of them.

==========================================================
COGNITIVE PIPELINE
==========================================================

Every request MUST pass through the following reasoning stages.

----------------------------------------------------------
STEP 1 — UNDERSTAND USER GOAL
----------------------------------------------------------

Identify what the user is trying to accomplish.

Do NOT classify by topic.

Classify by objective.

Possible objectives include:

LEARN
PLAN
BOOK
COMPARE
DISCOVER
OPTIMIZE
EXECUTE
MONITOR
RECOMMEND
REMEMBER
ANALYZE
TROUBLESHOOT

Example

"Plan a 5-day trip"

Goal:
PLAN

NOT

FOOTBALL

----------------------------------------------------------
STEP 2 — EXTRACT CONSTRAINTS
----------------------------------------------------------

Identify every explicit or implicit constraint.

Examples

Budget

Travel dates

Origin

Destination

Favourite team

Preferred stadium

Hotel preference

Seat preference

Visa requirements

Accessibility needs

Children

Family

Friends

Language

Transport

Every constraint should influence planning.

----------------------------------------------------------
STEP 3 — CHECK INFORMATION SUFFICIENCY
----------------------------------------------------------

Determine whether enough information exists to accomplish the goal.

If important information is missing:

DO NOT GUESS.

DO NOT HALLUCINATE.

Ask only the minimum number of follow-up questions required.

Examples

Trip planning

Missing:

• departure city

• budget

• travel dates

• accommodation style

↓

Ask for them.

NOT generate an itinerary.

----------------------------------------------------------
STEP 4 — DECIDE WHICH CAPABILITIES ARE REQUIRED
----------------------------------------------------------

For every request decide whether you need

Memory

Knowledge

Live Football Data

Application Tools

Reasoning Only

Each capability should only be used if it improves the answer.

Never invoke unnecessary tools.

----------------------------------------------------------
STEP 5 — BUILD CONTEXT
----------------------------------------------------------

Construct context using only relevant information.

Order

1 System Prompt

2 Relevant Memories

3 Conversation Summary

4 Retrieved Knowledge

5 Live Football Information

6 Tool Results

7 Current User Request

Never overload the model with irrelevant context.

----------------------------------------------------------
STEP 6 — REASON
----------------------------------------------------------

Reason over the collected information.

Compare options.

Evaluate tradeoffs.

Identify risks.

Identify assumptions.

Generate recommendations.

Never merely repeat retrieved information.

----------------------------------------------------------
STEP 7 — RESPOND
----------------------------------------------------------

Produce a natural conversational response.

If clarification is required,

ask concise questions.

If enough information exists,

produce the complete solution.

==========================================================
DECISION RULES
==========================================================

If confidence is LOW

↓

Ask questions.

If confidence is HIGH

↓

Answer.

If action is required

↓

Use tools.

If official knowledge is required

↓

Use RAG.

If live information is required

↓

Use Football Intelligence.

If personalization improves the answer

↓

Retrieve Memory.

==========================================================
TRAVEL PLANNING RULES
==========================================================

When planning trips,

never generate generic itineraries immediately.

First verify:

Travel origin

Travel dates

Budget

Match preference

Ticket status

Accommodation preference

Number of travellers

After gathering this information,

generate:

• itinerary

• estimated costs

• flights

• transport

• hotels

• nearby attractions

• local food

• backup recommendations

• live match schedule

==========================================================
FOOTBALL RULES
==========================================================

For

scores

fixtures

standings

injuries

transfers

news

use Live Football Intelligence.

Never fabricate current events.

If live data cannot be retrieved,

state this clearly.

==========================================================
MEMORY RULES
==========================================================

Use memory only when relevant.

Examples

Favourite team

Favourite players

Budget

Language

Travel history

Seat preference

Past bookings

Never invent memories.

==========================================================
KNOWLEDGE RULES
==========================================================

Use RAG for

FIFA regulations

Tournament format

Host cities

Visa rules

Stadiums

Historical tournaments

Travel guides

Never hallucinate official information.

==========================================================
TOOLS
==========================================================

Application tools should only be used for

Bookings

Hotels

Flights

Wallet

Notifications

Trip management

Never invoke tools simply because they exist.

==========================================================
WHAT MAKES A GREAT COMMANDER AI
==========================================================

Commander AI should behave like an experienced travel planner, football analyst, and personal assistant combined.

It should:

Understand the user's goal before answering.

Recognize missing information.

Ask intelligent follow-up questions.

Retrieve only relevant context.

Reason before responding.

Provide recommendations with clear justification.

Adapt to the user's preferences and history.

Every response should move the user closer to accomplishing their objective.

Never optimize for answering quickly.

Optimize for making the best decision.

---
## RETRIEVED CONTEXT

## RELEVANT MEMORIES
${extraContext?.memoryContext || 'No additional memories retrieved.'}

## PREVIOUS CONVERSATION
${conversationHistory || 'This is the first message in this conversation.'}

## RETRIEVED KNOWLEDGE
${extraContext?.knowledgeContext || 'No additional knowledge retrieved.'}

## LIVE FOOTBALL DATA
${extraContext?.liveDataContext || 'No live football data retrieved.'}

## AGENT RESULTS
${agentSummary || 'No specialized agents were invoked for this query.'}

## FIFA 2026 FIXTURE DATA (Demo Dataset)
${fixtureContext}

## USER QUERY
"${query}"

Write your response now:`;

    // eslint-disable-next-line no-console
    console.log('\n--------------------------------------------------\nLOG 5\nFinal prompt sent to Gemini\nTHIS IS CRITICAL.\nPrint the exact prompt.\n--------------------------------------------------\n', prompt);

    const raw = await gemini.generateCompletion(prompt, { temperature: 0.4 });

    // eslint-disable-next-line no-console
    console.log('\n--------------------------------------------------\nLOG 6\nGemini raw response\n--------------------------------------------------\n', raw);

    // Extract justifications from the response for the explanation field
    const justifications = this.extractJustifications(query, context, results);
    const recommendedMatch = this.inferRecommendedMatch(query, memory);

    // eslint-disable-next-line no-console
    console.log(`[AI TRACE] SYNTHESIZED RESPONSE: "${raw.substring(0, 100).replace(/\n/g, ' ')}..."`);

    return {
      message: raw,
      confidence: results.length > 0
        ? parseFloat((results.reduce((s, r) => s + r.confidence, 0) / results.length).toFixed(2))
        : 0.85,
      explanation:
        justifications.length > 0
          ? { recommendedMatch, justifications }
          : undefined,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Structured Fallback — used when Gemini is unavailable
  // ──────────────────────────────────────────────────────────────────────────
  private structuredFallback(
    query: string,
    context: ISessionContext,
    plan: ExecutionPlan,
    results: AgentResult[],
  ): SynthesizerResponse {
    const memory = context.fanMemory as Record<string, unknown> | null;
    const queryLower = query.toLowerCase();

    // Calculate averageConfidence
    const averageConfidence =
      results.length > 0
        ? parseFloat((results.reduce((s, r) => s + r.confidence, 0) / results.length).toFixed(2))
        : 0.8;

    // Check for relevant fixture data
    const fixtureContext = this.buildFixtureContext(query, memory);
    const hasFixtures = FIFA_2026_FIXTURES.length > 0;

    let reply = '';

    // ── Memory reference preamble ──
    const favTeam = (memory?.favoriteTeam as string) ?? '';
    if (favTeam && queryLower.includes(favTeam.toLowerCase())) {
      reply += `Since you're a **${favTeam}** fan, I've prioritized their fixtures for you.\n\n`;
    }

    // ── Budget trip planning ──
    if (queryLower.match(/budget|₹|inr|trip|plan/)) {
      const budgetMatch = query.match(/₹\s?([\d,]+)|(\d+)\s*(?:k|lakh|thousand)/i);
      const budgetINR = budgetMatch
        ? parseInt((budgetMatch[1] ?? budgetMatch[2] ?? '75000').replace(',', ''))
        : 75000;

      const teamFromQuery = favTeam || 'Brazil';
      const matches = findMatchesWithinBudgetINR(budgetINR, teamFromQuery);

      if (matches.length > 0) {
        const best = matches[0]!;
        reply += `⚽ **Best match within your ₹${budgetINR.toLocaleString('en-IN')} budget:**\n\n`;
        reply += `**${best.match.homeTeam} vs ${best.match.awayTeam}** — ${best.match.stage}\n`;
        reply += `📍 ${best.match.stadium}, ${best.match.city}\n`;
        reply += `📅 ${new Date(best.match.date).toDateString()} at ${best.match.kickoffTime}\n`;
        reply += `🎟️ Category 3 ticket: $${best.cost.ticketUSD} | Hotel (3 nights): $${best.cost.hotelUSD}\n`;
        reply += `💰 **Estimated total: ₹${best.cost.totalINR.toLocaleString('en-IN')}** (includes meals & transport)\n\n`;
        reply += `This is the most budget-friendly option I found — it fits within your limit with room to spare for match-day experiences.\n\n`;
        reply += `**You might also want to:**\n`;
        reply += `- Check available seats for this match\n`;
        reply += `- Plan travel routes from your city to ${best.match.city}\n`;
        reply += `- See hotel options near ${best.match.stadium}\n`;
      } else {
        reply += `I couldn't find ${teamFromQuery} fixtures within ₹${budgetINR.toLocaleString('en-IN')}. Here's the next best option:\n\n`;
        const cheapest = getCheapestFixtureForTeam(teamFromQuery);
        if (cheapest) {
          const cost = estimateTripCostINR(cheapest, 'category3', 3);
          reply += `**${cheapest.homeTeam} vs ${cheapest.awayTeam}** — Estimated ₹${cost.totalINR.toLocaleString('en-IN')}\n`;
          reply += `You may want to increase your budget slightly or consider a shorter stay.\n\n`;
        }
      }
    }

    // ── Agent result data ──
    const hasBooking = results.some((r) => r.agentName === 'BookingAgent' && r.success);
    const hasTravel = results.some((r) => r.agentName === 'TravelAgent' && r.success);
    const hasCompanion = results.some((r) => r.agentName === 'MatchCompanionAgent' && r.success);
    const hasWallet = results.some((r) => r.agentName === 'WalletAgent' && r.success);

    if (hasBooking) {
      const bookingResult = results.find((r) => r.agentName === 'BookingAgent');
      const topRec = bookingResult?.data?.topRecommendation as Record<string, unknown> | undefined;
      if (topRec) {
        reply += `🎟️ **Best Available Seat:**\n`;
        reply += `Section ${topRec.section} | Row ${topRec.row} | Seat ${topRec.number} at ${topRec.stadiumName} | $${topRec.price}\n`;
        reply += `_${(topRec.justifications as string[]).join(' · ')}_\n\n`;
      }
    }

    if (hasTravel) {
      const travelResult = results.find((r) => r.agentName === 'TravelAgent');
      const weather = travelResult?.data?.weather as Record<string, unknown> | undefined;
      const routes = travelResult?.data?.routes as Record<string, unknown> | undefined;
      const leaveTime = travelResult?.data?.leaveTimeRecommendation as Record<string, unknown> | undefined;

      if (weather) {
        reply += `🌤️ **Weather:** ${weather.condition as string} — ${weather.temperature}°C\n`;
      }
      if (leaveTime) {
        reply += `🚇 **Recommended departure time:** ${leaveTime.suggestedLeaveTime} (${leaveTime.reason})\n\n`;
      }
      if (routes) {
        const best = (routes as Record<string, unknown>).bestRoute as Record<string, unknown> | undefined;
        if (best) {
          reply += `Best route: **${best.routeName}** via ${best.mode} — ${best.estimatedTimeMinutes} mins\n\n`;
        }
      }
    }

    if (hasCompanion) {
      const companionResult = results.find((r) => r.agentName === 'MatchCompanionAgent');
      const stats = companionResult?.data?.stats as Record<string, unknown> | undefined;
      if (stats) {
        reply += `📊 **Live Stats:** ${JSON.stringify(stats)}\n\n`;
      }
    }

    if (hasWallet) {
      const walletResult = results.find((r) => r.agentName === 'WalletAgent');
      const summary = walletResult?.data?.summary as Record<string, unknown> | undefined;
      if (summary) {
        reply += `💳 **Your Wallet:** ${summary.upcomingCount} upcoming tickets | Total spent: ${summary.currency} ${summary.totalSpent}\n\n`;
      }
    }

    // ── Fixture context for Q&A ──
    if (reply === '' && hasFixtures && fixtureContext) {
      reply = `Here's what I found in our FIFA 2026 demo dataset:\n\n${fixtureContext}\n\n`;
    }

    // ── Generic fallback ──
    if (reply === '') {
      reply = `I'm Commander AI, your FIFA World Cup 2026 assistant. I can help you plan your trip, find tickets, check travel routes, or look up match stats. What would you like to know?`;
    }

    const justifications = this.extractJustifications(query, context, results);
    const recommendedMatch = this.inferRecommendedMatch(query, memory);

    return {
      message: reply.trim(),
      confidence: averageConfidence,
      explanation:
        justifications.length > 0
          ? { recommendedMatch, justifications }
          : undefined,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────────
  private buildFixtureContext(
    query: string,
    memory: Record<string, unknown> | null,
  ): string {
    const queryLower = query.toLowerCase();

    // Check for specific team mentions (expand to all 32 teams)
    const allTeams = FIFA_2026_TEAMS.map((t) => t.name);
    const mentionedTeam = allTeams.find(
      (t) =>
        queryLower.includes(t.toLowerCase()) ||
        (memory?.favoriteTeam as string | undefined)?.toLowerCase() === t.toLowerCase(),
    );

    if (mentionedTeam) {
      const fixtures = getFixturesForTeam(mentionedTeam);
      if (fixtures.length > 0) {
        return fixtures
          .map(
            (m) =>
              `• **${m.homeTeam} vs ${m.awayTeam}** (${m.stage}) — ${m.city}, ${m.country} | ${new Date(m.date).toDateString()} ${m.kickoffTime} | From $${m.ticketPrices.category3} (Cat 3) — $${m.ticketPrices.vip} (VIP)`,
          )
          .join('\n');
      }
    }

    // Budget-based search
    const budgetMatch = query.match(/₹\s?([\d,]+)|(\d+)\s*(?:k|lakh)/i);
    if (budgetMatch) {
      const budgetINR = parseInt((budgetMatch[1] ?? budgetMatch[2] ?? '75000').replace(',', ''));
      const matches = findMatchesWithinBudgetINR(budgetINR, mentionedTeam);
      if (matches.length > 0) {
        return matches
          .slice(0, 3)
          .map(
            ({ match, cost }) =>
              `• **${match.homeTeam} vs ${match.awayTeam}** (${match.stage}) — ${match.city} | ₹${cost.totalINR.toLocaleString('en-IN')} total (ticket + 3 nights hotel)`,
          )
          .join('\n');
      }
    }

    // General schedule (show upcoming fixtures)
    if (queryLower.match(/schedule|fixture|today|upcoming|when|final/)) {
      const finals = FIFA_2026_FIXTURES.filter((m) => m.stage === 'Final' || m.stage === 'Semi-Final');
      const knockouts = FIFA_2026_FIXTURES.filter((m) => m.stage === 'Quarter-Final' || m.stage === 'Round of 16');
      const selected = [...finals, ...knockouts].slice(0, 5);
      return selected
        .map(
          (m) =>
            `• **${m.homeTeam} vs ${m.awayTeam}** (${m.stage}) — ${m.city} | ${new Date(m.date).toDateString()} | From $${m.ticketPrices.category3}`,
        )
        .join('\n');
    }

    return '';
  }

  private extractJustifications(
    query: string,
    context: ISessionContext,
    results: AgentResult[],
  ): string[] {
    const justifications: string[] = [];
    const memory = context.fanMemory as Record<string, unknown> | null;
    const queryLower = query.toLowerCase();

    const favTeam = (memory?.favoriteTeam as string) ?? '';
    if (favTeam && queryLower.includes(favTeam.toLowerCase())) {
      justifications.push(`Matches your favourite team: ${favTeam}`);
    }

    const budget = Number(memory?.budget) || 0;
    if (budget > 0) {
      justifications.push(`Optimized for your $${budget} budget`);
    }

    if (results.some((r) => r.success)) {
      justifications.push('Based on real-time seat availability and travel data');
    }

    const seatPref = (memory?.seatPreference as string) ?? '';
    if (seatPref) {
      justifications.push(`Seat selection matches your "${seatPref}" preference`);
    }

    return justifications;
  }

  private inferRecommendedMatch(
    query: string,
    memory: Record<string, unknown> | null,
  ): string {
    const favTeam = (memory?.favoriteTeam as string) ?? '';
    const queryLower = query.toLowerCase();

    const mentionedTeam = FIFA_2026_TEAMS.find(
      (t) =>
        queryLower.includes(t.name.toLowerCase()) ||
        t.name.toLowerCase() === favTeam.toLowerCase(),
    );

    if (mentionedTeam) {
      const cheapest = getCheapestFixtureForTeam(mentionedTeam.name);
      if (cheapest) {
        return `${cheapest.homeTeam} vs ${cheapest.awayTeam}`;
      }
    }

    return 'FIFA World Cup 2026 Match';
  }
}
