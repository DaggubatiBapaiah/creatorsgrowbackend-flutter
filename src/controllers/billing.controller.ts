import { Request, Response, NextFunction } from 'express';
import { EntitlementService } from '../services/billing/entitlement.service';
import { BillingRepository } from '../repositories/billing.repository';
import { env } from '../config/env';
import crypto from 'crypto';

export class BillingController {
  private entitlementService = new EntitlementService();
  private billingRepo = new BillingRepository();

  getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const status = await this.entitlementService.getSubscriptionStatus(userId);
      return res.status(200).json({ status });
    } catch (error) {
      next(error);
    }
  };

  createCheckout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { planCode } = req.body;

      if (!['creator', 'pro'].includes(planCode)) {
        return res.status(400).json({ error: { message: 'Invalid plan code.' } });
      }

      const mockSubId = 'sub_' + Math.random().toString(36).substring(2, 15);

      return res.status(200).json({
        subscriptionId: mockSubId,
        keyId: env.RAZORPAY_KEY_ID,
        amount: planCode === 'creator' ? 49900 : 149900,
        currency: 'INR',
        name: 'CreatorsGrow',
        description: planCode.toUpperCase() + ' Subscription Plan',
      });
    } catch (error) {
      next(error);
    }
  };

  handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      if (!signature) {
        return res.status(400).json({ error: { message: 'Missing Razorpay signature header.' } });
      }

      const shasum = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        return res.status(400).json({ error: { message: 'Invalid signature verification.' } });
      }

      const event = req.body;
      const eventId = event.id;
      const eventType = event.event;

      const isNewEvent = await this.billingRepo.logWebhookEvent(eventId, eventType);
      if (!isNewEvent) {
        return res.status(200).json({ status: 'ok', detail: 'Duplicate webhook event filtered.' });
      }

      const subscriptionEntity = event.payload?.subscription?.entity;
      if (subscriptionEntity) {
        const razorpaySubscriptionId = subscriptionEntity.id;
        const notes = subscriptionEntity.notes || {};
        const userId = notes.userId;

        if (userId) {
          const planCode = notes.planCode || 'free';
          const rzpStatus = subscriptionEntity.status;
          let dbStatus = 'active';

          if (rzpStatus === 'cancelled') {
             dbStatus = 'cancelled';
          } else if (rzpStatus === 'pending' || rzpStatus === 'halted') {
             dbStatus = 'past_due';
          } else if (rzpStatus === 'completed') {
             dbStatus = 'active';
          }

          const currentPeriodEnd = new Date(subscriptionEntity.current_end * 1000);
          const currentPeriodStart = new Date(subscriptionEntity.current_start * 1000);

          await this.billingRepo.createOrUpdateSubscription({
            user_id: userId,
            plan_code: planCode,
            status: dbStatus as any,
            razorpay_subscription_id: razorpaySubscriptionId,
            current_period_start: isNaN(currentPeriodStart.getTime()) ? new Date() : currentPeriodStart,
            current_period_end: isNaN(currentPeriodEnd.getTime()) ? new Date(Date.now() + 30 * 24 * 3600 * 1000) : currentPeriodEnd,
            cancel_at_period_end: subscriptionEntity.cancel_at_cycle_end === 1,
          });
        }
      }

      return res.status(200).json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  };
}