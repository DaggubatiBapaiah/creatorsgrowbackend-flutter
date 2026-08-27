import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';
import { runMigrations } from '../src/db/migrate';
import { encrypt } from '../src/utils/crypto';

describe('Milestone 17: Unified Engagement Inbox Tests', () => {
  let userToken = '';
  let otherUserToken = '';
  let userId = '';
  let otherUserId = '';
  let mockAccountId = '';

  beforeAll(async () => {
    await runMigrations();

    // Register active test user
    const email = 'inbox-test-' + Date.now() + '@example.com';
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: 'Password123!', displayName: 'Inbox User' });
    userToken = res.body.token;
    userId = res.body.user.id;

    // Register secondary user for ownership validation
    const email2 = 'inbox-other-' + Date.now() + '@example.com';
    const res2 = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: email2, password: 'Password123!', displayName: 'Other User' });
    otherUserToken = res2.body.token;
    otherUserId = res2.body.user.id;

    // Encrypt the mock access token cleanly to prevent decryption errors
    const encryptedMockToken = encrypt('mock');

    // Connect a mock social account for user 1
    const { rows } = await pool.query(
      "INSERT INTO social_accounts (user_id, platform, platform_account_id, username, access_token, status) VALUES ($1, 'instagram', 'ig_test_123', 'mock_creator', $2, 'connected') RETURNING id",
      [userId, encryptedMockToken]
    );
    mockAccountId = rows[0].id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE id = ANY($1)', [[userId, otherUserId]]);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM engagement_items');
  });

  describe('GET /api/v1/inbox', () => {
    it('should return normalized engagement items (triggering live sync)', async () => {
      const res = await request(app)
        .get('/api/v1/inbox')
        .set('Authorization', 'Bearer ' + userToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data.items.length).toBeGreaterThan(0);

      // Verify normalization schema
      const firstItem = res.body.data.items[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('platform');
      expect(firstItem).toHaveProperty('item_type');
      expect(firstItem).toHaveProperty('author_name');
      expect(firstItem).toHaveProperty('content');
      expect(firstItem).toHaveProperty('is_read');
      expect(firstItem).toHaveProperty('is_replied');
    });

    it('should filter items by platform', async () => {
      // Create manual items
      await pool.query(
        "INSERT INTO engagement_items (user_id, social_account_id, platform, item_type, author_name, content, external_id) VALUES ($1, $2, 'instagram', 'comment', 'sender_ig', 'hello ig', 'ext_ig_1'), ($1, $2, 'youtube', 'comment', 'sender_yt', 'hello yt', 'ext_yt_1')",
        [userId, mockAccountId]
      );

      const res = await request(app)
        .get('/api/v1/inbox?platform=youtube')
        .set('Authorization', 'Bearer ' + userToken);

      expect(res.status).toBe(200);
      const platforms = res.body.data.items.map((i: any) => i.platform);
      expect(platforms).toContain('youtube');
      expect(platforms).not.toContain('instagram');
    });

    it('should enforce pagination (limit and offset)', async () => {
      await pool.query(
        "INSERT INTO engagement_items (user_id, social_account_id, platform, item_type, author_name, content, external_id, created_at) VALUES ($1, $2, 'instagram', 'comment', 'user_a', 'item 1', 'ext_1', NOW() - INTERVAL '1 minute'), ($1, $2, 'instagram', 'comment', 'user_b', 'item 2', 'ext_2', NOW())",
        [userId, mockAccountId]
      );

      const res = await request(app)
        .get('/api/v1/inbox?limit=1')
        .set('Authorization', 'Bearer ' + userToken);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].external_id).toBe('ext_2'); // DESC sorted
    });
  });

  describe('POST /api/v1/inbox/:id/reply', () => {
    it('should post reply and update local replied status', async () => {
      const { rows } = await pool.query(
        "INSERT INTO engagement_items (user_id, social_account_id, platform, item_type, author_name, content, external_id) VALUES ($1, $2, 'instagram', 'comment', 'fan', 'love your content', 'ext_ig_reply_test') RETURNING id",
        [userId, mockAccountId]
      );
      const itemId = rows[0].id;

      const res = await request(app)
        .post('/api/v1/inbox/' + itemId + '/reply')
        .set('Authorization', 'Bearer ' + userToken)
        .send({ text: 'Thank you!' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('replyExternalId');

      // Verify db updated
      const { rows: updated } = await pool.query('SELECT is_replied FROM engagement_items WHERE id = $1', [itemId]);
      expect(updated[0].is_replied).toBe(true);
    });

    it('should deny unauthorized user access (ownership guard)', async () => {
      const { rows } = await pool.query(
        "INSERT INTO engagement_items (user_id, social_account_id, platform, item_type, author_name, content, external_id) VALUES ($1, $2, 'instagram', 'comment', 'fan', 'love your content', 'ext_ig_guard') RETURNING id",
        [userId, mockAccountId]
      );
      const itemId = rows[0].id;

      const res = await request(app)
        .post('/api/v1/inbox/' + itemId + '/reply')
        .set('Authorization', 'Bearer ' + otherUserToken)
        .send({ text: 'Unauthorized reply attempt' });

      expect(res.status).toBe(404); // returns 404 because query filters by user_id
    });
  });

  describe('Likes and Moderation Actions', () => {
    it('should toggle comment likes on supported platforms (Instagram)', async () => {
      const { rows } = await pool.query(
        "INSERT INTO engagement_items (user_id, social_account_id, platform, item_type, author_name, content, external_id, like_count) VALUES ($1, $2, 'instagram', 'comment', 'fan', 'hey', 'ext_ig_like', 0) RETURNING id",
        [userId, mockAccountId]
      );
      const itemId = rows[0].id;

      const res = await request(app)
        .post('/api/v1/inbox/' + itemId + '/like')
        .set('Authorization', 'Bearer ' + userToken)
        .send({ like: true });

      expect(res.status).toBe(200);

      const { rows: dbRows } = await pool.query('SELECT like_count, metadata FROM engagement_items WHERE id = $1', [itemId]);
      expect(dbRows[0].like_count).toBe(1);
      expect(dbRows[0].metadata.isLiked).toBe(true);
    });

    it('should fail with 405 Method Not Allowed for YouTube comment likes', async () => {
      const { rows } = await pool.query(
        "INSERT INTO engagement_items (user_id, social_account_id, platform, item_type, author_name, content, external_id) VALUES ($1, $2, 'youtube', 'comment', 'fan', 'youtube like test', 'ext_yt_like') RETURNING id",
        [userId, mockAccountId]
      );
      const itemId = rows[0].id;

      const res = await request(app)
        .post('/api/v1/inbox/' + itemId + '/like')
        .set('Authorization', 'Bearer ' + userToken)
        .send({ like: true });

      expect(res.status).toBe(405);
      expect(res.body.error.message).toContain('not supported by YouTube API');
    });
  });
});
