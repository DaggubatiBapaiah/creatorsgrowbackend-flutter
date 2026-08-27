import { NotFoundError } from '../../utils/errors';
import { InboxRepository, EngagementItem } from '../../repositories/inbox.repository';
import { SocialRepository } from '../../repositories/social.repository';
import { InstagramAdapter } from './instagram.adapter';
import { YouTubeAdapter } from './youtube.adapter';
import { XAdapter } from './x.adapter';
import { InboxAdapter } from './inbox-adapter.interface';

export class InboxService {
  private repo = new InboxRepository();
  private socialRepo = new SocialRepository();

  private adapters: Record<string, InboxAdapter> = {
    instagram: new InstagramAdapter(),
    youtube: new YouTubeAdapter(),
    x: new XAdapter(),
    facebook: new InstagramAdapter(), // Meta Graph utilizes similar Graph endpoints
  };

  async syncInbox(userId: string): Promise<void> {
    const accounts = await this.socialRepo.getAccountsByUserId(userId);
    const connected = accounts.filter(a => a.status === 'connected');

    for (const acc of connected) {
      const adapter = this.adapters[acc.platform.toLowerCase()];
      if (adapter) {
        try {
          const items = await adapter.fetchItems(acc);
          for (const item of items) {
            await this.repo.createOrUpdateItem({
              ...item,
              user_id: userId,
              social_account_id: acc.id,
            } as any);
          }
        } catch (e: any) {
          // Soft-fail: log sync error per platform without crashing the full inbox sync
          console.error(`Failed to sync inbox for ${acc.platform}: ${e.message || e}`);
        }
      }
    }
  }

  async getInboxItems(
    userId: string,
    filters: { platform?: string; status?: 'unread' | 'replied'; search?: string },
    limit: number = 20,
    offset: number = 0
  ): Promise<EngagementItem[]> {
    // Perform live sync prior to fetching list
    await this.syncInbox(userId);
    return await this.repo.getEngagementItems(userId, filters, limit, offset);
  }

  async replyToItem(userId: string, itemId: string, text: string): Promise<string> {
    const item = await this.repo.getEngagementItemById(itemId, userId);
    if (!item) throw new NotFoundError('Engagement item not found.');

    const account = await this.socialRepo.findById(item.social_account_id);
    if (!account) throw new NotFoundError('Associated social account not found.');

    const adapter = this.adapters[item.platform.toLowerCase()];
    if (!adapter) throw { status: 405, message: 'Platform adapter not supported.' };

    const replyExternalId = await adapter.postReply(account, item.external_id, text);
    
    // Mark item as replied
    await this.repo.markAsReplied(itemId, userId);
    return replyExternalId;
  }

  async toggleLike(userId: string, itemId: string, like: boolean): Promise<boolean> {
    const item = await this.repo.getEngagementItemById(itemId, userId);
    if (!item) throw { status: 404, message: 'Engagement item not found.' };

    const account = await this.socialRepo.findById(item.social_account_id);
    if (!account) throw { status: 404, message: 'Associated social account not found.' };

    const adapter = this.adapters[item.platform.toLowerCase()];
    if (!adapter) throw { status: 405, message: 'Platform adapter not supported.' };

    try {
      const ok = await adapter.toggleLike(account, item.external_id, like);
      if (ok) {
        const delta = like ? 1 : -1;
        await this.repo.updateLikeStatus(itemId, userId, like, delta);
      }
      return ok;
    } catch (e: any) {
      if (e.status === 405) {
        throw e; // Reraise unsupported platform API exceptions
      }
      throw { status: 502, message: 'External API failure' };
    }
  }

  async toggleHide(userId: string, itemId: string, hide: boolean): Promise<boolean> {
    const item = await this.repo.getEngagementItemById(itemId, userId);
    if (!item) throw { status: 404, message: 'Engagement item not found.' };

    const account = await this.socialRepo.findById(item.social_account_id);
    if (!account) throw { status: 404, message: 'Associated social account not found.' };

    const adapter = this.adapters[item.platform.toLowerCase()];
    if (!adapter) throw { status: 405, message: 'Platform adapter not supported.' };

    const ok = await adapter.toggleHide(account, item.external_id, hide);
    if (ok) {
      await this.repo.updateHideStatus(itemId, userId, hide);
    }
    return ok;
  }

  async deleteItem(userId: string, itemId: string): Promise<boolean> {
    const item = await this.repo.getEngagementItemById(itemId, userId);
    if (!item) throw { status: 404, message: 'Engagement item not found.' };

    const account = await this.socialRepo.findById(item.social_account_id);
    if (!account) throw { status: 404, message: 'Associated social account not found.' };

    const adapter = this.adapters[item.platform.toLowerCase()];
    if (!adapter) throw { status: 405, message: 'Platform adapter not supported.' };

    const ok = await adapter.deleteItem(account, item.external_id);
    if (ok) {
      await this.repo.deleteItem(itemId, userId);
    }
    return ok;
  }

  async markAsRead(userId: string, itemId: string): Promise<boolean> {
    return await this.repo.markAsRead(itemId, userId);
  }
}