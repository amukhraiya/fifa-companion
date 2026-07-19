import { IGeminiService } from '../interfaces';

export interface IntentResult {
  intent: string;
  confidence: number;
  reasoning: string;
}

// Extended result used by the Gemini-powered engine
export interface RichIntentResult extends IntentResult {
  objective: string;                        // What is the user trying to accomplish
  taskType: string;                         // The specific task category
  requiresTools: boolean;                   // Whether application-specific data/tools are needed
  missingInformation: string[];             // info the AI needs to proceed
  needsClarification: boolean;              // should we ask before acting?
}

// ─────────────────────────────────────────────────────────────────────────────
// KeywordIntentEngine — fast, offline fallback
// ─────────────────────────────────────────────────────────────────────────────
export class KeywordIntentEngine {
  classify(query: string): IntentResult {
    if (!query) {
      return { intent: 'q&a', confidence: 1.0, reasoning: 'Query is empty' };
    }

    const lower = query.toLowerCase();

    // Multi-intent detection: collect all matching domains
    const detectedIntents: string[] = [];

    if (lower.match(/\b(seat|ticket|book|reserve|stadium|vip|midfield|category|cheapest.*match|match.*cheap)\b/)) {
      detectedIntents.push('booking');
    }
    if (lower.match(/\b(hotel|flight|travel|restaurant|map|route|weather|itinerary|dine|journey|trip|from .+to|depart|arrive|reach|transport)\b/)) {
      detectedIntents.push('travel');
    }
    if (lower.match(/\b(statistics|stats|news|commentary|score|goal|card|foul|lineup|schedule|fixture|match|compare|vs|versus)\b/)) {
      detectedIntents.push('companion');
    }
    if (lower.match(/\b(wallet|pass|qr|download|spend|spent|paid|payment|ticket.*my|my.*ticket)\b/)) {
      detectedIntents.push('wallet');
    }

    if (detectedIntents.length === 0) {
      return {
        intent: 'GENERAL_CHAT',
        confidence: 0.75,
        reasoning: 'Input query maps to generic user Q&A.',
      };
    }

    // Primary intent = first detected
    const intentMap: Record<string, string> = {
      booking: 'BOOK_TICKET',
      travel: 'TRAVEL',
      companion: 'MATCH_INFORMATION',
      wallet: 'WALLET'
    };

    return {
      intent: intentMap[detectedIntents[0]!] || 'UNKNOWN',
      confidence: detectedIntents.length > 1 ? 0.88 : 0.92,
      reasoning: `Detected ${detectedIntents.join(', ')} intent patterns in query.`,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GeminiIntentEngine — AI-powered NLU with entity extraction
// ─────────────────────────────────────────────────────────────────────────────
export class GeminiIntentEngine {
  private gemini: IGeminiService;
  private fallback = new KeywordIntentEngine();

  constructor(gemini: IGeminiService) {
    this.gemini = gemini;
  }

  async classify(query: string, fanMemory?: Record<string, unknown>, activeGoal?: any): Promise<RichIntentResult> {
    const memoryContext = fanMemory
      ? `Fan Preferences: favoriteTeam=${fanMemory.favoriteTeam ?? 'unknown'}, budget=${fanMemory.budget ?? 'unknown'}, travelStyle=${fanMemory.travelStyle ?? 'unknown'}, seatPreference=${fanMemory.seatPreference ?? 'unknown'}`
      : 'No fan memory available.';

    const activeGoalContext = activeGoal
      ? `Active Goal Context: We are in the middle of executing a parent goal.
Current Active Goal: ${activeGoal.objective}
Required details still missing: ${activeGoal.requiredConstraints?.join(', ') || 'none'}
Previously gathered constraints: ${JSON.stringify(activeGoal.constraints)}`
      : 'No active goal is currently set.';

    const prompt = `You are a Goal Analysis engine for Commander AI (FIFA World Cup 2026).

${memoryContext}

${activeGoalContext}

User message: "${query}"

Analyze the user message and extract structured objective data. Respond ONLY with valid JSON matching this exact schema:

{
  "objective": "string — What the user is trying to accomplish",
  "taskType": "GENERAL_CHAT|FOOTBALL_KNOWLEDGE|MATCH_INFORMATION|TEAM_INFORMATION|PREDICTION|BOOK_TICKET|PLAN_TRIP|TRAVEL|HOTEL|STADIUM|WEATHER|NEWS|BUDGET|MEMORY|RECOMMENDATION|UNKNOWN",
  "requiresTools": true|false,
  "confidence": 0.0-1.0,
  "missingInformation": ["list of what's needed but not provided"],
  "reasoning": "brief reasoning string"
}

Rules for requiresTools:
- If you can answer confidently using your own reasoning (e.g. "Who is Messi?", "Explain VAR", "hello", "Who will win the World Cup?", "Compare France vs Brazil"), set requiresTools to false.
- If application-specific data is needed (e.g. "Book Brazil tickets", "Show available seats", "Plan my trip", "Find nearby hotels", "Show my bookings"), set requiresTools to true.
- If there is an Active Goal Context, and the user's message supplies missing information for it (e.g., they specify a budget or city to advance the plan), maintain the active goal's taskType (e.g., PLAN_TRIP) and set requiresTools to true.

Rules for other fields:
- objective: Be descriptive (e.g. "Predict likely FIFA World Cup contenders" or "Provide budget constraint for active trip planning").
- taskType: Pick the single most accurate category from the ENUM.
- missingInformation: Only include truly CRITICAL missing items for tool execution (e.g., origin city for travel). Make sure to exclude any constraints that are already provided in Previously gathered constraints in the Active Goal Context.

Respond with ONLY the JSON object, no markdown, no explanation.`;

    try {
      const raw = await this.gemini.generateCompletion(prompt, { temperature: 0.1 });

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in Gemini response');

      const parsed = JSON.parse(jsonMatch[0]) as {
        objective: string;
        taskType: string;
        requiresTools: boolean;
        missingInformation: string[];
        confidence: number;
        reasoning: string;
      };

      return {
        intent: parsed.taskType ?? 'UNKNOWN',
        confidence: parsed.confidence ?? 0.85,
        reasoning: parsed.reasoning ?? 'Gemini classification',
        objective: parsed.objective ?? 'Chat with user',
        taskType: parsed.taskType ?? 'UNKNOWN',
        requiresTools: parsed.requiresTools ?? false,
        missingInformation: parsed.missingInformation ?? [],
        needsClarification: parsed.missingInformation?.length > 0 && parsed.requiresTools,
      };
    } catch {
      // Fallback to keyword engine
      const fallbackResult = this.fallback.classify(query);
      return {
        ...fallbackResult,
        objective: 'Fallback basic intent',
        taskType: fallbackResult.intent,
        requiresTools: fallbackResult.intent !== 'GENERAL_CHAT' && fallbackResult.intent !== 'FOOTBALL_KNOWLEDGE',
        missingInformation: [],
        needsClarification: false,
      };
    }
  }
}
