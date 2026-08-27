import { InboxAdapter } from './inbox-adapter.interface';
import { EngagementItem } from '../../repositories/inbox.repository';
import { decrypt } from '../../utils/crypto';

export class XAdapter implements InboxAdapter {
  async fetchItems(account: any): Promise<Partial<EngagementItem>[]> {
    const accessToken = decrypt(account.access_token);
    if (accessToken === 'mock') {
      return [
        {
          external_id: 'x_mention_1',
          platform: 'x',
          item_type: 'mention',
          author_name: 'amit_p',
          content: 'Hey @creator, check this out! Loved your last thread on monetization.',
          like_count: 8,
          is_read: false,
          is_replied: false,
          metadata: { isLiked: false, isHidden: false },
          created_at: new Date(Date.now() - 400 * 1000),
        }
      ];
    }

    try {
      // Fetch recent tweets mentioning this handle
      // GET /2/users/:id/mentions
      const res = await fetch(`https://api.twitter.com/2/users/${account.platform_account_id}/mentions?tweet.fields=created_at,public_metrics&expansions=author_id`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error('X API fetch error');
      const data = await res.json();
      
      return (data.data || []).map((tweet: any) => ({
        external_id: tweet.id,
        platform: 'x',
        item_type: 'mention',
        author_name: 'twitter_user', // requires author expansion lookup, simplified for fallback
        content: tweet.text,
        like_count: tweet.public_metrics?.like_count || 0,
        is_read: false,
        is_replied: false,
        metadata: { isLiked: false, isHidden: false },
        created_at: new Date(tweet.created_at),
      }));
    } catch {
      throw { status: 502, message: 'X/Twitter API failure.' };
    }
  }

  async postReply(account: any, tweetId: string, text: string): Promise<string> {
    const accessToken = decrypt(account.access_token);
    if (accessToken === 'mock') return 'x_reply_mock_' + Math.random().toString(36).substring(7);

    // Create a tweet in reply to tweetId
    const payload = {
      text: text,
      reply: {
        in_reply_to_tweet_id: tweetId
      }
    };
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw { status: 502, message: 'Failed to post X reply' };
    const data = await res.json();
    return data.data.id;
  }

  async toggleLike(account: any, tweetId: string, like: boolean): Promise<boolean> {
    const accessToken = decrypt(account.access_token);
    if (accessToken === 'mock') return true;

    // Like/unlike tweet endpoints
    const url = `https://api.twitter.com/2/users/${account.platform_account_id}/likes${like ? '' : '/' + tweetId}`;
    const res = await fetch(url, {
      method: like ? 'POST' : 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: like ? JSON.stringify({ tweet_id: tweetId }) : undefined
    });
    return res.ok;
  }

  async toggleHide(account: any, tweetId: string, hide: boolean): Promise<boolean> {
    const accessToken = decrypt(account.access_token);
    if (accessToken === 'mock') return true;

    // Hides/unhides reply tweets
    const res = await fetch(`https://api.twitter.com/2/tweets/${tweetId}/hidden`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ hidden: hide })
    });
    return res.ok;
  }

  async deleteItem(account: any, tweetId: string): Promise<boolean> {
    const accessToken = decrypt(account.access_token);
    if (accessToken === 'mock') return true;

    // Can only delete user's own tweets
    const res = await fetch(`https://api.twitter.com/2/tweets/${tweetId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return res.ok;
  }
}