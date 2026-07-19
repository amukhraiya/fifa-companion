import { IKernel } from '../interfaces';

export class MemoryAgent {
  /**
   * Retrieves relevant semantic memories and conversation summaries.
   */
  async retrieve(userId: string, query: string, kernel: IKernel): Promise<string> {
    const memoryService = kernel.memoryService as any;
    if (!memoryService.prisma) return '';

    try {
      const memories = await memoryService.prisma.semanticMemory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      // Cosine similarity in JS (mock since pgvector is not available)
      // Since we don't have embeddings stored in the simplified schema,
      // we just do a basic text search/return recent for now.
      const queryLower = query.toLowerCase();
      const relevant = memories.filter((m: any) => {
        const c = m.content.toLowerCase();
        // Naive keyword match fallback since no vector DB
        const words = queryLower.split(' ').filter((w: string) => w.length > 3);
        return words.some((w: string) => c.includes(w)) || true; // Just return recent if no match
      }).slice(0, 3);

      const summaries = await memoryService.prisma.conversationSummary.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      let context = '';
      if (relevant.length > 0) {
        context += `\nRelevant Past Memories:\n` + relevant.map((m: any) => `- ${m.content}`).join('\n');
      }
      if (summaries.length > 0) {
        context += `\nRecent Conversation Summary:\n- ${summaries[0].summary}`;
      }
      return context;
    } catch (err) {
      console.error('[MemoryAgent] Error retrieving memory', err);
      return '';
    }
  }

  /**
   * Extracts facts from a user message using Gemini and stores them as semantic memories.
   */
  async extractAndStore(userId: string, userMessage: string, kernel: IKernel): Promise<void> {
    try {
      const prompt = `Extract any long-term preferences, facts, or goals from the user's message.
Ignore greetings and trivial chatter.
Focus on: favorite team, favorite player, budget, travel origin, seat preference, hotel preference, travel style, language, bookings.
Message: "${userMessage}"
If there is a fact, output exactly in this format: FACT: <fact>
If multiple, separate by newlines. If none, output NOTHING.`;

      const response = await kernel.geminiService.generateCompletion(prompt, { temperature: 0 });
      const lines = response.split('\n');
      
      const memoryService = kernel.memoryService as any;
      if (!memoryService.prisma) return;

      for (const line of lines) {
        if (line.startsWith('FACT:')) {
          const fact = line.replace('FACT:', '').trim();
          if (fact) {
            await memoryService.prisma.semanticMemory.create({
              data: {
                userId,
                content: fact,
              }
            });
            console.log(`[MemoryAgent] Stored semantic memory: ${fact}`);
            
            // Also update structured FanMemory if applicable
            await this.updateStructuredMemory(userId, fact, kernel);
          }
        }
      }
    } catch (err) {
      console.error('[MemoryAgent] Error extracting facts', err);
    }
  }

  private async updateStructuredMemory(userId: string, fact: string, kernel: IKernel) {
    const lower = fact.toLowerCase();
    const updates: any = {};
    if (lower.includes('support') || lower.includes('favorite team')) {
      // Very naive extraction for demo
      const teams = ['brazil', 'france', 'argentina', 'england', 'spain', 'germany'];
      const found = teams.find(t => lower.includes(t));
      if (found) updates.favoriteTeam = found.charAt(0).toUpperCase() + found.slice(1);
    }
    if (lower.includes('budget') || lower.includes('₹') || lower.includes('$')) {
      const match = fact.match(/[\d,]+/);
      if (match) {
        const num = parseFloat(match[0].replace(/,/g, ''));
        if (!isNaN(num)) updates.budget = num;
      }
    }
    
    if (Object.keys(updates).length > 0) {
      const memoryService = kernel.memoryService as any;
      await memoryService.prisma.fanMemory.upsert({
        where: { userId },
        update: updates,
        create: { userId, ...updates }
      });
    }
  }
}
