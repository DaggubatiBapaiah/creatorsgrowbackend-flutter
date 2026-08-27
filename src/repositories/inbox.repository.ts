import { pool } from '../config/db';

export interface EngagementItem {
  id: string;
  user_id: string;
  social_account_id: string;
  platform: 'instagram' | 'facebook' | 'youtube' | 'x';
  item_type: 'comment' | 'reply' | 'mention';
  author_name: string;
  author_avatar_url: string | null;
  content: string;
  external_id: string;
  parent_external_id: string | null;
  post_external_id: string | null;
  is_read: boolean;
  is_replied: boolean;
  like_count: number;
  metadata: any | null;
  created_at: Date;
  updated_at: Date;
}

export class InboxRepository {
  async getEngagementItems(
    userId: string,
    filters: {
      platform?: string;
      status?: 'unread' | 'replied';
      search?: string;
    },
    limit: number = 20,
    offset: number = 0
  ): Promise<EngagementItem[]> {
    let query = `
      SELECT * FROM engagement_items
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters.platform) {
      query += ` AND platform = $${paramIndex}`;
      params.push(filters.platform.toLowerCase());
      paramIndex++;
    }

    if (filters.status) {
      if (filters.status === 'unread') {
        query += ` AND is_read = false`;
      } else if (filters.status === 'replied') {
        query += ` AND is_replied = true`;
      }
    }

    if (filters.search) {
      query += ` AND (content ILIKE $${paramIndex} OR author_name ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  async getEngagementItemById(id: string, userId: string): Promise<EngagementItem | null> {
    const query = 'SELECT * FROM engagement_items WHERE id = $1 AND user_id = $2';
    const { rows } = await pool.query(query, [id, userId]);
    return rows[0] || null;
  }

  async createOrUpdateItem(item: Partial<EngagementItem> & { external_id: string; user_id: string }): Promise<EngagementItem> {
    const existing = await pool.query('SELECT id FROM engagement_items WHERE external_id = $1', [item.external_id]);
    
    if (existing.rows.length > 0) {
      const keys = Object.keys(item).filter(k => k !== 'external_id' && k !== 'user_id');
      const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      const values = keys.map(k => (item as any)[k]);
      
      const query = `
        UPDATE engagement_items 
        SET ${setClause}, updated_at = NOW() 
        WHERE external_id = $1 
        RETURNING *
      `;
      const { rows } = await pool.query(query, [item.external_id, ...values]);
      return rows[0];
    } else {
      const keys = Object.keys(item);
      const columns = keys.map(k => {
        // Map camelCase to snake_case for DB columns
        if (k === 'socialAccountId') return 'social_account_id';
        if (k === 'itemType') return 'item_type';
        if (k === 'authorName') return 'author_name';
        if (k === 'authorAvatarUrl') return 'author_avatar_url';
        if (k === 'externalId') return 'external_id';
        if (k === 'parentExternalId') return 'parent_external_id';
        if (k === 'postExternalId') return 'post_external_id';
        if (k === 'isRead') return 'is_read';
        if (k === 'isReplied') return 'is_replied';
        if (k === 'likeCount') return 'like_count';
        if (k === 'userId') return 'user_id';
        return k;
      });
      
      const columnsStr = columns.join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map(k => (item as any)[k]);
      
      const query = `
        INSERT INTO engagement_items (${columnsStr}, updated_at)
        VALUES (${placeholders}, NOW())
        RETURNING *
      `;
      const { rows } = await pool.query(query, values);
      return rows[0];
    }
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const query = 'UPDATE engagement_items SET is_read = true, updated_at = NOW() WHERE id = $1 AND user_id = $2';
    const { rowCount } = await pool.query(query, [id, userId]);
    return (rowCount ?? 0) > 0;
  }

  async markAsReplied(id: string, userId: string): Promise<boolean> {
    const query = 'UPDATE engagement_items SET is_replied = true, updated_at = NOW() WHERE id = $1 AND user_id = $2';
    const { rowCount } = await pool.query(query, [id, userId]);
    return (rowCount ?? 0) > 0;
  }

  async deleteItem(id: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM engagement_items WHERE id = $1 AND user_id = $2';
    const { rowCount } = await pool.query(query, [id, userId]);
    return (rowCount ?? 0) > 0;
  }

  async updateLikeStatus(id: string, userId: string, isLiked: boolean, likeCountDelta: number): Promise<boolean> {
    const query = `
      UPDATE engagement_items 
      SET like_count = like_count + $1, 
          metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{isLiked}', $2::jsonb),
          updated_at = NOW()
      WHERE id = $3 AND user_id = $4
    `;
    const { rowCount } = await pool.query(query, [likeCountDelta, JSON.stringify(isLiked), id, userId]);
    return (rowCount ?? 0) > 0;
  }

  async updateHideStatus(id: string, userId: string, isHidden: boolean): Promise<boolean> {
    const query = `
      UPDATE engagement_items 
      SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{isHidden}', $1::jsonb),
          updated_at = NOW()
      WHERE id = $2 AND user_id = $3
    `;
    const { rowCount } = await pool.query(query, [JSON.stringify(isHidden), id, userId]);
    return (rowCount ?? 0) > 0;
  }
}
