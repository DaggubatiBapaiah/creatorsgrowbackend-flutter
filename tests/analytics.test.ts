import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';
import { runMigrations } from '../src/db/migrate';

jest.setTimeout(30000);

describe('Analytics API Integration Tests', () => {
  const uniqueSuffix = () => Math.random().toString(36).substring(2, 10);
  let jwtToken = '';
  let userId = '';
  let accountId = '';
  let postId = '';

  beforeAll(async () => {
    await runMigrations();

    const email = `analytics-${uniqueSuffix()}@example.com`;
    const res = await request(app).post('/api/v1/auth/register').send({
      email,
      password: 'StrongPassword123!',
      displayName: 'Analytics Test'
    });
    
    console.log("REGISTER RESP:", res.status, res.body);
    jwtToken = res.body.token;

    // Get user id
    const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    userId = userRes.rows[0].id;

    // Insert social account
    const accRes = await pool.query(`
      INSERT INTO social_accounts (user_id, platform, platform_account_id, access_token, username)
      VALUES ($1, 'instagram', 'insta-123', 'tok', 'testig')
      RETURNING id
    `, [userId]);
    accountId = accRes.rows[0].id;

    // Insert account snapshots
    await pool.query(`
      INSERT INTO social_account_snapshots (social_account_id, followers_count, reach_24h, impressions_24h)
      VALUES ($1, 100, 50, 70)
    `, [accountId]);

    // Insert content post
    const postRes = await pool.query(`
      INSERT INTO content_posts (user_id, social_account_id, platform, caption, status)
      VALUES ($1, $2, 'instagram', 'Test Post', 'published')
      RETURNING id
    `, [userId, accountId]);
    postId = postRes.rows[0].id;

    // Insert post snapshot
    await pool.query(`
      INSERT INTO content_post_snapshots (post_id, likes, engagement_rate)
      VALUES ($1, 10, 0.05)
    `, [postId]);
  });

  afterAll(async () => {
    // Delete test user to clean up
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.end();
  });

  describe('GET /api/v1/analytics/dashboard', () => {
    it('should return aggregated dashboard statistics and history', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${jwtToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('followersCount', 100);
      expect(res.body).toHaveProperty('reach24h', 50);
      expect(res.body).toHaveProperty('publishedPosts', 1);
      expect(res.body).toHaveProperty('draftPosts', 0);
      expect(res.body).toHaveProperty('history');
      expect(Array.isArray(res.body.history)).toBe(true);
    });
  });

  describe('GET /api/v1/analytics/top-posts', () => {
    it('should return top posts by engagement rate', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/top-posts')
        .set('Authorization', `Bearer ${jwtToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('topPosts');
      expect(res.body.topPosts.length).toBeGreaterThan(0);
      expect(res.body.topPosts[0].engagement_rate).toBe('0.0500');
    });
  });

  describe('GET /api/v1/analytics/post/:postId', () => {
    it('should return post analytics', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/post/${postId}`)
        .set('Authorization', `Bearer ${jwtToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('analytics');
      expect(res.body.analytics.likes).toBe(10);
    });
  });
});
