/**
 * RAG retrieval (ARCHITECTURE_V2.md §4). Assumes T013's ingestion pipeline
 * has already populated KnowledgeChunk.embedding via pgvector.
 */
import type { RagChunk } from '@fifa/shared-types';
import type { GeminiProvider } from '../providers/gemini';

export interface RagDb {
  /** Raw query so we can use the pgvector `<=>` cosine-distance operator directly. */
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
}

interface RawChunkRow {
  id: string;
  sourceType: RagChunk['sourceType'];
  title: string;
  content: string;
  distance: number;
}

export class RagRetriever {
  constructor(
    private db: RagDb,
    private gemini: GeminiProvider,
  ) {}

  async retrieve(query: string, k = 5): Promise<RagChunk[]> {
    try {
      const embedding = await this.gemini.embed(query);
      const vectorLiteral = `[${embedding.join(',')}]`;

      const rows = await this.db.$queryRaw<RawChunkRow[]>`
        SELECT id, "sourceType", title, content,
               embedding <=> ${vectorLiteral}::vector AS distance
        FROM "KnowledgeChunk"
        ORDER BY distance ASC
        LIMIT ${k}
      `;

      return rows.map((r) => ({
        id: r.id,
        sourceType: r.sourceType,
        title: r.title,
        content: r.content,
        score: 1 - r.distance, // cosine distance → similarity
      }));
    } catch (err) {
      console.warn('[RagRetriever] RAG query failed or vector extension not active, returning empty fallback', err);
      return [];
    }
  }

  /** Renders retrieved chunks as grounding text to inject into an agent's prompt. */
  static toGroundingText(chunks: RagChunk[]): string {
    if (chunks.length === 0) return 'No specific knowledge-base context was retrieved for this query.';
    return chunks
      .map((c, i) => `[${i + 1}] (${c.sourceType}) ${c.title}\n${c.content}`)
      .join('\n\n');
  }
}
