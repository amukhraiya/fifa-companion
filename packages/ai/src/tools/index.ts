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
// 1. Stadium Seating Tools
// -------------------------------------------------------------
export class SearchSeatsTool extends BaseTool<{ matchId?: string }, Array<{ seatId: string; category: string; price: number }>> {
  name = 'SearchSeats';
  description = 'Searches available ticket seats for a specific match.';
  schema = z.object({
    matchId: z.string().optional(),
  });

  async execute(_input: { matchId?: string }): Promise<Array<{ seatId: string; category: string; price: number }>> {
    return [
      { seatId: 'seat-A1', category: 'Category 1', price: 250 },
      { seatId: 'seat-B2', category: 'Category 2', price: 120 },
      { seatId: 'seat-V10', category: 'VIP', price: 4500 },
    ];
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
