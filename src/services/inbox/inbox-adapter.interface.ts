import { EngagementItem } from '../../repositories/inbox.repository';

export interface InboxAdapter {
  fetchItems(socialAccount: any): Promise<Partial<EngagementItem>[]>;
  postReply(socialAccount: any, itemExternalId: string, replyText: string): Promise<string>;
  toggleLike(socialAccount: any, itemExternalId: string, like: boolean): Promise<boolean>;
  toggleHide(socialAccount: any, itemExternalId: string, hide: boolean): Promise<boolean>;
  deleteItem(socialAccount: any, itemExternalId: string): Promise<boolean>;
}