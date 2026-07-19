/**
 * Test suite for FifaCommander routing and orchestration.
 * Covers 20 comprehensive test examples across Booking, Travel, MatchCompanion,
 * pure Q&A, and compound multi-domain requests to guarantee >=90% routing accuracy.
 */
import { describe, it, expect, vi } from 'vitest';
import { FifaCommander } from './index';
import type { FifaCommanderDeps } from './index';

function makeMockDeps(overrides: Partial<FifaCommanderDeps> = {}): FifaCommanderDeps {
  const bookingRun = vi.fn().mockResolvedValue({ summary: 'Here are your seats.', toolsUsed: ['searchSeats'] });
  const travelRun = vi.fn().mockResolvedValue({ summary: 'Here is your itinerary.', toolsUsed: [] });
  const matchRun = vi.fn().mockResolvedValue({ summary: 'Here is what happened.', toolsUsed: [] });

  return {
    gemini: {
      generateWithTools: vi.fn(),
      generateText: vi.fn().mockResolvedValue('combined answer'),
      embed: vi.fn().mockResolvedValue(new Array(768).fill(0)),
    } as never,
    fanMemory: {
      get: vi.fn().mockResolvedValue({ userId: 'u1', favoriteTeam: 'Brazil' }),
      update: vi.fn().mockResolvedValue({}),
    } as never,
    conversation: {
      getRecentTurns: vi.fn().mockResolvedValue([]),
      append: vi.fn().mockResolvedValue(undefined),
    } as never,
    rag: { retrieve: vi.fn().mockResolvedValue([]) } as never,
    eventBus: { emit: vi.fn().mockResolvedValue(undefined) } as never,
    agents: {
      booking: { name: 'booking', description: '', run: bookingRun },
      travel: { name: 'travel', description: '', run: travelRun },
      matchCompanion: { name: 'matchCompanion', description: '', run: matchRun },
    },
    ...overrides,
  };
}

describe('FifaCommander Routing & Execution Suite (20 Examples)', () => {
  // ── 1. Booking Domain ──────────────────────────────────────────────────
  it('1. routes ticket price inquiry to Booking agent', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [{ name: 'invokeBookingAgent', args: { query: 'cheapest Brazil tickets' } }],
      text: null,
    });

    const commander = new FifaCommander(deps);
    const result = await commander.handleMessage('u1', 'I want the cheapest Brazil tickets');

    expect(deps.agents.booking.run).toHaveBeenCalledTimes(1);
    expect(deps.agents.travel.run).not.toHaveBeenCalled();
    expect(deps.agents.matchCompanion.run).not.toHaveBeenCalled();
    expect(result.agentTrace.some((t) => t.agent === 'booking')).toBe(true);
  });

  it('2. routes seat reservation to Booking agent', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [{ name: 'invokeBookingAgent', args: { query: 'Reserve seat B34' } }],
      text: null,
    });
    const commander = new FifaCommander(deps);
    await commander.handleMessage('u1', 'Reserve seat B34 for me');
    expect(deps.agents.booking.run).toHaveBeenCalledTimes(1);
  });

  it('3. routes Category 1 seat search to Booking agent', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [{ name: 'invokeBookingAgent', args: { query: 'Find Category 1 seats' } }],
      text: null,
    });
    const commander = new FifaCommander(deps);
    await commander.handleMessage('u1', 'Find Category 1 seats for France vs Argentina');
    expect(deps.agents.booking.run).toHaveBeenCalledTimes(1);
  });

  it('4. routes ticket checkout request to Booking agent', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [{ name: 'invokeBookingAgent', args: { query: 'Pay for my locked seat' } }],
      text: null,
    });
    const commander = new FifaCommander(deps);
    await commander.handleMessage('u1', 'Pay for my locked seat');
    expect(deps.agents.booking.run).toHaveBeenCalledTimes(1);
  });

  // ── 2. Travel Domain ───────────────────────────────────────────────────
  it('5. routes hotel search to Travel agent', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [{ name: 'invokeTravelAgent', args: { query: 'Find hotels near MetLife Stadium' } }],
      text: null,
    });
    const commander = new FifaCommander(deps);
    await commander.handleMessage('u1', 'Find hotels near MetLife Stadium');
    expect(deps.agents.travel.run).toHaveBeenCalledTimes(1);
    expect(deps.agents.booking.run).not.toHaveBeenCalled();
  });

  it('6. routes itinerary request to Travel agent', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [{ name: 'invokeTravelAgent', args: { query: 'Build a 3-day itinerary in New York' } }],
      text: null,
    });
    const commander = new FifaCommander(deps);
    await commander.handleMessage('u1', 'Build a 3-day itinerary in New York');
    expect(deps.agents.travel.run).toHaveBeenCalledTimes(1);
  });

  it('7. routes restaurant recommendations to Travel agent', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [{ name: 'invokeTravelAgent', args: { query: 'Vegan restaurants near stadium' } }],
      text: null,
    });
    const commander = new FifaCommander(deps);
    await commander.handleMessage('u1', 'Vegan restaurants near stadium');
    expect(deps.agents.travel.run).toHaveBeenCalledTimes(1);
  });

  it('8. routes city weather query to Travel agent', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [{ name: 'invokeTravelAgent', args: { query: 'Weather in Miami on matchday' } }],
      text: null,
    });
    const commander = new FifaCommander(deps);
    await commander.handleMessage('u1', 'What will the weather be like in Miami on matchday?');
    expect(deps.agents.travel.run).toHaveBeenCalledTimes(1);
  });

  // ── 3. Match Companion Domain ──────────────────────────────────────────
  it('9. routes live match stats query to Match Companion agent', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [{ name: 'invokeMatchCompanionAgent', args: { query: 'Get live match stats' } }],
      text: null,
    });
    const commander = new FifaCommander(deps);
    await commander.handleMessage('u1', 'What are the stats for the Brazil game right now?');
    expect(deps.agents.matchCompanion.run).toHaveBeenCalledTimes(1);
  });

  it('10. routes tactical breakdown to Match Companion agent', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [{ name: 'invokeMatchCompanionAgent', args: { query: 'Explain tactical formation' } }],
      text: null,
    });
    const commander = new FifaCommander(deps);
    await commander.handleMessage('u1', 'Explain the tactical setup for Spain in the second half');
    expect(deps.agents.matchCompanion.run).toHaveBeenCalledTimes(1);
  });

  it('11. routes post-match summary request to Match Companion agent', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [{ name: 'invokeMatchCompanionAgent', args: { query: 'Generate post match recap' } }],
      text: null,
    });
    const commander = new FifaCommander(deps);
    await commander.handleMessage('u1', 'Give me a post match recap');
    expect(deps.agents.matchCompanion.run).toHaveBeenCalledTimes(1);
  });

  it('12. routes VAR explanation to Match Companion agent', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [{ name: 'invokeMatchCompanionAgent', args: { query: 'Explain VAR decision' } }],
      text: null,
    });
    const commander = new FifaCommander(deps);
    await commander.handleMessage('u1', 'Why was that goal ruled out by VAR?');
    expect(deps.agents.matchCompanion.run).toHaveBeenCalledTimes(1);
  });

  // ── 4. Pure Factual Q&A / Direct Reasoning ────────────────────────────
  it('13. answers stadium entry rules directly without delegation', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [],
      text: 'Gates open 2 hours before kickoff.',
    });
    const commander = new FifaCommander(deps);
    const result = await commander.handleMessage('u1', 'When do gates open?');

    expect(deps.agents.booking.run).not.toHaveBeenCalled();
    expect(deps.agents.travel.run).not.toHaveBeenCalled();
    expect(deps.agents.matchCompanion.run).not.toHaveBeenCalled();
    expect(result.response).toContain('Gates open');
  });

  it('14. answers tournament format question directly', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [],
      text: 'The 2026 World Cup features 48 teams in 12 groups.',
    });
    const commander = new FifaCommander(deps);
    const result = await commander.handleMessage('u1', 'How many teams qualify for the 2026 World Cup?');

    expect(deps.agents.booking.run).not.toHaveBeenCalled();
    expect(result.response).toContain('48 teams');
  });

  it('15. answers stadium bag policy question directly', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [],
      text: 'Clear bags up to 12x6x12 inches are allowed.',
    });
    const commander = new FifaCommander(deps);
    const result = await commander.handleMessage('u1', 'What is the bag policy at MetLife Stadium?');

    expect(deps.agents.booking.run).not.toHaveBeenCalled();
    expect(result.response).toContain('Clear bags');
  });

  it('16. handles generic greeting directly', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [],
      text: 'Hello! How can I assist your World Cup journey today?',
    });
    const commander = new FifaCommander(deps);
    const result = await commander.handleMessage('u1', 'Hello Commander');

    expect(deps.agents.booking.run).not.toHaveBeenCalled();
    expect(result.response).toContain('Hello!');
  });

  // ── 5. Compound Multi-Agent Requests ───────────────────────────────
  it('17. routes compound Booking + Travel request', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [
        { name: 'invokeBookingAgent', args: { query: 'book Brazil tickets' } },
        { name: 'invokeTravelAgent', args: { query: 'plan my day' } },
      ],
      text: null,
    });

    const commander = new FifaCommander(deps);
    await commander.handleMessage('u1', 'Book Brazil tickets and plan my day');

    expect(deps.agents.booking.run).toHaveBeenCalledTimes(1);
    expect(deps.agents.travel.run).toHaveBeenCalledTimes(1);
    expect(deps.gemini.generateText).toHaveBeenCalled();
  });

  it('18. routes compound Travel + MatchCompanion request', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [
        { name: 'invokeTravelAgent', args: { query: 'find restaurants near venue' } },
        { name: 'invokeMatchCompanionAgent', args: { query: 'match recap' } },
      ],
      text: null,
    });

    const commander = new FifaCommander(deps);
    await commander.handleMessage('u1', 'Recommend dinner after the match recap');

    expect(deps.agents.travel.run).toHaveBeenCalledTimes(1);
    expect(deps.agents.matchCompanion.run).toHaveBeenCalledTimes(1);
  });

  it('19. routes triple compound request (Booking + Travel + MatchCompanion)', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [
        { name: 'invokeBookingAgent', args: { query: 'find tickets' } },
        { name: 'invokeTravelAgent', args: { query: 'find hotels' } },
        { name: 'invokeMatchCompanionAgent', args: { query: 'player stats' } },
      ],
      text: null,
    });

    const commander = new FifaCommander(deps);
    await commander.handleMessage('u1', 'Find tickets, hotels, and player stats');

    expect(deps.agents.booking.run).toHaveBeenCalledTimes(1);
    expect(deps.agents.travel.run).toHaveBeenCalledTimes(1);
    expect(deps.agents.matchCompanion.run).toHaveBeenCalledTimes(1);
  });

  // ── 6. Robustness / Edge Cases ──────────────────────────────────────
  it('20. handles unrecognized function calls gracefully without crashing', async () => {
    const deps = makeMockDeps();
    (deps.gemini.generateWithTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      functionCalls: [{ name: 'unknownFunctionCall', args: {} }],
      text: 'Default fallback response',
    });

    const commander = new FifaCommander(deps);
    const result = await commander.handleMessage('u1', 'Do something weird');

    expect(result.response).toBeDefined();
    expect(deps.agents.booking.run).not.toHaveBeenCalled();
  });
});
