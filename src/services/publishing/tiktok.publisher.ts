import { ScheduledPost } from '../../repositories/content.repository';
import { SocialAccount } from '../../repositories/social.repository';
import { PublishResult, SocialPublisher } from './social-publisher.interface';
import { decrypt } from '../../utils/crypto';

export class TikTokPublisher implements SocialPublisher {
  async publish(post: ScheduledPost, account: SocialAccount): Promise<PublishResult> {
    const accessToken = decrypt(account.access_token);

    if (!post.media_ids || post.media_ids.length === 0) {
      return { success: false, error: 'TikTok requires a video asset.' };
    }

    try {
      console.log(`[TikTokPublisher] Mock publishing to TikTok for user ${account.username}`);
      
      // In production, this would use the TikTok Content Posting API.
      // E.g. https://open.tiktokapis.com/v2/post/publish/video/init/
      
      return {
        success: true,
        externalPostId: `mock_tt_post_${Date.now()}`
      };
    } catch (e: any) {
      return { success: false, error: e.message || 'Unknown TikTok Publishing Error' };
    }
  }
}
