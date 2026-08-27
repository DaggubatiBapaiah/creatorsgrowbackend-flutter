import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';
import { runMigrations } from '../src/db/migrate';
import { NotificationService } from '../src/services/notification/notification.service';
import { NotificationRepository } from '../src/repositories/notification.repository';

describe('Milestone 18: Notifications & Creator Automation Tests', () => {
  let userToken = '';
  let userId = '';
  const service = new NotificationService();
  const repo = new NotificationRepository();

  beforeAll(async () => {
    await runMigrations();

    const email = 'notify-test-' + Date.now() + '@example.com';
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: 'Password123!', displayName: 'Notify User' });
    userToken = res.body.token;
    userId = res.body.user.id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM notifications');
    await pool.query('DELETE FROM notification_preferences');
    service.resetCounts();
  });

  describe('GET and PUT /api/v1/notifications/preferences', () => {
    it('should retrieve empty settings and allow updating them', async () => {
      // 1. Get default settings
      const getRes = await request(app)
        .get('/api/v1/notifications/preferences')
        .set('Authorization', 'Bearer ' + userToken);
      
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.preferences).toHaveLength(0);

      // 2. Save preference
      const putRes = await request(app)
        .put('/api/v1/notifications/preferences')
        .set('Authorization', 'Bearer ' + userToken)
        .send({
          category: 'publishing',
          emailEnabled: false,
          pushEnabled: true,
          inAppEnabled: true
        });

      expect(putRes.status).toBe(200);
      expect(putRes.body.data.preference.email_enabled).toBe(false);
      expect(putRes.body.data.preference.push_enabled).toBe(true);
    });
  });

  describe('Notification Dispatch & Preference Enforcement', () => {
    it('should dispatch to in-app, email, and push by default', async () => {
      await service.triggerNotification(userId, 'account_security', 'New Sign-in', 'We detected a new sign-in to your account.');

      // 1. Verify in-app notifications
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', 'Bearer ' + userToken);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.notifications[0].title).toBe('New Sign-in');

      // 2. Verify mock counts
      expect(service.emailSentCount).toBe(1);
      expect(service.pushSentCount).toBe(1);
    });

    it('should respect disabled preference categories', async () => {
      // Disable 'crm' category completely
      await request(app)
        .put('/api/v1/notifications/preferences')
        .set('Authorization', 'Bearer ' + userToken)
        .send({
          category: 'crm',
          emailEnabled: false,
          pushEnabled: false,
          inAppEnabled: false
        });

      await service.triggerNotification(userId, 'crm', 'CRM Deal Follow-up', 'Remember to reach out to Coca Cola.');

      // Verify no in-app created
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', 'Bearer ' + userToken);
      expect(res.body.data.notifications).toHaveLength(0);

      // Verify no mock emails/push triggered
      expect(service.emailSentCount).toBe(0);
      expect(service.pushSentCount).toBe(0);
    });

    it('should respect disabled specific channels (e.g. email disabled, push enabled)', async () => {
      await request(app)
        .put('/api/v1/notifications/preferences')
        .set('Authorization', 'Bearer ' + userToken)
        .send({
          category: 'usage_limits',
          emailEnabled: false,
          pushEnabled: true,
          inAppEnabled: true
        });

      await service.triggerNotification(userId, 'usage_limits', 'AI Limit Warning', 'You used 90% of your AI variations.');

      expect(service.emailSentCount).toBe(0);
      expect(service.pushSentCount).toBe(1);
    });
  });

  describe('Delivery Retries, Failures and Logs', () => {
    it('should track retry count on simulated failures', async () => {
      const notification = await repo.createNotification(userId, 'publishing', 'Publish Success', 'Post #1 published.');
      const delivery = await repo.createDelivery(notification.id, 'email');

      // Induce 1 failure
      const errorMsg = 'SMTP Connection timeout';
      const updated = await repo.updateDelivery(delivery.id, {
        status: 'failed',
        error_message: errorMsg,
        retry_count: 1
      });

      expect(updated.status).toBe('failed');
      expect(updated.retry_count).toBe(1);
      expect(updated.error_message).toBe(errorMsg);
    });
  });
});
