import { GoogleGenerativeAI } from '@google/generative-ai';
import { IGeminiService } from '../interfaces';

export class MockGeminiService implements IGeminiService {
  /**
   * Generates mock completions based on the prompt to simulate Gemini's behavior.
   */
  async generateCompletion(prompt: string, _options?: { temperature?: number }): Promise<string> {
    // eslint-disable-next-line no-console
    console.log(`[AI TRACE] GEMINI REQUEST (Mock): "${prompt.substring(0, 80).replace(/\n/g, ' ')}..."`);
    const lower = prompt.toLowerCase();

    // Use a strict check to ensure we are only matching the Goal Analysis engine prompt,
    // not a downstream synthesizer prompt that happens to include the words "goal analysis" in its reasoning logs.
    if (prompt.includes('You are a Goal Analysis engine')) {
      // Extract the exact user query part from the prompt
      const queryPart = lower.split('user message: "')[1]?.split('"')[0] || lower;
      const isBooking = queryPart.includes('book') || queryPart.includes('ticket');
      const isTravel = queryPart.includes('flight') || queryPart.includes('hotel');
      const requiresTools = isBooking || isTravel;
      let taskType = 'GENERAL_CHAT';
      if (isBooking) taskType = 'BOOK_TICKET';
      else if (isTravel) taskType = 'PLAN_TRIP';
      else if (queryPart.includes('win') || queryPart.includes('predict')) taskType = 'PREDICTION';
      
      const mockResult = {
        objective: 'Mock goal objective',
        taskType: taskType,
        requiresTools: requiresTools,
        missingInformation: [],
        confidence: 0.9,
        reasoning: 'Mock determined intent.',
      };
      
      const response = JSON.stringify(mockResult);
      // eslint-disable-next-line no-console
      console.log(`[AI TRACE] GEMINI RESPONSE (Mock JSON): ${response}`);
      return response;
    }

    // 2. If it's the Response Synthesizer prompt, return a natural conversational string
    // NEVER return JSON here.
    
    // Extract only the user query part of the synthesizer prompt to prevent matching injected fan memory or agent data
    const synthQueryPart = lower.split('## user query\n"')[1]?.split('"\n')[0] || lower;

    if (synthQueryPart.includes('booking') || synthQueryPart.includes('ticket') || synthQueryPart.includes('seat')) {
      return "I can certainly help you with ticketing! I've checked the latest availability, and I recommend the Category 2 seats for the upcoming match. They offer a great view and fit within standard budgets.\n\n**Why I recommend this:**\n- Excellent midfield view\n- Fits your profile\n\n**Next, you might want to:**\n- Proceed to checkout\n- Check hotel options";
    }

    if (synthQueryPart.includes('travel') || synthQueryPart.includes('hotel') || synthQueryPart.includes('route')) {
      return "I've analyzed the best routes for your journey. Taking the metro is currently the fastest option, saving you about 20 minutes compared to driving due to match-day traffic.\n\n**Why I recommend this:**\n- Avoids highway congestion\n- Eco-friendly and cheaper\n\n**Next, you might want to:**\n- Buy a transit pass\n- See stadium entry gates";
    }

    if (synthQueryPart.includes('win') || synthQueryPart.includes('messi') || synthQueryPart.includes('world cup')) {
      return "That's a great question about the tournament! While the World Cup is always full of surprises, teams with strong recent form and solid defensive records tend to go far. Historically, football is unpredictable, which is exactly why we love it!\n\n**You might also want to:**\n- Check today's live scores\n- View team statistics";
    }

    const response = "Hello! 👋 I'm Commander AI, your intelligent FIFA World Cup 2026 Companion. I'm here to help you plan your travel, book tickets, and give you the latest match insights. How can I help you orchestrate your perfect World Cup experience today?";
    // eslint-disable-next-line no-console
    console.log(`[AI TRACE] GEMINI RESPONSE (Mock): "${response.substring(0, 80).replace(/\n/g, ' ')}..."`);
    return response;
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
    // eslint-disable-next-line no-console
    console.log(`[AI TRACE] GEMINI REQUEST (Real): "${prompt.substring(0, 80).replace(/\n/g, ' ')}..."`);
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
    
    // eslint-disable-next-line no-console
    console.log(`[AI TRACE] GEMINI RESPONSE (Real): "${text.substring(0, 80).replace(/\n/g, ' ')}..."`);

    return text;
  }
}
