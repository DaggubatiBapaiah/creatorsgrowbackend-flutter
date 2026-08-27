import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';
import { runMigrations } from '../src/db/migrate';
import crypto from 'crypto';
import { env } from '../src/config/env';

describe('Milestone 16: Billing & Subscription Tests', () => {
  let userToken = '';
  let userId = '';

  beforeAll(async () => {
    await runMigrations();
    
    const email = `billing-test-${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: 'Password123!', displayName: 'Billing User' });
      
    userToken = res.body.token;
    userId = res.body.user.id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.end();
  });

  describe('GET /api/v1/billing/status', () => {
    it('should return default free plan details', async () => {
      const res = await request(app)
        .get('/api/v1/billing/status')
        .set('Authorization', `Bearer ${userToken}`);
        
      expect(res.status).toBe(200);
      expect(res.body.status).toHaveProperty('planCode', 'free');
      expect(res.body.status).toHaveProperty('status', 'active');
      expect(res.body.status.limits).toHaveProperty('maxSocialAccounts', 2);
      expect(res.body.status.limits).toHaveProperty('maxScheduledPosts', 5);
      expect(res.body.status.limits).toHaveProperty('hasCrmAccess', false);
    });
  });

  describe('POST /api/v1/billing/checkout', () => {
    it('should create subscription mock details for creator plan', async () => {
      const res = await request(app)
        .post('/api/v1/billing/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planCode: 'creator' });
        
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('subscriptionId');
      expect(res.body).toHaveProperty('keyId', env.RAZORPAY_KEY_ID);
      expect(res.body).toHaveProperty('amount', 49900);
    });

    it('should reject invalid plan code', async () => {
      const res = await request(app)
        .post('/api/v1/billing/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planCode: 'enterprise' });
        
      expect(res.status).toBe(400);
    });
  });

  describe('CRM Premium Locked Gate Verification', () => {
    it('should prevent free user from creating a CRM deal', async () => {
      const res = await request(app)
        .post('/api/v1/crm/deals')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ brandName: 'Coca Cola', dealValue: 50000 });
        
      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('CRM is a Pro feature');
    });
  });

  describe('Razorpay Webhook Handling & Signature Verification', () => {
    const makeSignature = (body: any) => {
      const shasum = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET);
      shasum.update(JSON.stringify(body));
      return shasum.digest('hex');
    };

    it('should reject webhook without signature', async () => {
      const res = await request(app)
        .post('/api/v1/billing/webhook')
        .send({ event: 'subscription.charged' });
        
      expect(res.status).toBe(400);
    });

    it('should reject webhook with invalid signature', async () => {
      const res = await request(app)
        .post('/api/v1/billing/webhook')
        .set('x-razorpay-signature', 'badsignature123')
        .send({ event: 'subscription.charged' });
        
      expect(res.status).toBe(400);
    });

    it('should process charging webhook and upgrade user to creator plan', async () => {
      const eventId = `evt_${Date.now()}`;
      const payload = {
        id: eventId,
        event: 'subscription.charged',
        payload: {
          subscription: {
            entity: {
              id: 'sub_test123456',
              status: 'completed',
              current_start: Math.floor(Date.now() / 1000),
              current_end: Math.floor((Date.now() + 30 * 24 * 3600 * 1000) / 1000),
              cancel_at_cycle_end: 0,
              notes: {
                userId,
                planCode: 'creator'
              }
            }
          }
        }
      };

      const sig = makeSignature(payload);
      const res = await request(app)
        .post('/api/v1/billing/webhook')
        .set('x-razorpay-signature', sig)
        .send(payload);
        
      expect(res.status).toBe(200);

      // Verify DB updated
      const statusRes = await request(app)
        .get('/api/v1/billing/status')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(statusRes.body.status.planCode).toBe('creator');
      expect(statusRes.body.status.limits.maxScheduledPosts).toBe(50);
    });

    it('should prevent duplicate webhook event processing (idempotence)', async () => {
      const eventId = `evt_dup_${Date.now()}`;
      const payload = {
        id: eventId,
        event: 'subscription.charged',
        payload: {
          subscription: {
            entity: {
              id: 'sub_test123456',
              status: 'completed',
              current_start: Math.floor(Date.now() / 1000),
              current_end: Math.floor((Date.now() + 30 * 24 * 3600 * 1000) / 1000),
              cancel_at_cycle_end: 0,
              notes: {
                userId,
                planCode: 'creator'
              }
            }
          }
        }
      };

      const sig = makeSignature(payload);
      
      // First call
      const res1 = await request(app)
        .post('/api/v1/billing/webhook')
        .set('x-razorpay-signature', sig)
        .send(payload);
      expect(res1.status).toBe(200);
      expect(res1.body.detail).toBeUndefined();

      // Second identical call
      const res2 = await request(app)
        .post('/api/v1/billing/webhook')
        .set('x-razorpay-signature', sig)
        .send(payload);
      expect(res2.status).toBe(200);
      expect(res2.body.detail).toBe('Duplicate webhook event filtered.');
    });
  });
});
