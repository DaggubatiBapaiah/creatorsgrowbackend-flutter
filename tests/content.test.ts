import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';
import { encrypt } from '../src/utils/crypto';

import { runMigrations } from '../src/db/migrate';

describe('Content API Integration Tests', () => {
  let user1Token: string;
  let user2Token: string;
  let user1AccountId: string;
  let user2AccountId: string;

  let user1Email = `content1_${Date.now()}@example.com`;
  let user2Email = `content2_${Date.now()}@example.com`;

  beforeAll(async () => {
    await runMigrations();
    
    // Register User 1
    const res1 = await request(app).post('/api/v1/auth/register').send({
      displayName: 'Content User 1',
      email: user1Email,
      password: 'password123',
    });
    user1Token = res1.body.token;

    // Register User 2
    const res2 = await request(app).post('/api/v1/auth/register').send({
      displayName: 'Content User 2',
      email: user2Email,
      password: 'password123',
    });
    user2Token = res2.body.token;

    // Create Social Account for User 1
    const { rows: rows1 } = await pool.query(
      `INSERT INTO social_accounts (id, user_id, platform, platform_account_id, username, access_token) VALUES (gen_random_uuid(), $1, 'INSTAGRAM', 'content_ig_1', 'user1_ig', $2) RETURNING id`,
      [res1.body.user.id, encrypt('dummy_token')]
    );
    user1AccountId = rows1[0].id;

    // Create Social Account for User 2
    const { rows: rows2 } = await pool.query(
      `INSERT INTO social_accounts (id, user_id, platform, platform_account_id, username, access_token) VALUES (gen_random_uuid(), $1, 'INSTAGRAM', 'content_ig_2', 'user2_ig', $2) RETURNING id`,
      [res2.body.user.id, encrypt('dummy_token')]
    );
    user2AccountId = rows2[0].id;
  }, 30000);

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email IN ($1, $2)', [user1Email, user2Email]);
  });

  describe('Draft and Content Management', () => {
    let draftId: string;

    it('should create a draft successfully', async () => {
      const res = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          socialAccountId: user1AccountId,
          platform: 'INSTAGRAM',
          caption: 'My first draft',
          status: 'draft'
        });

      expect(res.status).toBe(201);
      expect(res.body.post.caption).toBe('My first draft');
      expect(res.body.post.status).toBe('draft');
      draftId = res.body.post.id;
    });

    it('should retrieve own drafts', async () => {
      const res = await request(app)
        .get('/api/v1/content')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.posts.length).toBeGreaterThanOrEqual(1);
      expect(res.body.posts[0].caption).toBe('My first draft');
    });

    it('should NOT allow user2 to retrieve user1 content', async () => {
      const res = await request(app)
        .get('/api/v1/content')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.posts.length).toBe(0); // User 2 has no posts
    });

    it('should update own draft', async () => {
      const res = await request(app)
        .put(`/api/v1/content/${draftId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          caption: 'Updated draft caption'
        });

      expect(res.status).toBe(200);
      expect(res.body.post.caption).toBe('Updated draft caption');
    });

    it('should NOT allow user2 to update user1 draft', async () => {
      const res = await request(app)
        .put(`/api/v1/content/${draftId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          caption: 'Hacked caption'
        });

      expect(res.status).toBe(400); // Validation error (not found or forbidden)
    });
  });

  describe('Scheduling and Publishing', () => {
    it('should fail to schedule in the past', async () => {
      const pastDate = new Date(Date.now() - 10000).toISOString();
      
      const res = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          socialAccountId: user1AccountId,
          platform: 'INSTAGRAM',
          caption: 'Past post',
          status: 'scheduled',
          scheduledAt: pastDate
        });
        
      expect(res.status).toBe(400);
      expect(res.text).toContain('Cannot schedule a post in the past');
    });

    it('should cancel scheduled post', async () => {
      // Create scheduled post
      const res1 = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          socialAccountId: user1AccountId,
          platform: 'INSTAGRAM',
          caption: 'To be cancelled',
          status: 'scheduled',
          scheduledAt: new Date(Date.now() + 60000).toISOString(),
        });
      
      const res2 = await request(app)
        .post(`/api/v1/content/${res1.body.post.id}/cancel`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res2.status).toBe(200);
      expect(res2.body.post.status).toBe('cancelled');
    });

    it('should publish immediately when status is published', async () => {
      // We are using META_OAUTH_MODE=mock, so publishing should return mock_ig_post_...
      const res = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          socialAccountId: user1AccountId,
          platform: 'INSTAGRAM',
          caption: 'Publishing now!',
          status: 'published' // "Publish Now"
        });

      expect(res.status).toBe(201);
      expect(res.body.post.status).toBe('published');
      expect(res.body.post.external_post_id).toMatch(/^mock_ig_post_/);
    });

    it('should enforce publish ownership validation', async () => {
      const res = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          socialAccountId: user1AccountId, // User 2 trying to use User 1 account
          platform: 'INSTAGRAM',
          caption: 'Hacked publish',
          status: 'published'
        });

      expect(res.status).toBe(400); // Invalid social account.
    });
  });
});
