import { pool } from '../config/db';

export interface ScheduledPost {
  id: string;
  user_id: string;
  social_account_id: string;
  platform: string;
  caption: string;
  media_ids: string[];
  status: string;
  scheduled_at: Date | null;
  published_at: Date | null;
  external_post_id: string | null;
  failure_reason: string | null;
  metadata: any | null;
  created_at: Date;
  updated_at: Date;
}

export class ContentRepository {
  async createPost(
    userId: string,
    socialAccountId: string,
    platform: string,
    caption: string,
    mediaIds: string[],
    status: string,
    scheduledAt: Date | null,
    aiGenerated: boolean = false
  ): Promise<ScheduledPost> {
    const query = `
      INSERT INTO content_posts (
        user_id, social_account_id, platform, caption, media_ids, status, scheduled_at, ai_generated, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, socialAccountId, platform, caption, mediaIds || [], status, scheduledAt, aiGenerated]);
    return rows[0];
  }

  async updatePost(
    id: string,
    userId: string,
    caption: string,
    mediaIds: string[],
    status: string,
    scheduledAt: Date | null
  ): Promise<ScheduledPost | null> {
    const query = `
      UPDATE content_posts
      SET caption = $1, media_ids = $2, status = $3, scheduled_at = $4, updated_at = NOW()
      WHERE id = $5 AND user_id = $6
      RETURNING *
    `;
    const { rows } = await pool.query(query, [caption, mediaIds || [], status, scheduledAt, id, userId]);
    return rows[0] || null;
  }

  async getPostsByUser(userId: string): Promise<ScheduledPost[]> {
    const query = `SELECT * FROM content_posts WHERE user_id = $1 ORDER BY created_at DESC`;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  async getPostById(id: string, userId: string): Promise<ScheduledPost | null> {
    const query = `SELECT * FROM content_posts WHERE id = $1 AND user_id = $2`;
    const { rows } = await pool.query(query, [id, userId]);
    return rows[0] || null;
  }

  async deletePost(id: string, userId: string): Promise<boolean> {
    const query = `DELETE FROM content_posts WHERE id = $1 AND user_id = $2`;
    const { rowCount } = await pool.query(query, [id, userId]);
    return (rowCount ?? 0) > 0;
  }

  async getPostByIdInternal(id: string): Promise<ScheduledPost | null> {
    const query = `SELECT * FROM content_posts WHERE id = $1`;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async getDuePosts(): Promise<ScheduledPost[]> {
    const query = `
      SELECT * FROM content_posts 
      WHERE status = 'scheduled' AND scheduled_at <= NOW()
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async transitionToScheduled(id: string, scheduledAt: Date): Promise<boolean> {
    const query = `UPDATE content_posts SET status = 'scheduled', scheduled_at = $2, updated_at = NOW() WHERE id = $1 AND status IN ('draft', 'failed', 'cancelled', 'reconnect_required')`;
    const { rowCount } = await pool.query(query, [id, scheduledAt]);
    return (rowCount ?? 0) > 0;
  }

  async transitionToPublishing(id: string): Promise<boolean> {
    const query = `UPDATE content_posts SET status = 'publishing', updated_at = NOW() WHERE id = $1 AND status IN ('scheduled', 'draft', 'failed')`;
    const { rowCount } = await pool.query(query, [id]);
    return (rowCount ?? 0) > 0;
  }

  async transitionToPublished(id: string, externalId: string): Promise<void> {
    const query = `
      UPDATE content_posts 
      SET status = 'published', external_post_id = $2, published_at = NOW(), metadata = '{}'::jsonb, updated_at = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [id, externalId]);
  }

  async transitionToFailed(id: string, reason: string, reconnectRequired = false): Promise<void> {
    const status = reconnectRequired ? 'reconnect_required' : 'failed';
    const query = `
      UPDATE content_posts 
      SET status = $2, failure_reason = $3, metadata = '{}'::jsonb, updated_at = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [id, status, reason]);
  }

  async updatePostMetadata(id: string, metadata: any): Promise<void> {
    const query = `
      UPDATE content_posts
      SET metadata = $2, updated_at = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [id, metadata]);
  }
}
