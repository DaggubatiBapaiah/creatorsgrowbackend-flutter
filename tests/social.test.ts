import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';
import { runMigrations } from '../src/db/migrate';
import { env } from '../src/config/env';

jest.setTimeout(30000); // 30 seconds timeout to prevent remote DB timeouts

describe('Social API Integration Tests', () => {
  const uniqueSuffix = () => Math.random().toString(36).substring(2, 10);
  let testUserId = '';
  let testUserEmail = '';
  let testUserPassword = 'StrongPassword123!';
  let jwtToken = '';

  let otherUserId = '';
  let otherUserEmail = '';
  let otherJwtToken = '';

  beforeAll(async () => {
    // Ensure tables exist
    await runMigrations();

    // Create a main test user
    testUserEmail = `social-${uniqueSuffix()}@example.com`;
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testUserEmail,
        password: testUserPassword,
        displayName: 'Social Creator',
      });
    jwtToken = userRes.body.token;
    testUserId = userRes.body.user.id;

    // Create a secondary test user (for ownership checks)
    otherUserEmail = `social-other-${uniqueSuffix()}@example.com`;
    const otherRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: otherUserEmail,
        password: testUserPassword,
        displayName: 'Other Creator',
      });
    otherJwtToken = otherRes.body.token;
    otherUserId = otherRes.body.user.id;
  });

  afterAll(async () => {
    // Clean up social connections and users
    await pool.query('DELETE FROM social_accounts WHERE user_id IN ($1, $2)', [testUserId, otherUserId]);
    await pool.query('DELETE FROM oauth_states WHERE user_id IN ($1, $2)', [testUserId, otherUserId]);
    await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [testUserId, otherUserId]);
    await pool.end();
  });

  describe('GET /api/v1/social/accounts', () => {
    it('should block requests without auth header (unauthenticated)', async () => {
      const response = await request(app).get('/api/v1/social/accounts');
      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should return empty accounts list initially', async () => {
      const response = await request(app)
        .get('/api/v1/social/accounts')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accounts');
      expect(response.body.accounts).toBeInstanceOf(Array);
      expect(response.body.accounts.length).toBe(0);
    });
  });

  describe('POST /api/v1/social/meta/connect', () => {
    it('should fail connect request without auth header', async () => {
      const response = await request(app).post('/api/v1/social/meta/connect');
      expect(response.status).toBe(401);
    });

    it('should return authorization URL with state but NO jwt token', async () => {
      const response = await request(app)
        .post('/api/v1/social/meta/connect')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authUrl');
      const authUrl = response.body.authUrl;
      
      expect(authUrl).toContain('https://www.facebook.com');
      expect(authUrl).toContain('state=');
      // Must NOT contain the JWT token anywhere
      expect(authUrl).not.toContain(jwtToken);
    });
  });

  describe('GET /api/v1/social/meta/callback', () => {
    it('should fail callback request with missing state parameter', async () => {
      const response = await request(app)
        .get('/api/v1/social/meta/callback')
        .query({ code: 'mock_code_123' });

      expect(response.status).toBe(400);
      expect(response.text).toContain('Missing authorization code or verification state');
    });

    it('should fail callback request with invalid/unknown state parameter', async () => {
      const response = await request(app)
        .get('/api/v1/social/meta/callback')
        .query({ code: 'mock_code_123', state: 'invalid-state-123' });

      expect(response.status).toBe(400);
      expect(response.text).toContain('Security Validation Failed');
      expect(response.text).toContain('Invalid or already used OAuth state');
    });

    it('should successfully callback with valid state, and FAIL on reuse', async () => {
      // 1. Generate valid state via POST endpoint
      const connectRes = await request(app)
        .post('/api/v1/social/meta/connect')
        .set('Authorization', `Bearer ${jwtToken}`);
      
      const authUrl = new URL(connectRes.body.authUrl);
      const state = authUrl.searchParams.get('state')!;

      // 2. Perform callback request (First Use)
      const callbackRes = await request(app)
        .get('/api/v1/social/meta/callback')
        .query({ code: 'mock_code_test_123', state });

      expect(callbackRes.status).toBe(200);
      expect(callbackRes.text).toContain('Connection Successful!');

      // 3. Perform callback request again (Second Use)
      const reuseRes = await request(app)
        .get('/api/v1/social/meta/callback')
        .query({ code: 'mock_code_test_123', state });

      // Must fail because state was deleted
      expect(reuseRes.status).toBe(400);
      expect(reuseRes.text).toContain('Invalid or already used OAuth state parameter');

      // 4. Verify account was written securely
      const listResponse = await request(app)
        .get('/api/v1/social/accounts')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.accounts.length).toBeGreaterThan(0);

      const acc = listResponse.body.accounts[0];
      // Tokens MUST NEVER be returned to the client
      expect(acc).not.toHaveProperty('access_token');
      expect(acc).not.toHaveProperty('accessToken');
      expect(acc).not.toHaveProperty('refresh_token');
    });
  });

  describe('DELETE /api/v1/social/accounts/:id', () => {
    it('should fail disconnect request for accounts owned by other users', async () => {
      const listRes = await request(app)
        .get('/api/v1/social/accounts')
        .set('Authorization', `Bearer ${jwtToken}`);
      
      const accId = listRes.body.accounts[0].id;

      // Attempt deletion using other user's session
      const deleteRes = await request(app)
        .delete(`/api/v1/social/accounts/${accId}`)
        .set('Authorization', `Bearer ${otherJwtToken}`);

      expect(deleteRes.status).toBe(400);
      expect(deleteRes.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should successfully disconnect user-owned social account', async () => {
      const listRes = await request(app)
        .get('/api/v1/social/accounts')
        .set('Authorization', `Bearer ${jwtToken}`);
      
      const accId = listRes.body.accounts[0].id;

      // Perform deletion
      const deleteRes = await request(app)
        .delete(`/api/v1/social/accounts/${accId}`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body).toHaveProperty('status', 'ok');
    });
  });
});
