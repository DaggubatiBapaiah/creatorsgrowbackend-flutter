import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';
import { encrypt } from '../src/utils/crypto';
import { runMigrations } from '../src/db/migrate';

describe('AI Copilot API Integration Tests', () => {
  let userToken: string;
  let userId: string;
  let accountId: string;
  const userEmail = `ai_test_${Date.now()}@example.com`;

  beforeAll(async () => {
    await runMigrations();

    const res = await request(app).post('/api/v1/auth/register').send({
      displayName: 'AI Test User',
      email: userEmail,
      password: 'password123',
    });
    userToken = res.body.token;
    userId = res.body.user.id;

    const { rows } = await pool.query(
      `INSERT INTO social_accounts (id, user_id, platform, platform_account_id, username, access_token)
       VALUES (gen_random_uuid(), $1, 'INSTAGRAM', 'ai_ig_1', 'ai_test_ig', $2) RETURNING id`,
      [userId, encrypt('dummy_token')]
    );
    accountId = rows[0].id;
  }, 30000);

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [userEmail]);
  });

  describe('AI Route Authentication', () => {
    it('should reject unauthenticated requests to generate-caption', async () => {
      const res = await request(app)
        .post('/api/v1/ai/generate-caption')
        .send({ prompt: 'test prompt', platform: 'INSTAGRAM' });
      expect(res.status).toBe(401);
    });

    it('should accept authenticated requests (AI_PROVIDER=mock in test env)', async () => {
      const res = await request(app)
        .post('/api/v1/ai/generate-caption')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ prompt: 'my morning routine tips', platform: 'INSTAGRAM', tone: 'engaging' });
      // With AI_PROVIDER=mock (test env default), we expect 200 with variations
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.variations).toBeInstanceOf(Array);
      expect(res.body.data.variations.length).toBeGreaterThan(0);
      const v = res.body.data.variations[0];
      expect(v).toHaveProperty('hook');
      expect(v).toHaveProperty('body');
      expect(v).toHaveProperty('hashtags');
      expect(v).toHaveProperty('fullText');
    });

    it('should reject invalid prompt (too short)', async () => {
      const res = await request(app)
        .post('/api/v1/ai/generate-caption')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ prompt: 'hi', platform: 'INSTAGRAM' });
      expect(res.status).toBe(400);
    });

    it('should reject unknown platform', async () => {
      const res = await request(app)
        .post('/api/v1/ai/generate-caption')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ prompt: 'my morning routine tips', platform: 'FACEBOOK' });
      expect(res.status).toBe(400);
    });
  });

  describe('AI-Generated Tracking (ai_generated DB column)', () => {
    it('should persist ai_generated=false for normal user-created content', async () => {
      const res = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          socialAccountId: accountId,
          platform: 'INSTAGRAM',
          caption: 'Manually written caption',
          status: 'draft',
          // No aiGenerated field — defaults to false
        });

      expect(res.status).toBe(201);
      const postId = res.body.post.id;

      const { rows } = await pool.query(
        'SELECT ai_generated FROM content_posts WHERE id = $1',
        [postId]
      );
      expect(rows[0].ai_generated).toBe(false);
    });

    it('should persist ai_generated=true when explicitly flagged', async () => {
      const res = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          socialAccountId: accountId,
          platform: 'INSTAGRAM',
          caption: 'AI generated caption text',
          status: 'draft',
          aiGenerated: true,
        });

      expect(res.status).toBe(201);
      const postId = res.body.post.id;

      const { rows } = await pool.query(
        'SELECT ai_generated FROM content_posts WHERE id = $1',
        [postId]
      );
      expect(rows[0].ai_generated).toBe(true);
    });

    it('should persist ai_generated=false when explicitly set to false', async () => {
      const res = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          socialAccountId: accountId,
          platform: 'INSTAGRAM',
          caption: 'Human caption with explicit false',
          status: 'draft',
          aiGenerated: false,
        });

      expect(res.status).toBe(201);
      const postId = res.body.post.id;

      const { rows } = await pool.query(
        'SELECT ai_generated FROM content_posts WHERE id = $1',
        [postId]
      );
      expect(rows[0].ai_generated).toBe(false);
    });

    it('should default to ai_generated=false when field is omitted', async () => {
      const res = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          socialAccountId: accountId,
          platform: 'INSTAGRAM',
          caption: 'No aiGenerated field',
          status: 'draft',
        });

      expect(res.status).toBe(201);
      const postId = res.body.post.id;

      const { rows } = await pool.query(
        'SELECT ai_generated FROM content_posts WHERE id = $1',
        [postId]
      );
      expect(rows[0].ai_generated).toBe(false);
    });
  });
});
