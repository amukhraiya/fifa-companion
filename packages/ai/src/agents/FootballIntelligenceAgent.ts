import { IKernel } from '../interfaces';
import { IFootballProvider, MockFootballProvider } from './providers/MockFootballProvider';

export class FootballIntelligenceAgent {
  private provider: IFootballProvider;

  constructor() {
    // In a production scenario, we would check for API_SPORTS_KEY or FOOTBALL_DATA_ORG_KEY
    // and initialize the corresponding provider. For Prompt Wars demo, Mock is safe fallback.
    this.provider = new MockFootballProvider();
  }

  /**
   * Retrieves live football intelligence if the query requires it.
   */
  async retrieve(query: string, _kernel: IKernel): Promise<string> {
    const lower = query.toLowerCase();
    
    let needsLive = false;
    if (lower.includes('today') || lower.includes('live') || lower.includes('score') || lower.includes('result') || lower.includes('fixture') || lower.includes('upcoming') || lower.includes('news')) {
      needsLive = true;
    }

    if (!needsLive) return '';

    try {
      let data = '\nLIVE FOOTBALL INTELLIGENCE:\n';
      
      if (lower.includes('news') || lower.includes('injury')) {
        data += (await this.provider.getLatestNews()) + '\n\n';
      }
      
      if (lower.includes('score') || lower.includes('live') || lower.includes('today') || lower.includes('result')) {
        data += (await this.provider.getLiveScores()) + '\n\n';
      }
      
      if (lower.includes('fixture') || lower.includes('upcoming') || lower.includes('next')) {
        // Simple team extraction
        const teams = ['brazil', 'france', 'argentina', 'england', 'spain', 'germany'];
        const found = teams.find(t => lower.includes(t));
        data += (await this.provider.getUpcomingFixtures(found)) + '\n\n';
      }

      return data;
    } catch (err) {
      console.error('[FootballIntelligenceAgent] Error retrieving live data', err);
      return '';
    }
  }
}
