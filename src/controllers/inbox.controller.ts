import { Request, Response, NextFunction } from 'express';
import { InboxService } from '../services/inbox/inbox.service';

export class InboxController {
  private inboxService = new InboxService();

  getItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { platform, status, search, limit, offset } = req.query;

      const items = await this.inboxService.getInboxItems(
        userId,
        {
          platform: platform ? String(platform) : undefined,
          status: status ? (status as any) : undefined,
          search: search ? String(search) : undefined,
        },
        limit ? Number(limit) : 20,
        offset ? Number(offset) : 0
      );

      return res.status(200).json({ data: { items } });
    } catch (error) {
      next(error);
    }
  };

  reply = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { text } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: { message: 'Reply text cannot be empty.' } });
      }

      const replyExternalId = await this.inboxService.replyToItem(userId, id, text);
      return res.status(200).json({ status: 'ok', data: { replyExternalId } });
    } catch (error) {
      next(error);
    }
  };

  markRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await this.inboxService.markAsRead(userId, id);
      return res.status(200).json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  toggleLike = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { like } = req.body;

      if (like === undefined) {
        return res.status(400).json({ error: { message: 'Property like is required.' } });
      }

      const ok = await this.inboxService.toggleLike(userId, id, Boolean(like));
      return res.status(200).json({ status: ok ? 'ok' : 'fail' });
    } catch (error: any) {
      if (error.status) {
        return res.status(error.status).json({ error: { message: error.message } });
      }
      next(error);
    }
  };

  toggleHide = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { hide } = req.body;

      if (hide === undefined) {
        return res.status(400).json({ error: { message: 'Property hide is required.' } });
      }

      const ok = await this.inboxService.toggleHide(userId, id, Boolean(hide));
      return res.status(200).json({ status: ok ? 'ok' : 'fail' });
    } catch (error) {
      next(error);
    }
  };

  deleteItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const ok = await this.inboxService.deleteItem(userId, id);
      return res.status(200).json({ status: ok ? 'ok' : 'fail' });
    } catch (error) {
      next(error);
    }
  };
}