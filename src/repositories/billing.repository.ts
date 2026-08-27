import { pool } from '../config/db';

export interface Subscription {
  id: string;
  user_id: string;
  plan_code: 'free' | 'creator' | 'pro';
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'paused';
  razorpay_subscription_id: string | null;
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  created_at: Date;
  updated_at: Date;
}

export class BillingRepository {
  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    const query = 'SELECT * FROM subscriptions WHERE user_id = $1';
    const { rows } = await pool.query(query, [userId]);
    return rows[0] || null;
  }

  async createOrUpdateSubscription(subscription: Partial<Subscription> & { user_id: string }): Promise<Subscription> {
    const existing = await this.getSubscriptionByUserId(subscription.user_id);
    
    if (existing) {
      const keys = Object.keys(subscription).filter(k => k !== 'user_id');
      const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      const values = keys.map(k => (subscription as any)[k]);
      
      const query = `
        UPDATE subscriptions 
        SET ${setClause}, updated_at = NOW() 
        WHERE user_id = $1 
        RETURNING *
      `;
      const { rows } = await pool.query(query, [subscription.user_id, ...values]);
      return rows[0];
    } else {
      const keys = Object.keys(subscription);
      const columns = keys.join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map(k => (subscription as any)[k]);
      
      const query = `
        INSERT INTO subscriptions (${columns}, updated_at)
        VALUES (${placeholders}, NOW())
        RETURNING *
      `;
      const { rows } = await pool.query(query, values);
      return rows[0];
    }
  }

  async getSubscriptionByRazorpayId(razorpaySubscriptionId: string): Promise<Subscription | null> {
    const query = 'SELECT * FROM subscriptions WHERE razorpay_subscription_id = $1';
    const { rows } = await pool.query(query, [razorpaySubscriptionId]);
    return rows[0] || null;
  }

  async logWebhookEvent(eventId: string, eventType: string): Promise<boolean> {
    try {
      const query = `
        INSERT INTO razorpay_webhook_logs (id, event_type, processed_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;
      const { rows } = await pool.query(query, [eventId, eventType]);
      return rows.length > 0;
    } catch {
      return false;
    }
  }

  async getMonthlyUsageCount(userId: string, type: 'posts' | 'ai'): Promise<number> {
    const sub = await this.getSubscriptionByUserId(userId);
    if (!sub) return 0;

    const start = sub.current_period_start;
    const end = sub.current_period_end;

    if (type === 'posts') {
      const query = `
        SELECT COUNT(*)::int as count 
        FROM content_posts 
        WHERE user_id = $1 AND created_at BETWEEN $2 AND $3
      `;
      const { rows } = await pool.query(query, [userId, start, end]);
      return rows[0]?.count ?? 0;
    } else {
      // For AI, we can track via user or custom audit, or count post ai_generated = true.
      // Let's count posts with ai_generated = true within current period as a direct metric.
      const query = `
        SELECT COUNT(*)::int as count 
        FROM content_posts 
        WHERE user_id = $1 AND ai_generated = true AND created_at BETWEEN $2 AND $3
      `;
      const { rows } = await pool.query(query, [userId, start, end]);
      return rows[0]?.count ?? 0;
    }
  }
}
