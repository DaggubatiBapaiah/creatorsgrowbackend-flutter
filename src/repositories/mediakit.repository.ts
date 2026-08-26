import { pool } from '../config/db';

export interface MediaKitConfig {
  id: string;
  user_id: string;
  custom_bio: string | null;
  contact_email: string | null;
  show_instagram: boolean;
  show_tiktok: boolean;
  rates: any[];
  views_count: number;
  created_at: Date;
  updated_at: Date;
}

export class MediaKitRepository {
  async getConfigByUserId(userId: string): Promise<MediaKitConfig | null> {
    const query = `SELECT * FROM media_kit_configs WHERE user_id = $1`;
    const { rows } = await pool.query(query, [userId]);
    return rows[0] || null;
  }

  async createOrUpdateConfig(
    userId: string,
    customBio: string | null,
    contactEmail: string | null,
    showInstagram: boolean = true,
    showTiktok: boolean = true,
    rates: any[] = []
  ): Promise<MediaKitConfig> {
    const query = `
      INSERT INTO media_kit_configs (user_id, custom_bio, contact_email, show_instagram, show_tiktok, rates, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET custom_bio = EXCLUDED.custom_bio,
          contact_email = EXCLUDED.contact_email,
          show_instagram = EXCLUDED.show_instagram,
          show_tiktok = EXCLUDED.show_tiktok,
          rates = EXCLUDED.rates,
          updated_at = NOW()
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      userId, customBio, contactEmail, showInstagram, showTiktok, JSON.stringify(rates)
    ]);
    return rows[0];
  }

  async incrementViews(userId: string): Promise<void> {
    const query = `
      UPDATE media_kit_configs
      SET views_count = views_count + 1
      WHERE user_id = $1
    `;
    await pool.query(query, [userId]);
  }

  async getPublicKitData(identifier: string): Promise<any> {
    // 1. Get user and config
    // Handles UUID directly or hyphenated display name matching
    const userQuery = `
      SELECT u.id as user_id, u.display_name, mk.custom_bio, mk.contact_email, mk.rates, 
             COALESCE(mk.show_instagram, TRUE) as show_instagram, 
             COALESCE(mk.show_tiktok, TRUE) as show_tiktok,
             COALESCE(mk.views_count, 0) as views_count
      FROM users u
      LEFT JOIN media_kit_configs mk ON u.id = mk.user_id
      WHERE u.id::text = $1 OR LOWER(REPLACE(u.display_name, ' ', '-')) = LOWER($1)
    `;
    const userRes = await pool.query(userQuery, [identifier]);
    if (userRes.rows.length === 0) return null;
    const user = userRes.rows[0];

    // Increment view count since someone accessed the public page
    await this.incrementViews(user.user_id);
    user.views_count += 1;

    // 2. Get latest snapshots for active social accounts
    const statsQuery = `
      WITH LatestSnapshots AS (
        SELECT DISTINCT ON (social_account_id) social_account_id, followers_count, reach_24h, impressions_24h, collected_at
        FROM social_account_snapshots
        ORDER BY social_account_id, collected_at DESC
      )
      SELECT sa.id, sa.platform, sa.username, sa.profile_picture_url,
             COALESCE(ls.followers_count, 0) as followers,
             COALESCE(ls.reach_24h, 0) as reach_24h,
             COALESCE(ls.impressions_24h, 0) as impressions_24h
      FROM social_accounts sa
      LEFT JOIN LatestSnapshots ls ON sa.id = ls.social_account_id
      WHERE sa.user_id = $1 AND sa.status = 'connected'
    `;
    const statsRes = await pool.query(statsQuery, [user.user_id]);
    
    // Filter by user settings config toggles
    const rawPlatforms = statsRes.rows;
    const platforms = rawPlatforms.filter(p => {
      if (p.platform.toLowerCase() === 'instagram' && !user.show_instagram) return false;
      if (p.platform.toLowerCase() === 'tiktok' && !user.show_tiktok) return false;
      return true;
    });

    // 3. Get top 3 performing posts based on latest post snapshot engagement rate
    const postsQuery = `
      WITH LatestPostSnapshots AS (
        SELECT DISTINCT ON (post_id) post_id, likes, comments, reach, impressions, saved, engagement_rate, collected_at
        FROM content_post_snapshots
        ORDER BY post_id, collected_at DESC
      )
      SELECT cp.id, cp.platform, cp.caption, cp.media_ids, cp.published_at,
             COALESCE(lps.likes, 0) as likes,
             COALESCE(lps.comments, 0) as comments,
             COALESCE(lps.reach, 0) as reach,
             COALESCE(lps.engagement_rate, 0.0000) as engagement_rate
      FROM content_posts cp
      INNER JOIN LatestPostSnapshots lps ON cp.id = lps.post_id
      WHERE cp.user_id = $1 AND cp.status = 'published'
      ORDER BY lps.engagement_rate DESC
      LIMIT 3
    `;
    const postsRes = await pool.query(postsQuery, [user.user_id]);

    return {
      user,
      platforms,
      topPosts: postsRes.rows
    };
  }
}
