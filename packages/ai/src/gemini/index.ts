import { GoogleGenerativeAI } from '@google/generative-ai';
import { IGeminiService } from '../interfaces';

export class MockGeminiService implements IGeminiService {
  /**
   * Generates mock completions based on matched keywords for clean execution logic.
   */
  async generateCompletion(prompt: string, _options?: { temperature?: number }): Promise<string> {
    const lower = prompt.toLowerCase();

    if (lower.includes('booking') || lower.includes('ticket') || lower.includes('seat')) {
      return JSON.stringify({
        intent: 'booking',
        steps: [
          {
            agentName: 'BookingAgent',
            input: 'Process seat query and secure Category 2 ticket S2.',
            order: 1,
          },
        ],
        confidence: 0.95,
        reasoningPath: ['Mock determined ticket booking intent.', 'Scheduled BookingAgent.'],
      });
    }

    if (lower.includes('travel') || lower.includes('hotel') || lower.includes('route')) {
      return JSON.stringify({
        intent: 'travel',
        steps: [
          {
            agentName: 'TravelAgent',
            input: 'Calculate route directions and check forecast weather.',
            order: 1,
          },
        ],
        confidence: 0.92,
        reasoningPath: ['Mock determined travel planning intent.', 'Scheduled TravelAgent.'],
      });
    }

    if (lower.includes('statistics') || lower.includes('score') || lower.includes('commentary')) {
      return JSON.stringify({
        intent: 'companion',
        steps: [
          {
            agentName: 'MatchCompanionAgent',
            input: 'Fetch real-time stats feed and comments.',
            order: 1,
          },
        ],
        confidence: 0.9,
        reasoningPath: ['Mock determined match companion stats intent.', 'Scheduled MatchCompanionAgent.'],
      });
    }

    // Default Q&A response
    return JSON.stringify({
      intent: 'q&a',
      steps: [],
      confidence: 0.85,
      reasoningPath: ['Mock determined generic assistant Q&A.'],
    });
  }
}

export class GoogleGeminiService implements IGeminiService {
  private ai: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName = 'gemini-1.5-pro') {
    if (!apiKey) {
      throw new Error('Google Gemini API Key is required.');
    }
    this.ai = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async generateCompletion(prompt: string, options?: { temperature?: number }): Promise<string> {
    const model = this.ai.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        temperature: options?.temperature ?? 0.2,
      },
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text = result.response.text();
    if (!text) {
      throw new Error('Empty response received from Gemini Pro model.');
    }

    return text;
  }
}
