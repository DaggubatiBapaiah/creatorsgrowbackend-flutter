import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { ContentRepository } from '../repositories/content.repository';

export class AnalyticsController {
  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      // Real metrics from DB
      const accountQuery = `SELECT COUNT(*) as count FROM social_accounts WHERE user_id = $1`;
      const contentQuery = `
        SELECT status, COUNT(*) as count 
        FROM content_posts 
        WHERE user_id = $1 
        GROUP BY status
      `;

      const [accountRes, contentRes] = await Promise.all([
        pool.query(accountQuery, [userId]),
        pool.query(contentQuery, [userId])
      ]);

      const accountsCount = parseInt(accountRes.rows[0].count, 10);
      
      let scheduledCount = 0;
      let publishedCount = 0;
      let draftCount = 0;
      let failedCount = 0;

      for (const row of contentRes.rows) {
        const count = parseInt(row.count, 10);
        if (row.status === 'scheduled') scheduledCount += count;
        if (row.status === 'published') publishedCount += count;
        if (row.status === 'draft') draftCount += count;
        if (row.status === 'failed' || row.status === 'reconnect_required') failedCount += count;
      }

      // Mock aggregated analytics for now since we don't have historical syncing implemented
      return res.status(200).json({
        connectedAccounts: accountsCount,
        scheduledPosts: scheduledCount,
        publishedPosts: publishedCount,
        draftPosts: draftCount,
        failedPosts: failedCount,
        totalReach: 'Unavailable', // Requires Meta Insights
        totalEngagement: 'Unavailable' // Requires Meta Insights
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

      const query = `SELECT * FROM post_analytics WHERE post_id = $1`;
      const { rows } = await pool.query(query, [postId]);

      if (rows.length === 0) {
        return res.status(200).json({ 
          status: 'unavailable',
          message: 'Analytics not synced yet or unavailable for this platform.'
        });
      }

      return res.status(200).json({ analytics: rows[0] });
    } catch (error) {
      next(error);
    }
  };
}
