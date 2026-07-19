import { IKernel } from '../interfaces';

export class KnowledgeRetrievalAgent {
  /**
   * Retrieves FIFA knowledge based on the user's query.
   */
  async retrieve(query: string, kernel: IKernel): Promise<string> {
    const memoryService = kernel.memoryService as any;
    if (!memoryService.prisma) return '';

    try {
      const chunks = await memoryService.prisma.knowledgeChunk.findMany();
      if (chunks.length === 0) return '';

      // Hybrid Retrieval Mock
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(' ').filter((w: string) => w.length > 3);

      const scoredChunks = chunks.map((chunk: any) => {
        let score = 0;
        const contentLower = chunk.content.toLowerCase();
        
        // Keyword match scoring
        queryWords.forEach((w: string) => {
          if (contentLower.includes(w)) {
            score += 1;
          }
        });

        // Boost score if title matches
        if (queryWords.some((w: string) => chunk.title.toLowerCase().includes(w))) {
          score += 2;
        }

        return { chunk, score };
      });

      // Sort and take top 3
      scoredChunks.sort((a: any, b: any) => b.score - a.score);
      const topChunks = scoredChunks.filter((c: any) => c.score > 0).slice(0, 3);

      if (topChunks.length === 0) return '';

      let context = '\nOfficial FIFA Knowledge:\n';
      topChunks.forEach((c: any) => {
        context += `[Source: ${c.chunk.sourceType} - ${c.chunk.title}]\n${c.chunk.content}\n\n`;
      });

      return context;
    } catch (err) {
      console.error('[KnowledgeRetrievalAgent] Error retrieving knowledge', err);
      return '';
    }
  }
}
