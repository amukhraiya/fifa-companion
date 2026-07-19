export interface IFootballProvider {
  getLiveScores(): Promise<string>;
  getUpcomingFixtures(team?: string): Promise<string>;
  getLatestNews(topic?: string): Promise<string>;
}

export class MockFootballProvider implements IFootballProvider {
  async getLiveScores(): Promise<string> {
    return `LIVE MATCHES:
- Brazil 2 - 1 France (78' - Vinicius Jr. scored)
- Argentina 0 - 0 Germany (HT)`;
  }

  async getUpcomingFixtures(team?: string): Promise<string> {
    if (team?.toLowerCase() === 'brazil') {
      return `Upcoming Fixtures for Brazil:
- Brazil vs Spain (Quarter-Final) | Fri Jul 10 2026, 20:00 EST | MetLife Stadium, New York`;
    }
    return `Upcoming Key Fixtures:
- Brazil vs Spain (Quarter-Final) | Fri Jul 10 2026, 20:00 EST
- England vs Argentina (Quarter-Final) | Sat Jul 11 2026, 18:00 EST`;
  }

  async getLatestNews(_topic?: string): Promise<string> {
    return `Latest Football News:
- Kylian Mbappe spotted training alone ahead of the crucial clash against Brazil.
- FIFA announces new technology testing for the upcoming matches.`;
  }
}
