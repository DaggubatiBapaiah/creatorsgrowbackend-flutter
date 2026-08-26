import { Request, Response, NextFunction } from 'express';
import { GrowthService } from '../services/growth/growth.service';

export class GrowthController {
  getGrowthScore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const growthService = new GrowthService();
      const score = await growthService.calculateGrowthScore(userId);

      if (score.score === null) {
        return res.status(200).json({ 
          status: 'unavailable',
          message: 'Not enough data yet. Connect an account and wait for analytics synchronization.',
          ...score
        });
      }

      return res.status(200).json(score);
    } catch (error) {
      next(error);
    }
  };

  getBestTimes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const growthService = new GrowthService();
      const times = await growthService.calculateBestTimesToPost(userId);

      if (times.length === 0) {
        return res.status(200).json({ 
          status: 'unavailable',
          message: 'Not enough data yet.',
          bestTimes: []
        });
      }

      return res.status(200).json({ bestTimes: times });
    } catch (error) {
      next(error);
    }
  };

  getContentAnalysis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const growthService = new GrowthService();
      const analysis = await growthService.analyzeContentPerformance(userId);

      if (analysis.formats.length === 0) {
        return res.status(200).json({ 
          status: 'unavailable',
          message: 'Not enough data yet.',
          analysis
        });
      }

      return res.status(200).json({ analysis });
    } catch (error) {
      next(error);
    }
  };

  getRecommendations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const growthService = new GrowthService();
      const recommendations = await growthService.generateRecommendations(userId);

      if (recommendations.length === 0) {
        return res.status(200).json({ 
          status: 'unavailable',
          message: 'Not enough data yet.',
          recommendations: []
        });
      }

      return res.status(200).json({ recommendations });
    } catch (error) {
      next(error);
    }
  };
}
