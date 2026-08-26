import { pool } from '../config/db';

export class AnalyticsRepository {
  async saveAccountSnapshot(
    socialAccountId: string,
    followersCount: number,
    reach24h: number,
    impressions24h: number
  ): Promise<void> {
    const q = `
      INSERT INTO social_account_snapshots (social_account_id, followers_count, reach_24h, impressions_24h)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (social_account_id, collected_at) DO NOTHING
    `;
    await pool.query(q, [socialAccountId, followersCount, reach24h, impressions24h]);
  }

  async savePostSnapshot(
    postId: string,
    likes: number,
    comments: number,
    reach: number,
    impressions: number,
    saved: number,
    engagementRate: number
  ): Promise<void> {
    const q = `
      INSERT INTO content_post_snapshots (post_id, likes, comments, reach, impressions, saved, engagement_rate)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (post_id, collected_at) DO NOTHING
    `;
    await pool.query(q, [postId, likes, comments, reach, impressions, saved, engagementRate]);
  }

  async getAccountLatestSnapshot(socialAccountId: string): Promise<any | null> {
    const q = `
      SELECT * FROM social_account_snapshots
      WHERE social_account_id = $1
      ORDER BY collected_at DESC
      LIMIT 1
    `;
    const res = await pool.query(q, [socialAccountId]);
    return res.rows[0] || null;
  }

  async getAccountSnapshotHistory(socialAccountId: string, days: number = 7): Promise<any[]> {
    const q = `
      SELECT * FROM social_account_snapshots
      WHERE social_account_id = $1 AND collected_at >= NOW() - INTERVAL '${days} days'
      ORDER BY collected_at ASC
    `;
    const res = await pool.query(q, [socialAccountId]);
    return res.rows;
  }

  async getAccountIdsByUserId(userId: string): Promise<{id: string}[]> {
    const accountQuery = `SELECT id FROM social_accounts WHERE user_id = $1`;
    const accountRes = await pool.query(accountQuery, [userId]);
    return accountRes.rows;
  }

  async getPostStatusCounts(userId: string): Promise<{status: string, count: string}[]> {
    const contentQuery = `
      SELECT status, COUNT(*) as count 
      FROM content_posts 
      WHERE user_id = $1 
      GROUP BY status
    `;
    const contentRes = await pool.query(contentQuery, [userId]);
    return contentRes.rows;
  }

  async getLatestPostSnapshot(postId: string): Promise<any | null> {
    const query = `
      SELECT * FROM content_post_snapshots 
      WHERE post_id = $1 
      ORDER BY collected_at DESC 
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [postId]);
    return rows[0] || null;
  }

  async getTopPosts(userId: string): Promise<any[]> {
    const query = `
      WITH RankedSnapshots AS (
        SELECT s.*, ROW_NUMBER() OVER (PARTITION BY s.post_id ORDER BY s.collected_at DESC) as rn
        FROM content_post_snapshots s
        JOIN content_posts p ON s.post_id = p.id
        WHERE p.user_id = $1
      )
      SELECT r.*, p.caption as title, p.platform
      FROM RankedSnapshots r
      JOIN content_posts p ON r.post_id = p.id
      JOIN social_accounts a ON p.social_account_id = a.id
      WHERE r.rn = 1
      ORDER BY r.engagement_rate DESC
      LIMIT 5;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }
}
