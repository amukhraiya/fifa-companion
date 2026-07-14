import { ISessionContext } from '../interfaces';

export interface SeatingRecommendation {
  type: 'Best Overall' | 'Best Budget' | 'Premium Experience';
  seatId: string;
  matchId: string;
  stadiumName: string;
  teams: string[];
  section: string;
  row: string;
  number: string;
  price: number;
  confidence: number;
  justifications: string[];
  breakdown: {
    favoriteTeamMatch: number; // Max 40
    budgetMatch: number;       // Max 30
    seatingMatch: number;      // Max 20
    accessibilityMatch: number; // Max 10
  };
}

export class AISeatRecommendationEngine {
  /**
   * Generates multiple ranked seat recommendations based on user profiles and preferences.
   */
  async recommendSeats(
    context: ISessionContext,
    seats: Array<{
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
    }>,
  ): Promise<SeatingRecommendation[]> {
    const favoriteTeam = (context.fanMemory?.favoriteTeam as string) || '';
    const budget = Number(context.fanMemory?.budget) || 1000;
    const seatPref = (context.fanMemory?.seatPreference as string) || 'Midfield';
    const accessibility = (context.fanMemory?.accessibilityNeeds as string) || 'None';

    const ranked: SeatingRecommendation[] = [];

    // Filter to available seats
    const available = seats.filter((s) => s.status === 'Available');

    for (const seat of available) {
      const teamNames = seat.match.teams.map((t) => t.team.name);
      const isFavoriteTeamMatch = teamNames.some(
        (name) => name.toLowerCase() === favoriteTeam.toLowerCase(),
      );

      // 1. Favorite Team Alignment (40%)
      const favScore = isFavoriteTeamMatch ? 40 : 10;

      // 2. Budget Match (30%)
      let budgetScore = 0;
      if (seat.price <= budget) {
        // Higher score if it utilizes budget well without exceeding
        const ratio = seat.price / budget;
        budgetScore = ratio > 0.8 ? 30 : ratio > 0.5 ? 25 : 20;
      } else {
        budgetScore = Math.max(0, Math.round(30 - (seat.price - budget) / 10));
      }

      // 3. Seating Preference Match (20%)
      let seatingScore = 10;
      const isVIP = seat.section.toLowerCase() === 'vip' || seat.section.toLowerCase() === 'category 1';
      const isMidfield = seat.row === 'A' || seat.row === 'B';

      if (seatPref.toLowerCase() === 'vip' && isVIP) {
        seatingScore = 20;
      } else if (seatPref.toLowerCase() === 'midfield' && isMidfield) {
        seatingScore = 20;
      } else if (seatPref.toLowerCase() === 'cheap' && !isVIP) {
        seatingScore = 20;
      }

      // 4. Accessibility Match (10%)
      let accessScore = 10;
      if (accessibility !== 'None' && accessibility !== '') {
        // Accessibility users prefer Row A or specific sections
        accessScore = seat.row === 'A' ? 10 : 5;
      }

      const totalScore = favScore + budgetScore + seatingScore + accessScore;
      const confidence = parseFloat((totalScore / 100).toFixed(2));

      // Justifications builder
      const justifications: string[] = [];
      if (isFavoriteTeamMatch) {
        justifications.push(`Supports ${favoriteTeam}`);
      }
      if (seat.price <= budget) {
        justifications.push(`Fits your budget ($${seat.price} <= $${budget})`);
      } else {
        justifications.push(`Premium match slightly over budget`);
      }
      if (seatPref.toLowerCase() === 'vip' && isVIP) {
        justifications.push('Premium seating category matches preference');
      } else if (isMidfield) {
        justifications.push('Excellent close-midfield viewing angle');
      }
      if (accessibility !== 'None' && seat.row === 'A') {
        justifications.push('Ground floor row with accessible entrance nearby');
      }

      const recommendationBase = {
        seatId: seat.id,
        matchId: seat.matchId,
        stadiumName: seat.match.venue.name,
        teams: teamNames,
        section: seat.section,
        row: seat.row,
        number: seat.number,
        price: seat.price,
        confidence,
        justifications,
        breakdown: {
          favoriteTeamMatch: favScore,
          budgetMatch: budgetScore,
          seatingMatch: seatingScore,
          accessibilityMatch: accessScore,
        },
      };

      ranked.push({
        ...recommendationBase,
        type: 'Best Overall',
      });
    }

    // Sort by confidence descending
    ranked.sort((a, b) => b.confidence - a.confidence);

    const results: SeatingRecommendation[] = [];

    // 1. Best Overall (highest confidence score)
    const bestOverall = ranked[0];
    if (bestOverall) {
      results.push({ ...bestOverall, type: 'Best Overall' });
    }

    // 2. Best Budget (lowest price seat with confidence > 0.4)
    const budgetCandidates = [...ranked].filter((s) => s.confidence > 0.4);
    budgetCandidates.sort((a, b) => a.price - b.price);
    const bestBudget = budgetCandidates[0];
    if (bestBudget && bestBudget.seatId !== bestOverall?.seatId) {
      results.push({ ...bestBudget, type: 'Best Budget' });
    } else if (budgetCandidates[1]) {
      results.push({ ...budgetCandidates[1], type: 'Best Budget' });
    }

    // 3. Premium Experience (highest price seat in Category 1 or VIP)
    const premiumCandidates = [...ranked].filter(
      (s) => s.section.toLowerCase() === 'category 1' || s.section.toLowerCase() === 'vip',
    );
    premiumCandidates.sort((a, b) => b.price - a.price);
    const bestPremium = premiumCandidates[0];
    if (bestPremium && bestPremium.seatId !== bestOverall?.seatId) {
      results.push({ ...bestPremium, type: 'Premium Experience' });
    } else if (premiumCandidates[1]) {
      results.push({ ...premiumCandidates[1], type: 'Premium Experience' });
    }

    return results;
  }
}
export const aiSeatRecommendationEngine = new AISeatRecommendationEngine();
