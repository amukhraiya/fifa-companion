export interface IntentResult {
  intent: string;
  confidence: number;
  reasoning: string;
}

export class IntentEngine {
  /**
   * Identifies user intention based on vocabulary match triggers.
   */
  classify(query: string): IntentResult {
    if (!query) {
      return { intent: 'q&a', confidence: 1.0, reasoning: 'Query is empty' };
    }

    const lower = query.toLowerCase();

    // 1. Ticket Booking keywords
    if (lower.match(/\b(seat|ticket|book|reserve|stadium|vip|midfield|category)\b/)) {
      return {
        intent: 'booking',
        confidence: 0.95,
        reasoning: 'Detected match tickets and seating keyword patterns.',
      };
    }

    // 2. Travel planning keywords
    if (lower.match(/\b(hotel|flight|travel|restaurant|map|route|weather|itinerary|dine)\b/)) {
      return {
        intent: 'travel',
        confidence: 0.92,
        reasoning: 'Detected lodging, routing, maps, or dining keyword patterns.',
      };
    }

    // 3. Match companion / stats keywords
    if (lower.match(/\b(statistics|stats|news|commentary|score|goal|card|foul|lineup|schedule)\b/)) {
      return {
        intent: 'companion',
        confidence: 0.9,
        reasoning: 'Detected match play, scoreboard, or commentary keyword patterns.',
      };
    }

    return {
      intent: 'q&a',
      confidence: 0.85,
      reasoning: 'Input query maps to generic user Q&A.',
    };
  }
}
