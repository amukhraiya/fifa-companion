import { PrismaClient } from '@prisma/client';
import { IRAGProvider, RAGDocument, RAGResult } from '../interfaces';

export class RAGService implements IRAGProvider {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async search(query: string, limit: number = 4): Promise<RAGResult[]> {
    // Performs case-insensitive database queries as a text-matching RAG search fallback.
    // Swapping to pgvector later requires changing only this query.
    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
    });

    return chunks.map((chunk: any) => {
      return {
        id: chunk.id,
        sourceType: chunk.sourceType,
        title: chunk.title,
        content: chunk.content,
        score: 0.85,
      };
    });
  }

  async retrieve(documentId: string): Promise<RAGDocument | null> {
    const chunk = await this.prisma.knowledgeChunk.findUnique({
      where: { id: documentId },
    });

    if (!chunk) return null;

    const metadata = chunk.metadata ? JSON.parse(chunk.metadata as string) : {};
    return {
      id: chunk.id,
      sourceType: chunk.sourceType,
      title: chunk.title,
      content: chunk.content,
      metadata,
    };
  }

  async index(document: RAGDocument): Promise<void> {
    await this.prisma.knowledgeChunk.create({
      data: {
        sourceType: document.sourceType,
        title: document.title,
        content: document.content,
        metadata: JSON.stringify(document.metadata),
      },
    });
  }
}
