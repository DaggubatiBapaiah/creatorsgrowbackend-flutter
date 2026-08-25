import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';
import { runMigrations } from '../src/db/migrate';

describe('Auth & Health API Integration Tests', () => {
  const uniqueSuffix = () => Math.random().toString(36).substring(2, 10);
  let testUserEmail = '';
  let testUserPassword = 'StrongPassword123!';
  let jwtToken = '';

  beforeAll(async () => {
    testUserEmail = `creator-${uniqueSuffix()}@example.com`;
    // Ensure table exists
    await runMigrations();
  });

  afterAll(async () => {
    // Cleanup users created during test
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['creator-%@example.com']);
    await pool.end();
  });

  // 1. Health endpoint
  describe('GET /health', () => {
    it('should return ok and database status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('database', 'connected');
    });
  });

  describe('POST /api/v1/auth/register', () => {
    // 2. Successful registration
    it('should register a new user successfully and return token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUserEmail,
          password: testUserPassword,
          displayName: 'Test Creator',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUserEmail);
      expect(response.body.user).toHaveProperty('displayName', 'Test Creator');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    // 3. Duplicate email registration
    it('should fail registration with duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUserEmail,
          password: testUserPassword,
          displayName: 'Another Creator',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toHaveProperty('code', 'CONFLICT');
    });

    // 4. Invalid email format
    it('should fail with validation error for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: testUserPassword,
          displayName: 'Bad Email User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    // 5. Weak/invalid password (short length)
    it('should fail registration for short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `creator-${uniqueSuffix()}@example.com`,
          password: 'short',
          displayName: 'Short Password User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    // 6. Successful login
    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      jwtToken = response.body.token;
      expect(response.body.user).toHaveProperty('email', testUserEmail);
    });

    // 7. Incorrect password
    it('should fail login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    // 8. /auth/me without authentication
    it('should block requests without auth header', async () => {
      const response = await request(app).get('/api/v1/auth/me');
      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    // 9. /auth/me with valid authentication
    it('should return current user with valid auth token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('email', testUserEmail);
      expect(response.body.user).toHaveProperty('displayName', 'Test Creator');
    });

    // 10. Invalid/expired authentication token
    it('should block requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout and invalidate session on client side successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });
});
