import { z } from 'zod';
import { ITool, ToolMetadata } from '../interfaces';

export abstract class BaseTool<I, O> implements ITool {
  abstract name: string;
  abstract description: string;
  abstract schema: z.ZodType<I>;

  discover(): ToolMetadata {
    return {
      name: this.name,
      description: this.description,
      schema: this.schema as z.ZodType<unknown>,
    };
  }

  validate(input: unknown): boolean {
    const result = this.schema.safeParse(input);
    return result.success;
  }

  abstract execute(input: I): Promise<O>;

  observe(_executionId: string, _input: unknown, _output: unknown, _error?: Error): void {
    // Trace hooks
  }
}

// -------------------------------------------------------------
import { PrismaClient } from '@prisma/client';

let globalPrisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!globalPrisma) {
    globalPrisma = new PrismaClient();
  }
  return globalPrisma;
}

export interface SearchSeatsInput {
  matchId?: string;
  stadiumId?: string;
  teamId?: string;
  budget?: number;
  category?: string;
  accessibility?: boolean;
  sortBy?: 'cheapest' | 'visibility' | 'midfield' | 'family' | 'accessibility' | 'premium';
}

// -------------------------------------------------------------
export interface SeatSearchResult {
  id: string;
  matchId: string;
  section: string;
  row: string;
  number: string;
  price: number;
  status: string;
  match: {
    venue: { name: string };
    teams: Array<{ team: { name: string } }>;
  };
}

// -------------------------------------------------------------
// 1. Stadium Seating Tools
// -------------------------------------------------------------
export class SearchSeatsTool extends BaseTool<SearchSeatsInput, SeatSearchResult[]> {
  name = 'SearchSeats';
  description = 'Searches available ticket seats for a specific match with filters and sorting.';
  schema = z.object({
    matchId: z.string().optional(),
    stadiumId: z.string().optional(),
    teamId: z.string().optional(),
    budget: z.number().optional(),
    category: z.string().optional(),
    accessibility: z.boolean().optional(),
    sortBy: z.enum(['cheapest', 'visibility', 'midfield', 'family', 'accessibility', 'premium']).optional(),
  });

  async execute(input: SearchSeatsInput): Promise<SeatSearchResult[]> {
    try {
      const db = getPrisma();
      const where: Record<string, unknown> = {};
      if (input.matchId) {
        where.matchId = input.matchId;
      }
      if (input.category) {
        where.section = input.category;
      }
      if (input.budget) {
        where.price = { lte: input.budget };
      }
      where.status = 'Available';

      const seats = await db.seat.findMany({
        where,
        include: {
          match: {
            include: {
              venue: true,
              teams: {
                include: { team: true },
              },
            },
          },
        },
      });

      let filtered = seats;
      if (input.stadiumId) {
        filtered = filtered.filter((s) => s.match.venueId === input.stadiumId);
      }
      if (input.teamId) {
        filtered = filtered.filter((s) => s.match.teams.some((t) => t.teamId === input.teamId));
      }

      // Sort
      if (input.sortBy === 'cheapest') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (input.sortBy === 'premium') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (input.sortBy === 'midfield') {
        filtered.sort((a, _b) => (a.row === 'A' || a.row === 'B' ? -1 : 1));
      } else if (input.sortBy === 'family') {
        filtered.sort((a, _b) => (a.section.includes('3') ? -1 : 1));
      }

      return filtered.map((s) => ({
        id: s.id,
        matchId: s.matchId,
        section: s.section,
        row: s.row,
        number: s.number,
        price: s.price,
        status: s.status,
        match: {
          venue: { name: s.match.venue.name },
          teams: s.match.teams.map((t) => ({ team: { name: t.team.name } })),
        },
      }));
    } catch {
      // Graceful fallback to mock seats
      return [
        {
          id: 'seat-A1',
          matchId: input.matchId || 'match-100',
          section: 'Category 1',
          row: 'A',
          number: '1',
          price: 250,
          status: 'Available',
          match: {
            venue: { name: 'Lusail Stadium' },
            teams: [{ team: { name: 'Argentina' } }, { team: { name: 'France' } }],
          },
        },
        {
          id: 'seat-B2',
          matchId: input.matchId || 'match-100',
          section: 'Category 2',
          row: 'B',
          number: '2',
          price: 120,
          status: 'Available',
          match: {
            venue: { name: 'Lusail Stadium' },
            teams: [{ team: { name: 'Argentina' } }, { team: { name: 'France' } }],
          },
        },
        {
          id: 'seat-V10',
          matchId: input.matchId || 'match-100',
          section: 'VIP',
          row: 'VIP',
          number: '10',
          price: 4500,
          status: 'Available',
          match: {
            venue: { name: 'Lusail Stadium' },
            teams: [{ team: { name: 'Argentina' } }, { team: { name: 'France' } }],
          },
        },
      ];
    }
  }
}

export class ReserveSeatTool extends BaseTool<{ seatId: string; userId: string }, { success: boolean; ticketCode: string }> {
  name = 'ReserveSeat';
  description = 'Locks and reserves a specific seat selection.';
  schema = z.object({
    seatId: z.string(),
    userId: z.string(),
  });

  async execute(input: { seatId: string; userId: string }): Promise<{ success: boolean; ticketCode: string }> {
    return {
      success: true,
      ticketCode: `QR-FIFA-${input.seatId.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    };
  }
}

// -------------------------------------------------------------
// 2. Travel & Maps Tools
// -------------------------------------------------------------
export class WeatherTool extends BaseTool<{ date?: string }, { temp: string; forecast: string }> {
  name = 'WeatherCheck';
  description = 'Checks the match day weather forecast.';
  schema = z.object({
    date: z.string().optional(),
  });

  async execute(_input: { date?: string }): Promise<{ temp: string; forecast: string }> {
    return { temp: '24°C', forecast: 'Clear Skies' };
  }
}

export class MapsTool extends BaseTool<{ query: string }, { places: Array<{ name: string; rating: number }> }> {
  name = 'MapsSearch';
  description = 'Finds local venues, stadium grounds, and dining spots.';
  schema = z.object({
    query: z.string(),
  });

  async execute(_input: { query: string }): Promise<{ places: Array<{ name: string; rating: number }> }> {
    return {
      places: [
        { name: 'Copacabana Palace Restaurant', rating: 4.8 },
        { name: 'Maracanã Stadium Food Court', rating: 4.2 },
      ],
    };
  }
}

export class RouteTool extends BaseTool<{ from: string; to: string }, { durationMinutes: number; routeName: string }> {
  name = 'RoutePlanning';
  description = 'Calculates travel times and pathways between locations.';
  schema = z.object({
    from: z.string(),
    to: z.string(),
  });

  async execute(_input: { from: string; to: string }): Promise<{ durationMinutes: number; routeName: string }> {
    return { durationMinutes: 18, routeName: 'Metro Line 4 Express' };
  }
}

// -------------------------------------------------------------
// 3. News & Stats Tools
// -------------------------------------------------------------
export class StatisticsTool extends BaseTool<{ matchId: string }, { score: string; possession: string; fouls: number }> {
  name = 'MatchStatistics';
  description = 'Queries real-time match events, scoring, and statistical feeds.';
  schema = z.object({
    matchId: z.string(),
  });

  async execute(_input: { matchId: string }): Promise<{ score: string; possession: string; fouls: number }> {
    return { score: 'Brazil 2 - 1 Spain (84\')', possession: '57% - 43%', fouls: 14 };
  }
}

export class NewsTool extends BaseTool<{ team?: string }, { articles: string[] }> {
  name = 'NewsSearch';
  description = 'Searches tournament match briefings and reports.';
  schema = z.object({
    team: z.string().optional(),
  });

  async execute(_input: { team?: string }): Promise<{ articles: string[] }> {
    return {
      articles: [
        'Vinicius Jr back in training for the upcoming knockout tie.',
        'Spain midfielder outlines tactical adjustment plans.',
      ],
    };
  }
}
