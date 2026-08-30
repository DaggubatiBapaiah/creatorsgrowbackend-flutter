import { SocialPublisher, PublishResult } from './social-publisher.interface';
import { ScheduledPost } from '../../repositories/content.repository';
import { SocialAccount } from '../../repositories/social.repository';
import { decrypt } from '../../utils/crypto';
import { pool } from '../../config/db';
import { env } from '../../config/env';

export class MetaPublisher implements SocialPublisher {
  async publish(post: ScheduledPost, account: SocialAccount): Promise<PublishResult> {
    try {
      if (account.platform !== 'INSTAGRAM') {
        return { success: false, error: 'MetaPublisher only supports INSTAGRAM platform currently.' };
      }

      if (account.status !== 'connected' || (account.expires_at && new Date() > account.expires_at)) {
        return { success: false, error: 'Social account is disconnected or expired.' };
      }

      const accessToken = decrypt(account.access_token);
      
      let mediaUrls: string[] = [];
      let isVideo = false;
      if (post.media_ids && post.media_ids.length > 0) {
        const placeholders = post.media_ids.map((_, i) => `$${i + 1}`).join(',');
        const query = `SELECT url, type FROM media_assets WHERE id IN (${placeholders})`;
        const { rows } = await pool.query(query, post.media_ids);
        mediaUrls = rows.map(r => {
           const host = env.META_OAUTH_MODE === 'real' ? 'https://example.com' : 'http://localhost:3000';
           return `${host}${r.url}`;
        });
        if (rows.some(r => r.type === 'video')) isVideo = true;
      }

      if (env.META_OAUTH_MODE === 'mock') {
        console.log(`[MOCK PUBLISH] Publishing to IG ${account.platform_account_id} | Caption: ${post.caption} | Media: ${mediaUrls.join(',')}`);
        await new Promise(r => setTimeout(r, 1000));
        return { success: true, externalPostId: `mock_ig_post_${Date.now()}` };
      }

      const igUserId = account.platform_account_id;
      
      if (mediaUrls.length === 0) {
         return { success: false, error: 'Instagram requires at least one image or video.' };
      }
      
      const mediaUrl = mediaUrls[0];
      
      const createContainerUrl = `https://graph.instagram.com/v20.0/${igUserId}/media`;
      const containerBody = new URLSearchParams();
      if (isVideo) {
        containerBody.append('media_type', 'REELS');
        containerBody.append('video_url', mediaUrl);
      } else {
        containerBody.append('image_url', mediaUrl);
      }
      if (post.caption) {
        containerBody.append('caption', post.caption);
      }
      containerBody.append('access_token', accessToken);

      const containerRes = await fetch(createContainerUrl, { method: 'POST', body: containerBody });
      const containerData = await containerRes.json();
      
      if (!containerRes.ok) {
        const errorType = containerData.error?.type || '';
        const errorMessage = containerData.error?.message || 'Unknown Meta API error';
        if (errorType === 'OAuthException') {
          return { success: false, error: `OAuthException: ${errorMessage}` };
        }
        return { success: false, error: `Meta API Error: ${errorMessage}` };
      }
      
      const creationId = containerData.id;

      const publishUrl = `https://graph.instagram.com/v20.0/${igUserId}/media_publish`;
      const publishBody = new URLSearchParams();
      publishBody.append('creation_id', creationId);
      publishBody.append('access_token', accessToken);

      const publishRes = await fetch(publishUrl, { method: 'POST', body: publishBody });
      const publishData = await publishRes.json();
      
      if (!publishRes.ok) {
        const errorType = publishData.error?.type || '';
        const errorMessage = publishData.error?.message || 'Unknown Meta Publish error';
        if (errorType === 'OAuthException') {
          return { success: false, error: `OAuthException: ${errorMessage}` };
        }
        return { success: false, error: `Meta API Publish Error: ${errorMessage}` };
      }

      return { success: true, externalPostId: publishData.id };

    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown publishing error' };
    }
  }
}
