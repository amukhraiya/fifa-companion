/**
 * Memory Service (ARCHITECTURE_V2.md §3).
 *
 * Deliberately takes a Prisma client via constructor injection instead of
 * importing a singleton — this file has zero knowledge of where
 * apps/api/src/lib/prisma.ts lives, so it drops into the monorepo without
 * import-path surgery. ANTIGRAVITY: wire the real singleton in when
 * constructing this in apps/api's composition root (see chat.routes.ts).
 */
import type { FanMemory, FanMemoryDelta } from '@fifa/shared-types';

/** Minimal surface this service needs from Prisma — matches the FanMemory model from T002/T009. */
export interface FanMemoryDb {
  fanMemory: {
    findUnique(args: { where: { userId: string } }): Promise<Record<string, unknown> | null>;
    upsert(args: {
      where: { userId: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }): Promise<Record<string, unknown>>;
  };
}

const EMPTY_MEMORY = (userId: string): FanMemory => ({
  id: '',
  userId,
  favoriteTeam: null,
  favoritePlayers: [],
  language: 'en',
  budget: null,
  travelStyle: null,
  foodPreference: null,
  accessibilityNeeds: null,
  seatPreference: null,
  atmospherePreference: null,
  groupType: null,
  pastTicketsSummary: null,
  travelHistorySummary: null,
  updatedAt: new Date(),
});

export class FanMemoryService {
  constructor(private db: FanMemoryDb) {}

  /** Returns a fully-populated (possibly empty-defaults) memory — callers never handle null. */
  async get(userId: string): Promise<FanMemory> {
    const row = await this.db.fanMemory.findUnique({ where: { userId } });
    if (!row) return EMPTY_MEMORY(userId);
    return { ...EMPTY_MEMORY(userId), ...row } as FanMemory;
  }

  /**
   * Merge a partial delta into the user's memory. Safe under concurrent
   * writes from different agents in the same turn because each call is an
   * independent upsert scoped to only the fields it changes.
   */
  async update(userId: string, delta: FanMemoryDelta): Promise<FanMemory> {
    if (Object.keys(delta).length === 0) return this.get(userId);
    const row = await this.db.fanMemory.upsert({
      where: { userId },
      create: { userId, ...delta },
      update: { ...delta },
    });
    return { ...EMPTY_MEMORY(userId), ...row } as FanMemory;
  }
}
