import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { ContentRepository } from '../repositories/content.repository';
import { AnalyticsRepository } from '../repositories/analytics.repository';

export class AnalyticsController {
  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const analyticsRepo = new AnalyticsRepository();

      // 1. Get Accounts and Posts basic counts
      const accounts = await analyticsRepo.getAccountIdsByUserId(userId);
      const contentStatusCounts = await analyticsRepo.getPostStatusCounts(userId);
      
      let scheduledCount = 0;
      let publishedCount = 0;
      let draftCount = 0;
      let failedCount = 0;

      for (const row of contentStatusCounts) {
        const count = parseInt(row.count, 10);
        if (row.status === 'scheduled') scheduledCount += count;
        if (row.status === 'published') publishedCount += count;
        if (row.status === 'draft') draftCount += count;
        if (row.status === 'failed' || row.status === 'reconnect_required') failedCount += count;
      }

      // 2. Aggregate Reach, Impressions, Followers from latest account snapshots
      let totalFollowers = 0;
      let totalReach24h = 0;
      let totalImpressions24h = 0;
      const historyPoints: any[] = [];

      for (const acc of accounts) {
        const snapshot = await analyticsRepo.getAccountLatestSnapshot(acc.id);
        if (snapshot) {
          totalFollowers += snapshot.followers_count;
          totalReach24h += snapshot.reach_24h;
          totalImpressions24h += snapshot.impressions_24h;
        }

        const history = await analyticsRepo.getAccountSnapshotHistory(acc.id, 90);
        historyPoints.push(...history);
      }

      // Aggregate history by date (YYYY-MM-DD)
      const dateMap = new Map<string, number>();
      for (const point of historyPoints) {
        const dateKey = new Date(point.collected_at).toISOString().split('T')[0];
        const reach = parseInt(point.reach_24h || 0, 10);
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + reach);
      }
      
      const chartHistory = Array.from(dateMap.entries())
        .map(([date, reach]) => ({ date, reach }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return res.status(200).json({
        connectedAccounts: accounts.length,
        scheduledPosts: scheduledCount,
        publishedPosts: publishedCount,
        draftPosts: draftCount,
        failedPosts: failedCount,
        followersCount: totalFollowers,
        reach24h: totalReach24h,
        impressions24h: totalImpressions24h,
        history: chartHistory,
      });
    } catch (error) {
      next(error);
    }
  };

  getPostAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { postId } = req.params;

      const contentRepo = new ContentRepository();
      const post = await contentRepo.getPostById(postId, userId);

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const analyticsRepo = new AnalyticsRepository();
      const snapshot = await analyticsRepo.getLatestPostSnapshot(postId);

      if (!snapshot) {
        return res.status(200).json({ 
          status: 'unavailable',
          message: 'Analytics not synced yet or unavailable for this platform.'
        });
      }

      return res.status(200).json({ analytics: snapshot });
    } catch (error) {
      next(error);
    }
  };

  getTopPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      const analyticsRepo = new AnalyticsRepository();
      const topPosts = await analyticsRepo.getTopPosts(userId);

      return res.status(200).json({ topPosts });
    } catch (error) {
      next(error);
    }
  };
}
