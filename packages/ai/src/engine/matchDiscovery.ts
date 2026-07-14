import { ISessionContext } from '../interfaces';

export interface DiscoveredMatch {
  matchId: string;
  teams: string[];
  venueName: string;
  date: string;
  relevanceScore: number;
  relevanceReason: string;
  stage: string;
}

export class MatchDiscoveryEngine {
  /**
   * Discovers and ranks matches based on user preferences in FanMemory.
   */
  async discoverMatches(
    context: ISessionContext,
    matches: Array<{
      id: string;
      date: Date;
      venue: { name: string };
      teams: Array<{ team: { name: string } }>;
    }>,
  ): Promise<DiscoveredMatch[]> {
    const favoriteTeam = (context.fanMemory?.favoriteTeam as string) || '';

    const ranked = matches.map((match) => {
      const teamNames = match.teams.map((t) => t.team.name);
      let score = 50; // Base relevance
      let reason = 'General tournament match';

      // 1. Matches user's favorite team (+40 pts)
      const matchesFavorite = teamNames.some(
        (name) => name.toLowerCase() === favoriteTeam.toLowerCase(),
      );
      if (matchesFavorite) {
        score += 40;
        reason = `Features your favorite team: ${favoriteTeam}`;
      }

      // 2. Adjust for premium stages (e.g. Finals / Knockouts)
      const stage = match.venue.name.includes('Lusail') ? 'Final' : 'Quarter-Final';
      if (stage === 'Final') {
        score += 10;
        if (!matchesFavorite) {
          reason = 'World Cup Final at Lusail Stadium';
        }
      }

      return {
        matchId: match.id,
        teams: teamNames,
        venueName: match.venue.name,
        date: match.date.toISOString(),
        relevanceScore: score,
        relevanceReason: reason,
        stage,
      };
    });

    // Sort by relevance score descending
    return ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}
export const matchDiscoveryEngine = new MatchDiscoveryEngine();
