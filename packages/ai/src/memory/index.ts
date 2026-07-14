import { PrismaClient } from '@prisma/client';
import { IMemoryService } from '../interfaces';

export class MemoryService implements IMemoryService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async loadFanMemory(userId: string): Promise<Record<string, unknown> | null> {
    const memory = await this.prisma.fanMemory.findUnique({
      where: { userId },
    });
    return memory ? (memory as unknown as Record<string, unknown>) : null;
  }

  async updateFanMemory(userId: string, data: Record<string, unknown>): Promise<void> {
    // Exclude system identifiers during generic updates
    const updateData = { ...data };
    delete updateData.id;
    delete updateData.userId;
    delete updateData.updatedAt;
    
    await this.prisma.fanMemory.update({
      where: { userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: updateData as any,
    });
  }

  async saveConversationTurn(
    userId: string,
    role: string,
    content: string,
    agentUsed?: string,
  ): Promise<void> {
    await this.prisma.conversationTurn.create({
      data: {
        userId,
        role,
        content,
        agentUsed: agentUsed || null,
      },
    });
  }
}
