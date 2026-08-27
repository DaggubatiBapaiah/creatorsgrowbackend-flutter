import { NotificationRepository, NotificationPreference } from '../../repositories/notification.repository';

export class NotificationService {
  private repo = new NotificationRepository();

  // Mock outbound providers (Email & Push)
  private mockEmailSentCount = 0;
  private mockPushSentCount = 0;

  get emailSentCount() { return this.mockEmailSentCount; }
  get pushSentCount() { return this.mockPushSentCount; }
  resetCounts() {
    this.mockEmailSentCount = 0;
    this.mockPushSentCount = 0;
  }

  async triggerNotification(userId: string, category: string, title: string, body: string, metadata?: any): Promise<void> {
    // 1. Fetch user preferences
    let pref = await this.repo.getPreferenceByCategory(userId, category);
    if (!pref) {
      // Default to enabled if no explicit preference saved
      pref = {
        user_id: userId,
        category,
        email_enabled: true,
        push_enabled: true,
        in_app_enabled: true
      };
    }

    // 2. Create in-app notification if enabled
    if (pref.in_app_enabled) {
      const notification = await this.repo.createNotification(userId, category, title, body, metadata);
      
      // Queue Email delivery if enabled
      if (pref.email_enabled) {
        await this.repo.createDelivery(notification.id, 'email');
      }

      // Queue Push delivery if enabled
      if (pref.push_enabled) {
        await this.repo.createDelivery(notification.id, 'push');
      }

      // Process deliveries immediately for live/mock flow
      await this.processPendingDeliveries();
    }
  }

  async processPendingDeliveries(): Promise<void> {
    const pending = await this.repo.getPendingDeliveries();

    for (const delivery of pending) {
      if (delivery.retry_count >= 3) {
        await this.repo.updateDelivery(delivery.id, {
          status: 'failed',
          error_message: 'Max retry attempts exceeded.'
        });
        continue;
      }

      try {
        await this.repo.updateDelivery(delivery.id, {
          last_attempt_at: new Date(),
          retry_count: delivery.retry_count + 1
        });

        if (delivery.channel === 'email') {
          await this.sendMockEmail();
        } else {
          await this.sendMockPush();
        }

        await this.repo.updateDelivery(delivery.id, {
          status: 'sent',
          error_message: null
        });
      } catch (e: any) {
        await this.repo.updateDelivery(delivery.id, {
          status: 'failed',
          error_message: e.message || 'Delivery error'
        });
      }
    }
  }

  private async sendMockEmail(): Promise<void> {
    // Simulating external SMTP / SendGrid API call
    this.mockEmailSentCount++;
  }

  private async sendMockPush(): Promise<void> {
    // Simulating external FCM API call
    this.mockPushSentCount++;
  }
}