import { describe, it, expect } from 'vitest';
import { LiveMatchEngine } from './liveMatch';

describe('LiveMatchEngine unit tests', () => {
  it('should initialize and start the match correctly', () => {
    const engine = new LiveMatchEngine('Brazil', 'Spain');
    let state = engine.getState();
    expect(state.status).toBe('SCHEDULED');
    expect(state.minute).toBe(0);
    expect(state.score.home).toBe(0);
    expect(state.score.away).toBe(0);

    engine.startMatch();
    state = engine.getState();
    expect(state.status).toBe('LIVE');
    expect(state.minute).toBe(1);
  });

  it('should advance minute on tick and trigger events', () => {
    const engine = new LiveMatchEngine('Brazil', 'Spain');
    engine.startMatch();

    const event = engine.tick(); // advances to min 2
    const state = engine.getState();
    expect(state.minute).toBe(2);
    expect(state.status).toBe('LIVE');
  });

  it('should update score when Neymar scores at minute 28', () => {
    const engine = new LiveMatchEngine('Brazil', 'Spain');
    engine.startMatch();

    engine.tickTo(28);
    const state = engine.getState();
    expect(state.score.home).toBe(1);
    expect(state.score.away).toBe(0);
  });

  it('should record yellow cards and red cards in stats', () => {
    const engine = new LiveMatchEngine('Brazil', 'Spain');
    engine.startMatch();

    engine.tickTo(88);
    const state = engine.getState();
    expect(state.statistics.redCardsAway).toBe(1);
    expect(state.statistics.yellowCardsAway).toBe(2);
  });

  it('should transition status to FINISHED at minute 90', () => {
    const engine = new LiveMatchEngine('Brazil', 'Spain');
    engine.startMatch();

    engine.tickTo(90);
    const state = engine.getState();
    expect(state.status).toBe('FINISHED');
  });
});
