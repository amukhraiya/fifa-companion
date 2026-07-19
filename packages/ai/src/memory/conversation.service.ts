import type { ConversationTurn } from '@fifa/shared-types';

export interface ConversationDb {
  conversationTurn: {
    findMany(args: {
      where: { userId: string };
      orderBy: { timestamp: 'desc' };
      take: number;
    }): Promise<ConversationTurn[]>;
    create(args: { data: Record<string, unknown> }): Promise<ConversationTurn>;
  };
}

const DEFAULT_WINDOW = 10;

export class ConversationService {
  constructor(private db: ConversationDb) {}

  /** Most recent turns, oldest first (ready to feed straight into the Gemini `contents` array). */
  async getRecentTurns(userId: string, window = DEFAULT_WINDOW): Promise<ConversationTurn[]> {
    const rows = await this.db.conversationTurn.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: window,
    });
    return rows.reverse();
  }

  async append(
    userId: string,
    role: 'user' | 'assistant',
    content: string,
    agentUsed: string | null,
  ): Promise<void> {
    // Logging failures must never break the user-facing response — fire and capture.
    try {
      await this.db.conversationTurn.create({ data: { userId, role, content, agentUsed } });
    } catch (err) {
      console.error('[ConversationService] failed to persist turn', err);
    }
  }
}
