export interface TravelRecommendationInput {
  userId: string;
  stadiumId: string;
  matchId: string;
  userLocation: string;
  favoriteTeam?: string;
  budget: number;
  accessibilityNeeds: string;
  weatherForecast?: string;
}

export interface TravelRoute {
  routeName: string;
  mode: 'walking' | 'driving' | 'metro' | 'bus' | 'taxi';
  estimatedTimeMinutes: number;
  costEstimate: number;
  walkingDistanceMeters: number;
  transfers: number;
  confidence: number;
  reason: string;
}

export interface TravelRecommendationsResult {
  bestRoute: TravelRoute;
  cheapestRoute: TravelRoute;
  fastestRoute: TravelRoute;
  accessibleRoute: TravelRoute;
}

export class AITravelRecommendationEngine {
  static getRecommendations(input: TravelRecommendationInput): TravelRecommendationsResult {
    const isAccessible = input.accessibilityNeeds && input.accessibilityNeeds !== 'None';
    const isRaining = input.weatherForecast?.toLowerCase().includes('rain') || false;

    // 1. Cheapest Route (Bus)
    const cheapestRoute: TravelRoute = {
      routeName: 'Stadium Shuttle Bus Route B',
      mode: 'bus',
      estimatedTimeMinutes: 28,
      costEstimate: 2,
      walkingDistanceMeters: 300,
      transfers: 0,
      confidence: input.budget >= 2 ? 0.95 : 0.4,
      reason: 'Lowest cost option using direct event shuttle buses.',
    };

    // 2. Fastest Route (Taxi)
    const fastestRoute: TravelRoute = {
      routeName: 'City Cab Express Lane',
      mode: 'taxi',
      estimatedTimeMinutes: 15,
      costEstimate: 25,
      walkingDistanceMeters: 50,
      transfers: 0,
      confidence: input.budget >= 25 ? 0.9 : 0.3,
      reason: 'Direct door-to-door transit bypassing public transit transfers.',
    };

    // 3. Best Route (Metro)
    let bestRouteConfidence = 0.85;
    if (isRaining) {
      bestRouteConfidence -= 0.1; // rain makes walking to metro less favorable
    }
    const bestRoute: TravelRoute = {
      routeName: 'Metro Line 4 Express',
      mode: 'metro',
      estimatedTimeMinutes: 18,
      costEstimate: 3,
      walkingDistanceMeters: 400,
      transfers: 1,
      confidence: bestRouteConfidence,
      reason: 'Highly efficient transit route balancing speed, cost, and frequency.',
    };

    // 4. Accessible Route (Wheelchair Accessible Shuttle or Taxi)
    let accessibleConfidence = 0.95;
    if (isAccessible) {
      accessibleConfidence = 0.99;
    }
    const accessibleRoute: TravelRoute = {
      routeName: 'Specialized Accessible Gate Shuttle',
      mode: 'taxi',
      estimatedTimeMinutes: 20,
      costEstimate: 15,
      walkingDistanceMeters: 20,
      transfers: 0,
      confidence: accessibleConfidence,
      reason: 'Zero transfers, minimal walking, and full wheelchair lift support.',
    };

    return {
      bestRoute,
      cheapestRoute,
      fastestRoute,
      accessibleRoute,
    };
  }
}
