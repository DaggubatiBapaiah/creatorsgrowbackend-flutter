import { InboxAdapter } from './inbox-adapter.interface';
import { EngagementItem } from '../../repositories/inbox.repository';
import { decrypt } from '../../utils/crypto';

export class InstagramAdapter implements InboxAdapter {
  async fetchItems(account: any): Promise<Partial<EngagementItem>[]> {
    const accessToken = decrypt(account.access_token);
    const igBusinessId = account.platform_account_id;

    if (account.status === 'disconnected') {
      throw { status: 401, message: 'Instagram token expired or disconnected.' };
    }

    // Live API fetch:
    // GET /v19.0/{ig-user-id}/media?fields=comments{id,text,username,timestamp,like_count,replies{id,text,username}}
    // For test/dev sandbox logic, we simulate incoming real comments if real token isn't present
    if (accessToken === 'mock') {
      return [
        {
          external_id: 'ig_comment_1',
          platform: 'instagram',
          item_type: 'comment',
          author_name: 'rahul_singh',
          content: 'Amazing picture! What camera did you use for this shot?',
          like_count: 14,
          is_read: false,
          is_replied: false,
          metadata: { isLiked: false, isHidden: false, mediaId: 'ig_media_101' },
          created_at: new Date(Date.now() - 3600 * 1000),
        },
        {
          external_id: 'ig_comment_2',
          platform: 'instagram',
          item_type: 'comment',
          author_name: 'priya_k',
          content: 'Keep growing! Love the aesthetics of this feed.',
          like_count: 5,
          is_read: false,
          is_replied: true,
          metadata: { isLiked: true, isHidden: false, mediaId: 'ig_media_101' },
          created_at: new Date(Date.now() - 7200 * 1000),
        }
      ];
    }

    try {
      const res = await fetch(`https://graph.instagram.com/v20.0/${igBusinessId}/media?fields=comments{id,text,username,timestamp,like_count}&access_token=${accessToken}`);
      if (!res.ok) throw new Error('Failed to fetch Instagram comments');
      const data = await res.json();
      
      const items: Partial<EngagementItem>[] = [];
      const mediaList = data.data || [];
      for (const media of mediaList) {
        const comments = media.comments?.data || [];
        for (const comment of comments) {
          items.push({
            external_id: comment.id,
            platform: 'instagram',
            item_type: 'comment',
            author_name: comment.username || 'anonymous',
            content: comment.text,
            like_count: comment.like_count || 0,
            is_read: false,
            is_replied: false,
            metadata: { isLiked: false, isHidden: false, mediaId: media.id },
            created_at: new Date(comment.timestamp),
          });
        }
      }
      return items;
    } catch {
      throw { status: 502, message: 'Meta Graph API failure.' };
    }
  }

  async postReply(account: any, commentId: string, text: string): Promise<string> {
    const accessToken = decrypt(account.access_token);
    if (accessToken === 'mock') return 'ig_reply_mock_' + Math.random().toString(36).substring(7);

    const res = await fetch(`https://graph.instagram.com/v20.0/${commentId}/replies?message=${encodeURIComponent(text)}&access_token=${accessToken}`, {
      method: 'POST'
    });
    if (!res.ok) throw { status: 502, message: 'Failed to post Instagram reply' };
    const data = await res.json();
    return data.id;
  }

  async toggleLike(account: any, commentId: string, like: boolean): Promise<boolean> {
    const accessToken = decrypt(account.access_token);
    if (accessToken === 'mock') return true;

    // Instagram comment like is a POST or DELETE request to commentId/likes
    const res = await fetch(`https://graph.instagram.com/v20.0/${commentId}/user_likes?access_token=${accessToken}`, {
      method: like ? 'POST' : 'DELETE'
    });
    return res.ok;
  }

  async toggleHide(account: any, commentId: string, hide: boolean): Promise<boolean> {
    const accessToken = decrypt(account.access_token);
    if (accessToken === 'mock') return true;

    const res = await fetch(`https://graph.instagram.com/v20.0/${commentId}?hide=${hide}&access_token=${accessToken}`, {
      method: 'POST'
    });
    return res.ok;
  }

  async deleteItem(account: any, commentId: string): Promise<boolean> {
    const accessToken = decrypt(account.access_token);
    if (accessToken === 'mock') return true;

    const res = await fetch(`https://graph.instagram.com/v20.0/${commentId}?access_token=${accessToken}`, {
      method: 'DELETE'
    });
    return res.ok;
  }
}