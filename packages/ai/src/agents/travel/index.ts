import { IAgent, ISessionContext, IKernel, AgentResult } from '../../interfaces';
import { AITravelRecommendationEngine } from '../../engine/travelRecommendation';
import {
  WeatherOutput,
  RestaurantOutput,
  StadiumGuideOutput,
  HotelOutput,
  MedicalOutput,
  CrowdPredictionOutput,
} from '../../tools';

export class TravelAgent implements IAgent {
  name = 'TravelAgent';
  version = '1.0.0';
  description = 'Coordinates end-to-end travel itinerary planning, transit routing, weather advice, dining recommendations, and stadium navigation.';
  capabilities = ['travel', 'routing', 'weather', 'dining', 'hotels', 'medical', 'crowd'];
  priority = 10;

  async execute(context: ISessionContext, kernel: IKernel): Promise<AgentResult> {
    const memory = context.fanMemory as Record<string, unknown> | null;
    const stadiumId = 'stadium-100'; // Default fallback
    const matchId = 'match-100'; // Default fallback
    const userId = context.currentUser?.id || 'u-100';

    try {
      // 1. Execute Weather check
      const weather = (await kernel.toolRegistry.executeTool('WeatherCheck', {
        stadiumId,
      })) as WeatherOutput;

      // 2. Execute Restaurant search
      const budgetMax = typeof memory?.budget === 'number' ? memory.budget : undefined;
      const accessibilityNeeds = typeof memory?.accessibilityNeeds === 'string' ? memory.accessibilityNeeds : 'None';
      const restaurants = (await kernel.toolRegistry.executeTool('RestaurantSearch', {
        stadiumId,
        budgetMax,
        dietaryFilters: accessibilityNeeds !== 'None' ? [accessibilityNeeds] : [],
      })) as RestaurantOutput[];

      // 3. Execute Stadium Guide check
      const isAccessible = accessibilityNeeds !== 'None';
      const stadiumGuide = (await kernel.toolRegistry.executeTool('StadiumGuideCheck', {
        stadiumId,
        accessibility: isAccessible,
      })) as StadiumGuideOutput;

      // 4. Execute Hotel search
      const hotels = (await kernel.toolRegistry.executeTool('HotelSearch', {
        stadiumId,
        budgetMax,
      })) as HotelOutput[];

      // 5. Execute Medical check
      const medical = (await kernel.toolRegistry.executeTool('MedicalCheck', {
        stadiumId,
      })) as MedicalOutput;

      // 6. Execute Crowd prediction
      const crowd = (await kernel.toolRegistry.executeTool('CrowdPredictionCheck', {
        stadiumId,
      })) as CrowdPredictionOutput;

      // 7. Calculate travel recommendations using our engine
      const routeOptions = AITravelRecommendationEngine.getRecommendations({
        userId,
        stadiumId,
        matchId,
        userLocation: 'Doha Downtown',
        budget: budgetMax || 1000,
        accessibilityNeeds,
        weatherForecast: weather?.icon || 'sunny',
      });

      // 8. Generate AI Day Planner and Leave Time recommendation
      const selectedRoute = routeOptions.bestRoute;
      const recommendedRestaurant = restaurants?.[0]?.name || 'Al Lusail Grill';
      const kickoffTime = '18:30';

      const leaveTimeMinutes = selectedRoute.estimatedTimeMinutes + crowd.waitTimeMinutes + 30; // Travel + Queue + Buffer
      const leaveHour = 18;
      let leaveMin = 30 - leaveTimeMinutes;
      let adjustedHour = leaveHour;
      if (leaveMin < 0) {
        adjustedHour -= 1;
        leaveMin += 60;
      }
      const leaveTimeStr = `${adjustedHour.toString().padStart(2, '0')}:${leaveMin.toString().padStart(2, '0')}`;

      const dayPlanner = [
        { time: leaveTimeStr, title: 'Depart Home / Hotel', description: `Commute via ${selectedRoute.routeName} (${selectedRoute.mode}).` },
        { time: '17:30', title: 'Dine at Local Spot', description: `Enjoy food at ${recommendedRestaurant} near the stadium.` },
        { time: '18:00', title: 'Arrive at Security Check', description: `Head to ${stadiumGuide.entryGate}. Crowd wait time is ${crowd.waitTimeMinutes} mins.` },
        { time: '18:20', title: 'Find Your Seat', description: `Navigate to Section ${stadiumGuide.restrooms.split(' ')[0]}.` },
        { time: kickoffTime, title: 'Kickoff Starts', description: 'Enjoy the match!' },
      ];

      return {
        agentName: this.name,
        success: true,
        data: {
          weather,
          restaurants,
          stadiumGuide,
          hotels,
          medical,
          crowd,
          routes: routeOptions,
          leaveTimeRecommendation: {
            suggestedLeaveTime: leaveTimeStr,
            totalTravelTimeMinutes: selectedRoute.estimatedTimeMinutes,
            queueTimeMinutes: crowd.waitTimeMinutes,
            reason: `Based on your chosen mode (${selectedRoute.mode}) and current ${crowd.crowdDensity.toLowerCase()} crowd density at the gate.`,
          },
          dayPlanner,
        },
        confidence: 0.95,
        reasoning: `Planned journey for user using ${selectedRoute.mode} transit. Factored weather forecast (${weather.temperature}°C) and ${crowd.crowdDensity.toLowerCase()} crowd levels.`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Travel Agent execution failed';
      return {
        agentName: this.name,
        success: false,
        data: { error: msg },
        confidence: 0.0,
        reasoning: `Encountered execution error: ${msg}`,
      };
    }
  }
}
