import { Router, Response } from 'express';
import { RequireAuth, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/db';
import { kernel, eventBus } from '../lib/di';
import { AITravelRecommendationEngine, WeatherOutput } from '@fifa/ai';
import { logger } from '../lib/logger';

export const travelRouter = Router();

travelRouter.use(RequireAuth);

/**
 * GET /api/v1/travel/recommendations
 * Computes travel route options based on profile Fan DNA constraints.
 */
travelRouter.get('/recommendations', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const memory = await prisma.fanMemory.findUnique({ where: { userId } });
    const weatherTool = kernel.toolRegistry.getTool('WeatherCheck');
    let weatherForecast = 'sunny';

    if (weatherTool) {
      const weatherResult = (await kernel.toolRegistry.executeTool('WeatherCheck', { stadiumId: 'stadium-100' })) as WeatherOutput;
      weatherForecast = weatherResult.icon;
      eventBus.publish('WeatherChecked', { userId, weather: weatherResult });
    }

    const routeOptions = AITravelRecommendationEngine.getRecommendations({
      userId,
      stadiumId: 'stadium-100',
      matchId: 'match-100',
      userLocation: 'Doha Downtown',
      budget: memory?.budget || 1000,
      accessibilityNeeds: memory?.accessibilityNeeds || 'None',
      weatherForecast,
    });

    eventBus.publish('RouteCalculated', { userId, routes: routeOptions });
    eventBus.publish('TravelPlanGenerated', { userId, plan: routeOptions });

    res.status(200).json({ success: true, data: routeOptions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate recommendations';
    logger.error({ err }, 'Error in travel recommendations');
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/travel/restaurants
 */
travelRouter.get('/restaurants', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const memory = await prisma.fanMemory.findUnique({ where: { userId } });
    const result = await kernel.toolRegistry.executeTool('RestaurantSearch', {
      stadiumId: 'stadium-100',
      budgetMax: memory?.budget,
      dietaryFilters: memory?.accessibilityNeeds ? [memory.accessibilityNeeds] : [],
    });

    eventBus.publish('RestaurantRecommended', { userId, restaurants: result });
    res.status(200).json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query restaurants';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/travel/stadium-guide
 */
travelRouter.get('/stadium-guide', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const memory = await prisma.fanMemory.findUnique({ where: { userId } });
    const isAccessible = memory?.accessibilityNeeds && memory.accessibilityNeeds !== 'None';

    const result = await kernel.toolRegistry.executeTool('StadiumGuideCheck', {
      stadiumId: 'stadium-100',
      accessibility: isAccessible,
    });

    res.status(200).json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch stadium guide';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/travel/hotels
 */
travelRouter.get('/hotels', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const memory = await prisma.fanMemory.findUnique({ where: { userId } });
    const result = await kernel.toolRegistry.executeTool('HotelSearch', {
      stadiumId: 'stadium-100',
      budgetMax: memory?.budget,
    });

    res.status(200).json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to search hotels';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/travel/medical
 */
travelRouter.get('/medical', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const result = await kernel.toolRegistry.executeTool('MedicalCheck', {
      stadiumId: 'stadium-100',
    });

    res.status(200).json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load medical bay';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/travel/crowd
 */
travelRouter.get('/crowd', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const result = await kernel.toolRegistry.executeTool('CrowdPredictionCheck', {
      stadiumId: 'stadium-100',
    });

    res.status(200).json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to check crowd prediction';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/travel/start-journey
 * Starts the commute, updates database FanMemory logs, and inserts relational TravelHistory records.
 */
travelRouter.post('/start-journey', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { mode, routeName, durationMinutes } = req.body;
  if (!mode || !routeName || typeof durationMinutes !== 'number') {
    res.status(400).json({ success: false, error: 'Missing transit mode parameters' });
    return;
  }

  try {
    // 1. Transactionally write the travel history and update preferences
    const result = await prisma.$transaction(async (tx) => {
      const history = await tx.travelHistory.create({
        data: {
          userId,
          matchId: 'match-100',
          routeTaken: routeName,
          transport: mode,
          duration: durationMinutes,
        },
      });

      // Update long term memory preferences in FanMemory
      const memory = await tx.fanMemory.findUnique({ where: { userId } });
      if (memory) {
        // Parse and serialize into travelHistorySummary
        const prevSummary = memory.travelHistorySummary ? JSON.parse(memory.travelHistorySummary as string) : {};
        const prevDuration = typeof prevSummary.averageTravelTimeMinutes === 'number' ? prevSummary.averageTravelTimeMinutes : 30;
        const newAverage = Math.round((prevDuration + durationMinutes) / 2);

        const updatedSummary = JSON.stringify({
          preferredTransport: mode,
          averageTravelTimeMinutes: newAverage,
          preferredRestaurants: ['Al Lusail Grill & Shawarma'],
        });

        await tx.fanMemory.update({
          where: { userId },
          data: {
            travelHistorySummary: updatedSummary,
          },
        });
      }

      return history;
    });

    // 2. Publish Journey Started
    eventBus.publish('JourneyStarted', { userId, mode, routeName });
    eventBus.publish('ArrivedAtStadium', { userId, matchId: 'match-100' });

    res.status(200).json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to register start-journey';
    res.status(500).json({ success: false, error: msg });
  }
});
