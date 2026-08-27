import { InboxAdapter } from './inbox-adapter.interface';
import { EngagementItem } from '../../repositories/inbox.repository';
import { decrypt } from '../../utils/crypto';

export class YouTubeAdapter implements InboxAdapter {
  async fetchItems(account: any): Promise<Partial<EngagementItem>[]> {
    const accessToken = decrypt(account.access_token);
    if (accessToken === 'mock') {
      return [
        {
          external_id: 'yt_thread_1',
          platform: 'youtube',
          item_type: 'comment',
          author_name: 'TechGuru India',
          content: 'Excellent video overview! Please do a deeper walkthrough soon.',
          like_count: 42,
          is_read: false,
          is_replied: false,
          metadata: { isLiked: false, isHidden: false, videoId: 'yt_video_101' },
          created_at: new Date(Date.now() - 1800 * 1000),
        }
      ];
    }

    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&allThreadsRelatedToChannelId=${account.platform_account_id}&maxResults=20&access_token=${accessToken}`);
      if (!res.ok) throw new Error('YouTube fetch error');
      const data = await res.json();
      
      return (data.items || []).map((item: any) => {
        const topComment = item.snippet.topLevelComment.snippet;
        return {
          external_id: item.id,
          platform: 'youtube',
          item_type: 'comment',
          author_name: topComment.authorDisplayName,
          author_avatar_url: topComment.authorProfileImageUrl,
          content: topComment.textDisplay,
          like_count: topComment.likeCount || 0,
          is_read: false,
          is_replied: false,
          metadata: { isLiked: false, isHidden: false, videoId: item.snippet.videoId },
          created_at: new Date(topComment.publishedAt),
        };
      });
    } catch {
      throw { status: 502, message: 'YouTube Data API failure.' };
    }
  }

  async postReply(account: any, threadId: string, text: string): Promise<string> {
    const accessToken = decrypt(account.access_token);
    if (accessToken === 'mock') return 'yt_reply_mock_' + Math.random().toString(36).substring(7);

    // Reply is posted by inserting a comment under the thread
    const payload = {
      snippet: {
        parentId: threadId,
        textOriginal: text
      }
    };
    const res = await fetch(`https://www.googleapis.com/youtube/v3/comments?part=snippet&access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw { status: 502, message: 'Failed to post YouTube reply' };
    const data = await res.json();
    return data.id;
  }

  async toggleLike(_account: any, _commentId: string, _like: boolean): Promise<boolean> {
    // Official YouTube API does NOT support liking comments on behalf of channel
    throw { status: 405, message: 'Liking comments is not supported by YouTube API.' };
  }

  async toggleHide(account: any, commentId: string, hide: boolean): Promise<boolean> {
    const accessToken = decrypt(account.access_token);
    if (accessToken === 'mock') return true;

    // Modifies comment moderation status (heldForReview / published / rejected)
    const status = hide ? 'heldForReview' : 'published';
    const res = await fetch(`https://www.googleapis.com/youtube/v3/comments/setModerationStatus?id=&id=${commentId}&moderationStatus=${status}&access_token=${accessToken}`, {
      method: 'POST'
    });
    return res.ok;
  }

  async deleteItem(account: any, commentId: string): Promise<boolean> {
    const accessToken = decrypt(account.access_token);
    if (accessToken === 'mock') return true;

    const res = await fetch(`https://www.googleapis.com/youtube/v3/comments?id=${commentId}&access_token=${accessToken}`, {
      method: 'DELETE'
    });
    return res.ok;
  }
}