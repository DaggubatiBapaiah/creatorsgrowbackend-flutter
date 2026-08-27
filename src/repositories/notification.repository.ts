import { pool } from '../config/db';

export interface NotificationPreference {
  user_id: string;
  category: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  category: string;
  title: string;
  body: string;
  metadata: any | null;
  is_read: boolean;
  created_at: Date;
}

export interface NotificationDelivery {
  id: string;
  notification_id: string;
  channel: 'email' | 'push';
  status: 'pending' | 'sent' | 'failed';
  retry_count: number;
  error_message: string | null;
  last_attempt_at: Date;
}

export class NotificationRepository {
  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    const { rows } = await pool.query('SELECT * FROM notification_preferences WHERE user_id = $1', [userId]);
    return rows;
  }

  async getPreferenceByCategory(userId: string, category: string): Promise<NotificationPreference | null> {
    const { rows } = await pool.query('SELECT * FROM notification_preferences WHERE user_id = $1 AND category = $2', [userId, category]);
    return rows[0] || null;
  }

  async savePreference(pref: NotificationPreference): Promise<NotificationPreference> {
    const query = `
      INSERT INTO notification_preferences (user_id, category, email_enabled, push_enabled, in_app_enabled)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, category) DO UPDATE
      SET email_enabled = $3, push_enabled = $4, in_app_enabled = $5
      RETURNING *
    `;
    const { rows } = await pool.query(query, [pref.user_id, pref.category, pref.email_enabled, pref.push_enabled, pref.in_app_enabled]);
    return rows[0];
  }

  async createNotification(userId: string, category: string, title: string, body: string, metadata?: any): Promise<NotificationItem> {
    const query = `
      INSERT INTO notifications (user_id, category, title, body, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, category, title, body, metadata ? JSON.stringify(metadata) : null]);
    return rows[0];
  }

  async getNotifications(userId: string, limit: number = 20, offset: number = 0): Promise<NotificationItem[]> {
    const query = 'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    const { rows } = await pool.query(query, [userId, limit, offset]);
    return rows;
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const query = 'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2';
    const { rowCount } = await pool.query(query, [id, userId]);
    return (rowCount ?? 0) > 0;
  }

  async createDelivery(notificationId: string, channel: 'email' | 'push'): Promise<NotificationDelivery> {
    const query = `
      INSERT INTO notification_deliveries (notification_id, channel, status)
      VALUES ($1, $2, 'pending')
      RETURNING *
    `;
    const { rows } = await pool.query(query, [notificationId, channel]);
    return rows[0];
  }

  async updateDelivery(id: string, update: Partial<NotificationDelivery>): Promise<NotificationDelivery> {
    const keys = Object.keys(update);
    const setClause = keys.map((k, i) => {
      // Map camelCase to snake_case for DB columns
      if (k === 'retry_count') return `retry_count = $${i + 2}`;
      if (k === 'error_message') return `error_message = $${i + 2}`;
      if (k === 'last_attempt_at') return `last_attempt_at = $${i + 2}`;
      return `${k} = $${i + 2}`;
    }).join(', ');
    const values = keys.map(k => (update as any)[k]);
    
    const query = `
      UPDATE notification_deliveries 
      SET ${setClause} 
      WHERE id = $1 
      RETURNING *
    `;
    const { rows } = await pool.query(query, [id, ...values]);
    return rows[0];
  }

  async getPendingDeliveries(): Promise<NotificationDelivery[]> {
    const { rows } = await pool.query("SELECT * FROM notification_deliveries WHERE status = 'pending' OR status = 'failed'");
    return rows;
  }
}