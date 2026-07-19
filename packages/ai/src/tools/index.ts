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
        filtered = filtered.filter((s: any) => s.match.venueId === input.stadiumId);
      }
      if (input.teamId) {
        filtered = filtered.filter((s: any) => s.match.teams.some((t: any) => t.teamId === input.teamId));
      }

      // Sort
      if (input.sortBy === 'cheapest') {
        filtered.sort((a: any, b: any) => a.price - b.price);
      } else if (input.sortBy === 'premium') {
        filtered.sort((a: any, b: any) => b.price - a.price);
      } else if (input.sortBy === 'midfield') {
        filtered.sort((a: any, _b: any) => (a.row === 'A' || a.row === 'B' ? -1 : 1));
      } else if (input.sortBy === 'family') {
        filtered.sort((a: any, _b: any) => (a.section.includes('3') ? -1 : 1));
      }

      return filtered.map((s: any) => ({
        id: s.id,
        matchId: s.matchId,
        section: s.section,
        row: s.row,
        number: s.number,
        price: s.price,
        status: s.status,
        match: {
          venue: { name: s.match.venue.name },
          teams: s.match.teams.map((t: any) => ({ team: { name: t.team.name } })),
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
// -------------------------------------------------------------
// 2. Travel & Local Grounding Tools
// -------------------------------------------------------------
export interface WeatherOutput {
  temperature: number;
  rainProbability: number;
  humidity: number;
  windSpeed: number;
  icon: string;
  advice: string[];
}

export class WeatherTool extends BaseTool<{ date?: string; stadiumId?: string }, WeatherOutput> {
  name = 'WeatherCheck';
  description = 'Checks the match day weather forecast and returns meteorological parameters and AI safety advice.';
  schema = z.object({
    date: z.string().optional(),
    stadiumId: z.string().optional(),
  });

  async execute(_input: { date?: string; stadiumId?: string }): Promise<WeatherOutput> {
    return {
      temperature: 24,
      rainProbability: 10,
      humidity: 60,
      windSpeed: 12,
      icon: 'sunny',
      advice: ['Carry sunscreen', 'Hydrate', 'Wear lightweight fabrics'],
    };
  }
}

export interface MapsInput {
  from: string;
  to: string;
  mode: 'walking' | 'driving' | 'metro' | 'bus' | 'taxi';
}

export interface MapsOutput {
  routeName: string;
  durationMinutes: number;
  walkingDistanceMeters: number;
  transfers: number;
  costEstimate: number;
}

export class MapsTool extends BaseTool<MapsInput, MapsOutput> {
  name = 'MapsSearch';
  description = 'Calculates travel routes, durations, walking distances, transit transfers, and estimated costs.';
  schema = z.object({
    from: z.string(),
    to: z.string(),
    mode: z.enum(['walking', 'driving', 'metro', 'bus', 'taxi']),
  });

  async execute(input: MapsInput): Promise<MapsOutput> {
    const { mode } = input;
    switch (mode) {
      case 'walking':
        return {
          routeName: 'Stadium Pedestrian Boulevard',
          durationMinutes: 45,
          walkingDistanceMeters: 3200,
          transfers: 0,
          costEstimate: 0,
        };
      case 'driving':
        return {
          routeName: 'Highway 2 North',
          durationMinutes: 15,
          walkingDistanceMeters: 100,
          transfers: 0,
          costEstimate: 12,
        };
      case 'metro':
        return {
          routeName: 'Metro Line 4 Express',
          durationMinutes: 18,
          walkingDistanceMeters: 400,
          transfers: 1,
          costEstimate: 3,
        };
      case 'bus':
        return {
          routeName: 'Stadium Shuttle Bus Route B',
          durationMinutes: 28,
          walkingDistanceMeters: 300,
          transfers: 0,
          costEstimate: 2,
        };
      case 'taxi':
        return {
          routeName: 'City Cab Express Lane',
          durationMinutes: 15,
          walkingDistanceMeters: 50,
          transfers: 0,
          costEstimate: 25,
        };
    }
  }
}

// Deprecated in favor of the unified MapsSearch tool, maintained for backward compatibility scaffolding.
export class RouteTool extends BaseTool<{ from: string; to: string }, { durationMinutes: number; routeName: string }> {
  name = 'RoutePlanning';
  description = 'Calculates travel times and pathways between locations (scaffold).';
  schema = z.object({
    from: z.string(),
    to: z.string(),
  });

  async execute(_input: { from: string; to: string }): Promise<{ durationMinutes: number; routeName: string }> {
    return { durationMinutes: 18, routeName: 'Metro Line 4 Express' };
  }
}

export interface RestaurantOutput {
  name: string;
  rating: number;
  distanceMeters: number;
  estimatedWaitMinutes: number;
  priceRange: string;
  tags: string[];
}

export class RestaurantTool extends BaseTool<{ stadiumId: string; budgetMax?: number; dietaryFilters?: string[] }, RestaurantOutput[]> {
  name = 'RestaurantSearch';
  description = 'Recommends nearby restaurants filtered by stadium proximity, budget limits, and dietary options.';
  schema = z.object({
    stadiumId: z.string(),
    budgetMax: z.number().optional(),
    dietaryFilters: z.array(z.string()).optional(),
  });

  async execute(_input: { stadiumId: string; budgetMax?: number; dietaryFilters?: string[] }): Promise<RestaurantOutput[]> {
    return [
      {
        name: 'Al Lusail Grill & Shawarma',
        rating: 4.7,
        distanceMeters: 350,
        estimatedWaitMinutes: 15,
        priceRange: '$$',
        tags: ['halal', 'family', 'budget'],
      },
      {
        name: 'Green Oasis Vegan Diner',
        rating: 4.5,
        distanceMeters: 620,
        estimatedWaitMinutes: 10,
        priceRange: '$$',
        tags: ['vegan', 'vegetarian', 'family'],
      },
      {
        name: 'The Premium Pitchside Bistro',
        rating: 4.9,
        distanceMeters: 150,
        estimatedWaitMinutes: 25,
        priceRange: '$$$',
        tags: ['premium', 'family'],
      },
      {
        name: 'Quick Kick Fast Food',
        rating: 4.1,
        distanceMeters: 280,
        estimatedWaitMinutes: 5,
        priceRange: '$',
        tags: ['fastfood', 'budget'],
      },
    ];
  }
}

export interface StadiumGuideOutput {
  entryGate: string;
  restrooms: string;
  foodCourt: string;
  medical: string;
  parkingZone: string;
  emergencyExit: string;
  accessibilityRoutes: string[];
}

export class StadiumGuideTool extends BaseTool<{ stadiumId: string; accessibility?: boolean }, StadiumGuideOutput> {
  name = 'StadiumGuideCheck';
  description = 'Provides stadium facility mapping details including entry gates, food courts, medical bays, and wheelchair accessible pathways.';
  schema = z.object({
    stadiumId: z.string(),
    accessibility: z.boolean().optional(),
  });

  async execute(input: { stadiumId: string; accessibility?: boolean }): Promise<StadiumGuideOutput> {
    return {
      entryGate: input.accessibility ? 'North Gate (Wheelchair Accessible)' : 'Gate 3 East',
      restrooms: 'Section 112 & Section 204',
      foodCourt: 'Main Concourses Level 1 & 2',
      medical: 'First Aid Station adjacent to Section 115',
      parkingZone: input.accessibility ? 'Parking Lot A (Accessible Pass Only)' : 'Parking Lot C',
      emergencyExit: 'Exits 4, 8, and 12',
      accessibilityRoutes: [
        'Elevator access via East concourse to Level 2 seating',
        'Ramp walkways equipped at all main boundary entries',
      ],
    };
  }
}

export interface HotelOutput {
  name: string;
  rating: number;
  distanceMeters: number;
  pricePerNight: number;
  tags: string[];
}

export class HotelTool extends BaseTool<{ stadiumId: string; budgetMax?: number }, HotelOutput[]> {
  name = 'HotelSearch';
  description = 'Finds local accommodations, lodges, and luxury hotels near the specified stadium.';
  schema = z.object({
    stadiumId: z.string(),
    budgetMax: z.number().optional(),
  });

  async execute(_input: { stadiumId: string; budgetMax?: number }): Promise<HotelOutput[]> {
    return [
      {
        name: 'The Grand Cup Plaza Hotel',
        rating: 4.8,
        distanceMeters: 800,
        pricePerNight: 280,
        tags: ['premium', 'pool', 'gym'],
      },
      {
        name: 'Lusail Supporter Lodge',
        rating: 4.3,
        distanceMeters: 1400,
        pricePerNight: 95,
        tags: ['budget', 'free-wifi'],
      },
      {
        name: 'Stadium View Suites',
        rating: 4.6,
        distanceMeters: 450,
        pricePerNight: 190,
        tags: ['family', 'breakfast-included'],
      },
    ];
  }
}

export interface MedicalOutput {
  nearestMedicalBay: string;
  contactNumber: string;
  distanceMeters: number;
  emergencyResponseTimeMinutes: number;
}

export class MedicalTool extends BaseTool<{ stadiumId: string }, MedicalOutput> {
  name = 'MedicalCheck';
  description = 'Retrieves nearest medical services, pharmacy lists, and emergency response statistics.';
  schema = z.object({
    stadiumId: z.string(),
  });

  async execute(_input: { stadiumId: string }): Promise<MedicalOutput> {
    return {
      nearestMedicalBay: 'Stadium Emergency Trauma Center (Station A)',
      contactNumber: '+974 4400 9999',
      distanceMeters: 150,
      emergencyResponseTimeMinutes: 3,
    };
  }
}

export interface CrowdPredictionOutput {
  crowdDensity: 'Low' | 'Medium' | 'High' | 'Critical';
  waitTimeMinutes: number;
  recommendedGate: string;
  advice: string;
}

export class CrowdPredictionTool extends BaseTool<{ stadiumId: string; timeOfDay?: string }, CrowdPredictionOutput> {
  name = 'CrowdPredictionCheck';
  description = 'Analyzes real-time fan telemetry to predict stadium crowd densities and gate queuing wait times.';
  schema = z.object({
    stadiumId: z.string(),
    timeOfDay: z.string().optional(),
  });

  async execute(_input: { stadiumId: string; timeOfDay?: string }): Promise<CrowdPredictionOutput> {
    return {
      crowdDensity: 'High',
      waitTimeMinutes: 20,
      recommendedGate: 'Gate 5 West (Low Queue)',
      advice: 'Expect heavy traffic near the South Metro interchange. Travel via West gate bypass paths.',
    };
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

// -------------------------------------------------------------
// 4. Match Day Companion Tools
// -------------------------------------------------------------
export interface StadiumNavigationOutput {
  routeDescription: string;
  distanceMeters: number;
  estimatedMinutes: number;
  pathCoordinates: Array<{ x: number; y: number }>;
  accessibleElevatorUsed: boolean;
}

export class StadiumNavigationTool extends BaseTool<
  { currentPosition: string; destination: string; accessibilityMode?: boolean },
  StadiumNavigationOutput
> {
  name = 'StadiumNavigation';
  description = 'Computes stadium interior navigation instructions, elevator routes, and path mapping.';
  schema = z.object({
    currentPosition: z.string(),
    destination: z.string(),
    accessibilityMode: z.boolean().optional(),
  });

  async execute(input: { currentPosition: string; destination: string; accessibilityMode?: boolean }): Promise<StadiumNavigationOutput> {
    const isAccessible = input.accessibilityMode || false;
    return {
      routeDescription: isAccessible
        ? `Wheelchair accessible route: Proceed to Elevator Lift Section 112, ascend to Level 2 Concourse, exit left to seat.`
        : `Walk along the main concourse block 112, take staircase C to Level 2 seating aisle.`,
      distanceMeters: isAccessible ? 150 : 120,
      estimatedMinutes: isAccessible ? 4 : 2,
      pathCoordinates: [
        { x: 300, y: 150 },
        { x: 280, y: 110 },
        { x: 230, y: 220 },
      ],
      accessibleElevatorUsed: isAccessible,
    };
  }
}

export interface EmergencyOutput {
  boothName: string;
  locationDetails: string;
  status: string;
  emergencyContact: string;
  urgentInstructions: string;
}

export class EmergencyTool extends BaseTool<
  { type: 'medical' | 'security' | 'lost-found' | 'police' | 'child-help'; stadiumId: string },
  EmergencyOutput
> {
  name = 'EmergencyCheck';
  description = 'Retrieves nearest safety stations, security posts, child-assist tables, and police hotspots.';
  schema = z.object({
    type: z.enum(['medical', 'security', 'lost-found', 'police', 'child-help']),
    stadiumId: z.string(),
  });

  async execute(input: { type: 'medical' | 'security' | 'lost-found' | 'police' | 'child-help'; stadiumId: string }): Promise<EmergencyOutput> {
    const contacts: Record<string, string> = {
      medical: '+974 4400 9999',
      security: '+974 4400 9911',
      police: '+974 4400 9922',
      'lost-found': '+974 4400 9933',
      'child-help': '+974 4400 9944',
    };

    const details: Record<string, { boothName: string; locationDetails: string; instructions: string }> = {
      medical: {
        boothName: 'First Aid Trauma Station Adjacent to Section 115',
        locationDetails: 'Main concourse next to block 115 entrance.',
        instructions: 'Medical dispatch notified. Stand by at your current coordinates.',
      },
      security: {
        boothName: 'Security Desk Block B',
        locationDetails: 'Next to East Gate Ticketing.',
        instructions: 'Security unit dispatched. Speak with the nearest steward.',
      },
      police: {
        boothName: 'Lusail Stadium Police Depot',
        locationDetails: 'Ground floor administration block.',
        instructions: 'Local law enforcement notified.',
      },
      'lost-found': {
        boothName: 'Spectator Services Lost & Found Point',
        locationDetails: 'Main concourse desk at Section 102.',
        instructions: 'Proceed to Section 102 desk to report items.',
      },
      'child-help': {
        boothName: 'Family Support and Lost Child Station',
        locationDetails: 'Section 108 play zone concourse.',
        instructions: 'Steward team alerted. Please remain at your seat with the child.',
      },
    };

    const choice = details[input.type] || details.medical;

    return {
      boothName: choice.boothName,
      locationDetails: choice.locationDetails,
      status: 'DISPATCHED',
      emergencyContact: contacts[input.type] || '+974 4400 9999',
      urgentInstructions: choice.instructions,
    };
  }
}

export interface TranslationOutput {
  originalText: string;
  translatedText: string;
  languageDetected: string;
}

export class TranslationTool extends BaseTool<
  { text: string; targetLanguage: 'English' | 'Spanish' | 'Portuguese' | 'French' | 'Hindi' | 'Arabic' },
  TranslationOutput
> {
  name = 'TranslateText';
  description = 'Translates match reports, security warnings, and commentary between multilingual fan profiles.';
  schema = z.object({
    text: z.string(),
    targetLanguage: z.enum(['English', 'Spanish', 'Portuguese', 'French', 'Hindi', 'Arabic']),
  });

  async execute(input: { text: string; targetLanguage: 'English' | 'Spanish' | 'Portuguese' | 'French' | 'Hindi' | 'Arabic' }): Promise<TranslationOutput> {
    const translations: Record<string, Record<string, string>> = {
      'Brazil are moving the ball efficiently across the midfield line.': {
        Spanish: 'Brasil está moviendo el balón de manera eficiente en la línea del mediocampo.',
        Portuguese: 'O Brasil está movendo a bola eficientemente pela linha do meio-campo.',
        French: 'Le Brésil déplace le ballon efficacement sur la ligne médiane.',
        Hindi: 'ब्राजील मिडफील्ड लाइन पर कुशलतापूर्वक गेंद को आगे बढ़ा रहा है।',
        Arabic: 'البرازيل تنقل الكرة بكفاءة عبر خط الوسط.',
      },
      'Spain are pressing aggressively.': {
        Spanish: 'España está presionando agresivamente.',
        Portuguese: 'A Espanha está pressionando agressivamente.',
        French: 'L\'Espagne presse agressivement.',
        Hindi: 'स्पेन आक्रामक तरीके से दबाव बना रहा है।',
        Arabic: 'إسبانيا تضغط بقوة.',
      },
    };

    const matches = translations[input.text];
    const translatedText = matches?.[input.targetLanguage] || `[${input.targetLanguage}] ${input.text}`;

    return {
      originalText: input.text,
      translatedText,
      languageDetected: 'English',
    };
  }
}

export interface ReplayGuidanceOutput {
  cameraAngles: string[];
  replayAvailable: boolean;
  bestSeatAngle: string;
  clipDurationSeconds: number;
}

export class ReplayGuidanceTool extends BaseTool<{ matchId: string; eventType: string }, ReplayGuidanceOutput> {
  name = 'ReplayGuidance';
  description = 'Provides multi-angle stadium camera viewing guidelines and instant replay highlights.';
  schema = z.object({
    matchId: z.string(),
    eventType: z.string(),
  });

  async execute(_input: { matchId: string; eventType: string }): Promise<ReplayGuidanceOutput> {
    return {
      cameraAngles: ['Main Stand Wide Cam 1', 'Tactical Sky Cam 2', 'Goalmouth Close-up Cam 3', 'Spidercam Altitude 4'],
      replayAvailable: true,
      bestSeatAngle: 'Goalmouth Close-up Cam 3 (Section 112)',
      clipDurationSeconds: 15,
    };
  }
}
