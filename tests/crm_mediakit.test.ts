import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';
import { runMigrations } from '../src/db/migrate';

describe('CRM and Media Kit Integration Tests', () => {
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  let post1Id: string;

  const user1Email = `crm_test1_${Date.now()}@example.com`;
  const user2Email = `crm_test2_${Date.now()}@example.com`;

  beforeAll(async () => {
    await runMigrations();

    // Register User 1
    const res1 = await request(app).post('/api/v1/auth/register').send({
      displayName: 'Brand Creator 1',
      email: user1Email,
      password: 'password123',
    });
    user1Token = res1.body.token;
    user1Id = res1.body.user.id;

    // Register User 2
    const res2 = await request(app).post('/api/v1/auth/register').send({
      displayName: 'Brand Creator 2',
      email: user2Email,
      password: 'password123',
    });
    user2Token = res2.body.token;
    user2Id = res2.body.user.id;

    // Create a social account for User 1
    const { rows: accRows } = await pool.query(
      `INSERT INTO social_accounts (id, user_id, platform, platform_account_id, username, access_token) 
       VALUES (gen_random_uuid(), $1, 'INSTAGRAM', 'ig_crm_1', 'creator1_ig', 'dummy') RETURNING id`,
      [user1Id]
    );

    // Create a dummy published post for User 1 to link to
    const { rows: postRows } = await pool.query(
      `INSERT INTO content_posts (id, user_id, social_account_id, platform, caption, status, published_at) 
       VALUES (gen_random_uuid(), $1, $2, 'INSTAGRAM', 'Brand deal post text', 'published', NOW()) RETURNING id`,
      [user1Id, accRows[0].id]
    );
    post1Id = postRows[0].id;
  }, 30000);

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email IN ($1, $2)', [user1Email, user2Email]);
  });

  describe('Brand Deal CRM APIs', () => {
    let createdDealId: string;

    it('should fail to create a deal without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/crm/deals')
        .send({ brandName: 'Nike', dealValue: 1500 });
      expect(res.status).toBe(401);
    });

    it('should create a brand deal successfully for authenticated user', async () => {
      const res = await request(app)
        .post('/api/v1/crm/deals')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          brandName: 'Nike',
          dealValue: 1500,
          stage: 'negotiating',
          contactPerson: 'Phil Knight',
          contactEmail: 'phil@nike.com',
          notes: 'Promo deal for Instagram reel',
          associatedPostId: post1Id
        });

      expect(res.status).toBe(201);
      expect(res.body.data.deal.brand_name).toBe('Nike');
      expect(parseFloat(res.body.data.deal.deal_value)).toBe(1500);
      expect(res.body.data.deal.stage).toBe('negotiating');
      expect(res.body.data.deal.associated_post_id).toBe(post1Id);
      createdDealId = res.body.data.deal.id;
    });

    it('should retrieve all deals belonging to User 1', async () => {
      const res = await request(app)
        .get('/api/v1/crm/deals')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deals).toBeInstanceOf(Array);
      expect(res.body.data.deals.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.deals[0].brand_name).toBe('Nike');
    });

    it('should retrieve single deal details', async () => {
      const res = await request(app)
        .get(`/api/v1/crm/deals/${createdDealId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deal.brand_name).toBe('Nike');
    });

    it('should prevent User 2 from retrieving User 1 brand deals', async () => {
      const res = await request(app)
        .get(`/api/v1/crm/deals/${createdDealId}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(res.status).toBe(404);
    });

    it('should update own brand deal details successfully', async () => {
      const res = await request(app)
        .put(`/api/v1/crm/deals/${createdDealId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          stage: 'signed',
          notes: 'Signed contract today'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.deal.stage).toBe('signed');
      expect(res.body.data.deal.notes).toBe('Signed contract today');
    });

    it('should prevent User 2 from updating User 1 deals', async () => {
      const res = await request(app)
        .put(`/api/v1/crm/deals/${createdDealId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ stage: 'paid' });
      expect(res.status).toBe(404);
    });

    it('should prevent User 2 from deleting User 1 deals', async () => {
      const res = await request(app)
        .delete(`/api/v1/crm/deals/${createdDealId}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(res.status).toBe(404);
    });

    it('should delete own brand deal successfully', async () => {
      const res = await request(app)
        .delete(`/api/v1/crm/deals/${createdDealId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ok');

      const check = await request(app)
        .get(`/api/v1/crm/deals/${createdDealId}`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(check.status).toBe(404);
    });

    it('should fail to create a deal if associatedPostId does not belong to the user', async () => {
      // User 2 tries to link to User 1's post1Id
      const res = await request(app)
        .post('/api/v1/crm/deals')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          brandName: 'Puma',
          dealValue: 500,
          associatedPostId: post1Id
        });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid associated post ID');
    });
  });

  describe('Media Kit APIs', () => {
    it('should fetch config defaults when config is uninitialized', async () => {
      const res = await request(app)
        .get('/api/v1/media-kit/config')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.config.show_instagram).toBe(true);
      expect(res.body.data.config.show_tiktok).toBe(true);
      expect(res.body.data.config.rates).toBeInstanceOf(Array);
    });

    it('should save config successfully', async () => {
      const res = await request(app)
        .post('/api/v1/media-kit/config')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          customBio: 'Lifestyle and fashion blogger <script>alert("xss")</script>',
          contactEmail: 'collabs@brandcreator1.com',
          showInstagram: true,
          showTiktok: false,
          rates: [
            { service: 'Instagram Reel <img src=x>', rate: 450 },
            { service: 'Story Post', rate: 150 }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.config.custom_bio).toContain('<script>alert("xss")</script>');
      expect(res.body.data.config.contact_email).toBe('collabs@brandcreator1.com');
      expect(res.body.data.config.show_tiktok).toBe(false);
      expect(res.body.data.config.rates.length).toBe(2);
      expect(res.body.data.config.rates[0].rate).toBe(450);
    });

    it('should render public media kit with escaped HTML entities for XSS protection', async () => {
      const res = await request(app)
        .get('/api/v1/media-kit/public/kit/brand-creator-1');

      expect(res.status).toBe(200);
      expect(res.text).toContain('Brand Creator 1');
      // Verify bio string is escaped
      expect(res.text).toContain('Lifestyle and fashion blogger &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      // Verify rates string is escaped
      expect(res.text).toContain('Instagram Reel &lt;img src=x&gt;');
    });

    it('should render a clean HTML view on the public endpoint', async () => {
      // Find User 1 details to verify hyphenated name match (Brand-Creator-1)
      const res = await request(app)
        .get('/api/v1/media-kit/public/kit/brand-creator-1');

      expect(res.status).toBe(200);
      expect(res.text).toContain('Brand Creator 1');
      expect(res.text).toContain('Lifestyle and fashion blogger');
      expect(res.text).toContain('Instagram Reel');
      expect(res.text).toContain('Platform-Synced Audience');
      expect(res.text).toContain('Page Views');
    });

    it('should return 404 HTML for invalid public kit identifier', async () => {
      const res = await request(app)
        .get('/api/v1/media-kit/public/kit/invalid-user-name');
      expect(res.status).toBe(404);
      expect(res.text).toContain('404');
      expect(res.text).toContain('could not be found');
    });
  });
});