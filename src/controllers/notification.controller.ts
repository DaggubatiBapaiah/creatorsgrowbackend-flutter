import { Request, Response, NextFunction } from 'express';
import { NotificationRepository } from '../repositories/notification.repository';

export class NotificationController {
  private repo = new NotificationRepository();

  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { limit, offset } = req.query;

      const notifications = await this.repo.getNotifications(
        userId,
        limit ? Number(limit) : 20,
        offset ? Number(offset) : 0
      );

      return res.status(200).json({ data: { notifications } });
    } catch (error) {
      next(error);
    }
  };

  markRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const ok = await this.repo.markAsRead(id, userId);
      return res.status(200).json({ status: ok ? 'ok' : 'fail' });
    } catch (error) {
      next(error);
    }
  };

  getPreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const preferences = await this.repo.getPreferences(userId);
      return res.status(200).json({ data: { preferences } });
    } catch (error) {
      next(error);
    }
  };

  updatePreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { category, emailEnabled, pushEnabled, inAppEnabled } = req.body;

      if (!category) {
        return res.status(400).json({ error: { message: 'Category is required.' } });
      }

      const pref = await this.repo.savePreference({
        user_id: userId,
        category,
        email_enabled: emailEnabled !== undefined ? Boolean(emailEnabled) : true,
        push_enabled: pushEnabled !== undefined ? Boolean(pushEnabled) : true,
        in_app_enabled: inAppEnabled !== undefined ? Boolean(inAppEnabled) : true,
      });

      return res.status(200).json({ data: { preference: pref } });
    } catch (error) {
      next(error);
    }
  };
}