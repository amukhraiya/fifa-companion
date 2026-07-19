/**
 * FIFA World Cup 2026 — Demo Fixture & Venue Dataset
 *
 * This is a DEMONSTRATION dataset for AI reasoning showcase.
 * It is NOT official FIFA data. It represents plausible fixture formats
 * for the purpose of demonstrating planning, multi-agent orchestration,
 * and contextual recommendations.
 *
 * World Cup 2026: Hosted across USA, Canada, and Mexico
 * Format: 48 teams, 104 matches
 */

export interface FIFA2026Match {
  id: string;
  stage: 'Group Stage' | 'Round of 32' | 'Round of 16' | 'Quarter-Final' | 'Semi-Final' | 'Third Place' | 'Final';
  group?: string;
  homeTeam: string;
  awayTeam: string;
  stadium: string;
  city: string;
  country: 'USA' | 'Canada' | 'Mexico';
  date: string; // ISO date string
  kickoffTime: string; // Local time HH:mm
  ticketPrices: {
    category3: number; // USD
    category2: number;
    category1: number;
    vip: number;
  };
  travelEstimates: {
    fromNewYork: number; // hours
    fromLosAngeles: number;
    fromToronto: number;
    fromMexicoCity: number;
  };
  stadiumCapacity: number;
  hotelPricePerNight: number; // USD estimate near stadium
}

export const FIFA_2026_STADIUMS = [
  { id: 'metlife', name: 'MetLife Stadium', city: 'New York/New Jersey', country: 'USA', capacity: 82500 },
  { id: 'sofi', name: 'SoFi Stadium', city: 'Los Angeles', country: 'USA', capacity: 70240 },
  { id: 'att', name: 'AT&T Stadium', city: 'Dallas', country: 'USA', capacity: 80000 },
  { id: 'hardrock', name: 'Hard Rock Stadium', city: 'Miami', country: 'USA', capacity: 65326 },
  { id: 'levis', name: "Levi's Stadium", city: 'San Francisco', country: 'USA', capacity: 68500 },
  { id: 'bmostadium', name: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA', capacity: 69596 },
  { id: 'arrowhead', name: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA', capacity: 76416 },
  { id: 'seattle', name: 'Lumen Field', city: 'Seattle', country: 'USA', capacity: 72000 },
  { id: 'gillette', name: 'Gillette Stadium', city: 'Boston', country: 'USA', capacity: 65878 },
  { id: 'bmo', name: 'BMO Field', city: 'Toronto', country: 'Canada', capacity: 30991 },
  { id: 'bcplace', name: 'BC Place', city: 'Vancouver', country: 'Canada', capacity: 54500 },
  { id: 'azteca', name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', capacity: 87523 },
  { id: 'akron', name: 'Estadio Akron', city: 'Guadalajara', country: 'Mexico', capacity: 49850 },
  { id: 'monterrey', name: 'Estadio BBVA', city: 'Monterrey', country: 'Mexico', capacity: 53500 },
  { id: 'nyStadium', name: 'Giants Stadium', city: 'Atlanta', country: 'USA', capacity: 71000 },
];

export const FIFA_2026_FIXTURES: FIFA2026Match[] = [
  // ─── GROUP STAGE ───
  {
    id: 'gA-1',
    stage: 'Group Stage',
    group: 'A',
    homeTeam: 'Brazil',
    awayTeam: 'Mexico',
    stadium: 'AT&T Stadium',
    city: 'Dallas',
    country: 'USA',
    date: '2026-06-11',
    kickoffTime: '18:00',
    ticketPrices: { category3: 180, category2: 320, category1: 520, vip: 1200 },
    travelEstimates: { fromNewYork: 3.5, fromLosAngeles: 2.5, fromToronto: 4.5, fromMexicoCity: 1.5 },
    stadiumCapacity: 80000,
    hotelPricePerNight: 180,
  },
  {
    id: 'gA-2',
    stage: 'Group Stage',
    group: 'A',
    homeTeam: 'Brazil',
    awayTeam: 'Germany',
    stadium: 'MetLife Stadium',
    city: 'New York',
    country: 'USA',
    date: '2026-06-16',
    kickoffTime: '20:00',
    ticketPrices: { category3: 220, category2: 380, category1: 620, vip: 1500 },
    travelEstimates: { fromNewYork: 0.5, fromLosAngeles: 6.0, fromToronto: 1.5, fromMexicoCity: 7.0 },
    stadiumCapacity: 82500,
    hotelPricePerNight: 280,
  },
  {
    id: 'gB-1',
    stage: 'Group Stage',
    group: 'B',
    homeTeam: 'France',
    awayTeam: 'Argentina',
    stadium: 'SoFi Stadium',
    city: 'Los Angeles',
    country: 'USA',
    date: '2026-06-12',
    kickoffTime: '18:00',
    ticketPrices: { category3: 250, category2: 420, category1: 700, vip: 1800 },
    travelEstimates: { fromNewYork: 6.0, fromLosAngeles: 0.3, fromToronto: 7.0, fromMexicoCity: 3.5 },
    stadiumCapacity: 70240,
    hotelPricePerNight: 220,
  },
  {
    id: 'gB-2',
    stage: 'Group Stage',
    group: 'B',
    homeTeam: 'France',
    awayTeam: 'Spain',
    stadium: 'Hard Rock Stadium',
    city: 'Miami',
    country: 'USA',
    date: '2026-06-18',
    kickoffTime: '19:00',
    ticketPrices: { category3: 200, category2: 350, category1: 580, vip: 1400 },
    travelEstimates: { fromNewYork: 3.0, fromLosAngeles: 5.5, fromToronto: 4.0, fromMexicoCity: 3.0 },
    stadiumCapacity: 65326,
    hotelPricePerNight: 200,
  },
  {
    id: 'gC-1',
    stage: 'Group Stage',
    group: 'C',
    homeTeam: 'England',
    awayTeam: 'Portugal',
    stadium: "Levi's Stadium",
    city: 'San Francisco',
    country: 'USA',
    date: '2026-06-13',
    kickoffTime: '16:00',
    ticketPrices: { category3: 190, category2: 330, category1: 540, vip: 1300 },
    travelEstimates: { fromNewYork: 6.5, fromLosAngeles: 1.5, fromToronto: 7.5, fromMexicoCity: 4.0 },
    stadiumCapacity: 68500,
    hotelPricePerNight: 240,
  },
  {
    id: 'gC-2',
    stage: 'Group Stage',
    group: 'C',
    homeTeam: 'Portugal',
    awayTeam: 'Germany',
    stadium: 'Lumen Field',
    city: 'Seattle',
    country: 'USA',
    date: '2026-06-19',
    kickoffTime: '18:00',
    ticketPrices: { category3: 185, category2: 320, category1: 510, vip: 1250 },
    travelEstimates: { fromNewYork: 7.0, fromLosAngeles: 2.5, fromToronto: 8.0, fromMexicoCity: 5.5 },
    stadiumCapacity: 72000,
    hotelPricePerNight: 195,
  },
  {
    id: 'gD-1',
    stage: 'Group Stage',
    group: 'D',
    homeTeam: 'Spain',
    awayTeam: 'Netherlands',
    stadium: 'Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    date: '2026-06-14',
    kickoffTime: '19:00',
    ticketPrices: { category3: 120, category2: 220, category1: 380, vip: 950 },
    travelEstimates: { fromNewYork: 6.5, fromLosAngeles: 4.0, fromToronto: 7.5, fromMexicoCity: 0.5 },
    stadiumCapacity: 87523,
    hotelPricePerNight: 95,
  },
  {
    id: 'gE-1',
    stage: 'Group Stage',
    group: 'E',
    homeTeam: 'Argentina',
    awayTeam: 'Japan',
    stadium: 'BMO Field',
    city: 'Toronto',
    country: 'Canada',
    date: '2026-06-15',
    kickoffTime: '20:00',
    ticketPrices: { category3: 160, category2: 280, category1: 460, vip: 1100 },
    travelEstimates: { fromNewYork: 1.5, fromLosAngeles: 5.5, fromToronto: 0.3, fromMexicoCity: 6.5 },
    stadiumCapacity: 30991,
    hotelPricePerNight: 160,
  },
  {
    id: 'gF-1',
    stage: 'Group Stage',
    group: 'F',
    homeTeam: 'Netherlands',
    awayTeam: 'Brazil',
    stadium: 'Gillette Stadium',
    city: 'Boston',
    country: 'USA',
    date: '2026-06-17',
    kickoffTime: '17:00',
    ticketPrices: { category3: 210, category2: 360, category1: 590, vip: 1450 },
    travelEstimates: { fromNewYork: 1.0, fromLosAngeles: 7.0, fromToronto: 2.0, fromMexicoCity: 8.0 },
    stadiumCapacity: 65878,
    hotelPricePerNight: 230,
  },
  {
    id: 'gG-1',
    stage: 'Group Stage',
    group: 'G',
    homeTeam: 'Germany',
    awayTeam: 'Morocco',
    stadium: 'Estadio Akron',
    city: 'Guadalajara',
    country: 'Mexico',
    date: '2026-06-20',
    kickoffTime: '18:00',
    ticketPrices: { category3: 110, category2: 200, category1: 340, vip: 880 },
    travelEstimates: { fromNewYork: 6.0, fromLosAngeles: 3.5, fromToronto: 7.0, fromMexicoCity: 1.0 },
    stadiumCapacity: 49850,
    hotelPricePerNight: 85,
  },
  {
    id: 'gH-1',
    stage: 'Group Stage',
    group: 'H',
    homeTeam: 'USA',
    awayTeam: 'England',
    stadium: 'Arrowhead Stadium',
    city: 'Kansas City',
    country: 'USA',
    date: '2026-06-21',
    kickoffTime: '19:00',
    ticketPrices: { category3: 175, category2: 310, category1: 500, vip: 1200 },
    travelEstimates: { fromNewYork: 4.0, fromLosAngeles: 3.5, fromToronto: 5.0, fromMexicoCity: 3.5 },
    stadiumCapacity: 76416,
    hotelPricePerNight: 145,
  },
  // ─── KNOCKOUT STAGE ───
  {
    id: 'r16-1',
    stage: 'Round of 16',
    homeTeam: 'Brazil',
    awayTeam: 'Portugal',
    stadium: 'SoFi Stadium',
    city: 'Los Angeles',
    country: 'USA',
    date: '2026-07-01',
    kickoffTime: '18:00',
    ticketPrices: { category3: 320, category2: 560, category1: 900, vip: 2200 },
    travelEstimates: { fromNewYork: 6.0, fromLosAngeles: 0.3, fromToronto: 7.0, fromMexicoCity: 3.5 },
    stadiumCapacity: 70240,
    hotelPricePerNight: 250,
  },
  {
    id: 'r16-2',
    stage: 'Round of 16',
    homeTeam: 'France',
    awayTeam: 'Germany',
    stadium: 'MetLife Stadium',
    city: 'New York',
    country: 'USA',
    date: '2026-07-02',
    kickoffTime: '20:00',
    ticketPrices: { category3: 350, category2: 600, category1: 980, vip: 2500 },
    travelEstimates: { fromNewYork: 0.5, fromLosAngeles: 6.0, fromToronto: 1.5, fromMexicoCity: 7.0 },
    stadiumCapacity: 82500,
    hotelPricePerNight: 300,
  },
  {
    id: 'r16-3',
    stage: 'Round of 16',
    homeTeam: 'England',
    awayTeam: 'Spain',
    stadium: 'AT&T Stadium',
    city: 'Dallas',
    country: 'USA',
    date: '2026-07-03',
    kickoffTime: '18:00',
    ticketPrices: { category3: 330, category2: 580, category1: 940, vip: 2300 },
    travelEstimates: { fromNewYork: 3.5, fromLosAngeles: 2.5, fromToronto: 4.5, fromMexicoCity: 1.5 },
    stadiumCapacity: 80000,
    hotelPricePerNight: 200,
  },
  {
    id: 'r16-4',
    stage: 'Round of 16',
    homeTeam: 'Argentina',
    awayTeam: 'Netherlands',
    stadium: 'Hard Rock Stadium',
    city: 'Miami',
    country: 'USA',
    date: '2026-07-04',
    kickoffTime: '19:00',
    ticketPrices: { category3: 340, category2: 590, category1: 960, vip: 2400 },
    travelEstimates: { fromNewYork: 3.0, fromLosAngeles: 5.5, fromToronto: 4.0, fromMexicoCity: 3.0 },
    stadiumCapacity: 65326,
    hotelPricePerNight: 225,
  },
  // ─── QUARTER-FINALS ───
  {
    id: 'qf-1',
    stage: 'Quarter-Final',
    homeTeam: 'Brazil',
    awayTeam: 'France',
    stadium: 'MetLife Stadium',
    city: 'New York',
    country: 'USA',
    date: '2026-07-09',
    kickoffTime: '20:00',
    ticketPrices: { category3: 480, category2: 850, category1: 1400, vip: 3500 },
    travelEstimates: { fromNewYork: 0.5, fromLosAngeles: 6.0, fromToronto: 1.5, fromMexicoCity: 7.0 },
    stadiumCapacity: 82500,
    hotelPricePerNight: 350,
  },
  {
    id: 'qf-2',
    stage: 'Quarter-Final',
    homeTeam: 'England',
    awayTeam: 'Argentina',
    stadium: 'SoFi Stadium',
    city: 'Los Angeles',
    country: 'USA',
    date: '2026-07-10',
    kickoffTime: '18:00',
    ticketPrices: { category3: 490, category2: 870, category1: 1450, vip: 3600 },
    travelEstimates: { fromNewYork: 6.0, fromLosAngeles: 0.3, fromToronto: 7.0, fromMexicoCity: 3.5 },
    stadiumCapacity: 70240,
    hotelPricePerNight: 300,
  },
  // ─── SEMI-FINALS ───
  {
    id: 'sf-1',
    stage: 'Semi-Final',
    homeTeam: 'TBD (Winner QF1)',
    awayTeam: 'TBD (Winner QF2)',
    stadium: 'MetLife Stadium',
    city: 'New York',
    country: 'USA',
    date: '2026-07-14',
    kickoffTime: '20:00',
    ticketPrices: { category3: 700, category2: 1200, category1: 2000, vip: 5000 },
    travelEstimates: { fromNewYork: 0.5, fromLosAngeles: 6.0, fromToronto: 1.5, fromMexicoCity: 7.0 },
    stadiumCapacity: 82500,
    hotelPricePerNight: 420,
  },
  {
    id: 'sf-2',
    stage: 'Semi-Final',
    homeTeam: 'TBD (Winner QF3)',
    awayTeam: 'TBD (Winner QF4)',
    stadium: 'AT&T Stadium',
    city: 'Dallas',
    country: 'USA',
    date: '2026-07-15',
    kickoffTime: '19:00',
    ticketPrices: { category3: 680, category2: 1150, category1: 1900, vip: 4800 },
    travelEstimates: { fromNewYork: 3.5, fromLosAngeles: 2.5, fromToronto: 4.5, fromMexicoCity: 1.5 },
    stadiumCapacity: 80000,
    hotelPricePerNight: 380,
  },
  // ─── FINAL ───
  {
    id: 'final',
    stage: 'Final',
    homeTeam: 'TBD (SF1 Winner)',
    awayTeam: 'TBD (SF2 Winner)',
    stadium: 'MetLife Stadium',
    city: 'New York',
    country: 'USA',
    date: '2026-07-19',
    kickoffTime: '19:00',
    ticketPrices: { category3: 1200, category2: 2200, category1: 3800, vip: 9500 },
    travelEstimates: { fromNewYork: 0.5, fromLosAngeles: 6.0, fromToronto: 1.5, fromMexicoCity: 7.0 },
    stadiumCapacity: 82500,
    hotelPricePerNight: 600,
  },
];

// All 32 teams with confederation and group info
export const FIFA_2026_TEAMS = [
  // Conmebol
  { name: 'Brazil', confederation: 'CONMEBOL', group: 'A', flagEmoji: '🇧🇷', ranking: 1 },
  { name: 'Argentina', confederation: 'CONMEBOL', group: 'E', flagEmoji: '🇦🇷', ranking: 2 },
  { name: 'Uruguay', confederation: 'CONMEBOL', group: 'F', flagEmoji: '🇺🇾', ranking: 15 },
  { name: 'Colombia', confederation: 'CONMEBOL', group: 'G', flagEmoji: '🇨🇴', ranking: 11 },
  // Europe
  { name: 'France', confederation: 'UEFA', group: 'B', flagEmoji: '🇫🇷', ranking: 3 },
  { name: 'England', confederation: 'UEFA', group: 'C', flagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ranking: 4 },
  { name: 'Spain', confederation: 'UEFA', group: 'D', flagEmoji: '🇪🇸', ranking: 5 },
  { name: 'Germany', confederation: 'UEFA', group: 'A', flagEmoji: '🇩🇪', ranking: 6 },
  { name: 'Portugal', confederation: 'UEFA', group: 'C', flagEmoji: '🇵🇹', ranking: 7 },
  { name: 'Netherlands', confederation: 'UEFA', group: 'D', flagEmoji: '🇳🇱', ranking: 8 },
  { name: 'Belgium', confederation: 'UEFA', group: 'H', flagEmoji: '🇧🇪', ranking: 9 },
  { name: 'Italy', confederation: 'UEFA', group: 'E', flagEmoji: '🇮🇹', ranking: 12 },
  { name: 'Croatia', confederation: 'UEFA', group: 'B', flagEmoji: '🇭🇷', ranking: 10 },
  { name: 'Denmark', confederation: 'UEFA', group: 'F', flagEmoji: '🇩🇰', ranking: 13 },
  { name: 'Switzerland', confederation: 'UEFA', group: 'G', flagEmoji: '🇨🇭', ranking: 16 },
  // CONCACAF
  { name: 'USA', confederation: 'CONCACAF', group: 'H', flagEmoji: '🇺🇸', ranking: 14 },
  { name: 'Mexico', confederation: 'CONCACAF', group: 'A', flagEmoji: '🇲🇽', ranking: 20 },
  { name: 'Canada', confederation: 'CONCACAF', group: 'D', flagEmoji: '🇨🇦', ranking: 38 },
  // Africa
  { name: 'Morocco', confederation: 'CAF', group: 'G', flagEmoji: '🇲🇦', ranking: 13 },
  { name: 'Senegal', confederation: 'CAF', group: 'F', flagEmoji: '🇸🇳', ranking: 21 },
  { name: 'Nigeria', confederation: 'CAF', group: 'C', flagEmoji: '🇳🇬', ranking: 30 },
  { name: 'Egypt', confederation: 'CAF', group: 'E', flagEmoji: '🇪🇬', ranking: 35 },
  // Asia
  { name: 'Japan', confederation: 'AFC', group: 'E', flagEmoji: '🇯🇵', ranking: 18 },
  { name: 'South Korea', confederation: 'AFC', group: 'B', flagEmoji: '🇰🇷', ranking: 22 },
  { name: 'Australia', confederation: 'AFC', group: 'H', flagEmoji: '🇦🇺', ranking: 23 },
  { name: 'Iran', confederation: 'AFC', group: 'A', flagEmoji: '🇮🇷', ranking: 24 },
  { name: 'Saudi Arabia', confederation: 'AFC', group: 'C', flagEmoji: '🇸🇦', ranking: 56 },
  // Oceania
  { name: 'New Zealand', confederation: 'OFC', group: 'F', flagEmoji: '🇳🇿', ranking: 90 },
];

/**
 * Find all fixtures for a given team
 */
export function getFixturesForTeam(teamName: string): FIFA2026Match[] {
  const lower = teamName.toLowerCase();
  return FIFA_2026_FIXTURES.filter(
    (m) => m.homeTeam.toLowerCase().includes(lower) || m.awayTeam.toLowerCase().includes(lower),
  );
}

/**
 * Find cheapest fixture for a team
 */
export function getCheapestFixtureForTeam(teamName: string): FIFA2026Match | null {
  const matches = getFixturesForTeam(teamName);
  if (matches.length === 0) return null;
  return matches.reduce((cheapest, match) =>
    match.ticketPrices.category3 < cheapest.ticketPrices.category3 ? match : cheapest,
  );
}

/**
 * Get fixtures by stage
 */
export function getFixturesByStage(stage: FIFA2026Match['stage']): FIFA2026Match[] {
  return FIFA_2026_FIXTURES.filter((m) => m.stage === stage);
}

/**
 * Calculate total estimated trip budget (INR)
 * @param ticketCategory ticket tier
 * @param nights number of nights hotel
 * @param usdToInr current exchange rate
 */
export function estimateTripCostINR(
  match: FIFA2026Match,
  ticketCategory: 'category3' | 'category2' | 'category1' | 'vip',
  nights: number,
  usdToInr = 83,
): {
  ticketUSD: number;
  hotelUSD: number;
  totalUSD: number;
  totalINR: number;
} {
  const ticketUSD = match.ticketPrices[ticketCategory];
  const hotelUSD = match.hotelPricePerNight * nights;
  const totalUSD = ticketUSD + hotelUSD + 200; // +$200 for meals/transport estimate
  return {
    ticketUSD,
    hotelUSD,
    totalUSD,
    totalINR: Math.round(totalUSD * usdToInr),
  };
}

/**
 * Find best match for budget (INR)
 */
export function findMatchesWithinBudgetINR(
  budgetINR: number,
  teamName?: string,
  nights = 3,
  usdToInr = 83,
): Array<{ match: FIFA2026Match; cost: ReturnType<typeof estimateTripCostINR> }> {
  const fixtures = teamName ? getFixturesForTeam(teamName) : FIFA_2026_FIXTURES;
  const results: Array<{ match: FIFA2026Match; cost: ReturnType<typeof estimateTripCostINR> }> = [];

  for (const match of fixtures) {
    for (const tier of ['category3', 'category2', 'category1', 'vip'] as const) {
      const cost = estimateTripCostINR(match, tier, nights, usdToInr);
      if (cost.totalINR <= budgetINR) {
        results.push({ match, cost });
        break; // only add once per match (cheapest valid tier)
      }
    }
  }

  return results.sort((a, b) => a.cost.totalINR - b.cost.totalINR);
}
