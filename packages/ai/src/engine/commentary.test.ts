import { describe, it, expect } from 'vitest';
import { CommentaryEngine } from './commentary';
import { MatchState, MatchEvent } from './types';

describe('CommentaryEngine unit tests', () => {
  const mockState: MatchState = {
    minute: 28,
    status: 'LIVE',
    homeTeam: 'Brazil',
    awayTeam: 'Spain',
    score: { home: 1, away: 0 },
    statistics: {
      possessionHome: 56,
      possessionAway: 44,
      shotsHome: 3,
      shotsAway: 2,
      shotsOnTargetHome: 1,
      shotsOnTargetAway: 0,
      cornersHome: 1,
      cornersAway: 1,
      foulsHome: 2,
      foulsAway: 3,
      yellowCardsHome: 0,
      yellowCardsAway: 0,
      redCardsHome: 0,
      redCardsAway: 0,
      expectedGoalsHome: 0.6,
      expectedGoalsAway: 0.2,
    },
    momentum: {
      value: 15,
      pressureHome: 15,
      pressureAway: 10,
      fanEnergy: 85,
    },
  };

  it('should generate Kickoff commentary', () => {
    const event: MatchEvent = {
      id: 'ev-1',
      minute: 1,
      eventType: 'Kickoff',
      team: 'Neutral',
      detail: 'Kickoff commences.',
    };

    const commentary = CommentaryEngine.generateCommentary(event, mockState);
    expect(commentary.text).toContain('The match begins! Brazil vs Spain');
  });

  it('should generate Goal commentary', () => {
    const event: MatchEvent = {
      id: 'ev-28',
      minute: 28,
      eventType: 'Goal',
      team: 'Home',
      player: 'Neymar Jr',
      detail: 'Goal!',
    };

    const commentary = CommentaryEngine.generateCommentary(event, mockState);
    expect(commentary.text).toContain('Neymar Jr scores from inside the box');
  });

  it('should generate YellowCard tactical warning commentary', () => {
    const event: MatchEvent = {
      id: 'ev-12',
      minute: 12,
      eventType: 'YellowCard',
      team: 'Away',
      player: 'Rodri',
      detail: 'Yellow card.',
    };

    const commentary = CommentaryEngine.generateCommentary(event, mockState);
    expect(commentary.text).toContain("Rodri goes into the referee's notebook");
  });
});
