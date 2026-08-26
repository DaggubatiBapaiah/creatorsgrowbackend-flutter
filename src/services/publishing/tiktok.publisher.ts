import fs from 'fs';
import path from 'path';
import { ScheduledPost, ContentRepository } from '../../repositories/content.repository';
import { SocialAccount } from '../../repositories/social.repository';
import { PublishResult, SocialPublisher } from './social-publisher.interface';
import { decrypt } from '../../utils/crypto';
import { pool } from '../../config/db';
import { env } from '../../config/env';

export class TikTokPublisher implements SocialPublisher {
  
  async publish(post: ScheduledPost, account: SocialAccount): Promise<PublishResult> {
    try {
      if (account.platform !== 'TIKTOK') {
        return { success: false, error: 'TikTokPublisher only supports TIKTOK platform.' };
      }

      if (account.status !== 'connected' || (account.expires_at && new Date() > account.expires_at)) {
        return { success: false, error: 'Social account is disconnected or expired.' };
      }

      const accessToken = decrypt(account.access_token);

      // 1. Check if already uploaded and processing
      if (post.external_post_id) {
        if (env.TIKTOK_OAUTH_MODE === 'mock') {
          return { success: true, externalPostId: post.external_post_id };
        }
        
        const statusRes = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: JSON.stringify({ publish_id: post.external_post_id })
        });
        
        const statusData = await statusRes.json();
        
        if (!statusRes.ok || statusData.error?.code !== 0) {
           const msg = statusData.error?.message || 'Failed to fetch status';
           if (statusRes.status === 401 || msg.toLowerCase().includes('token')) {
             return { success: false, error: `OAuthException: ${msg}` };
           }
           throw new Error(`TikTok Status API Error: ${msg}`);
        }
        
        const ttStatus = statusData.data.status;
        if (ttStatus === 'PROCESSING') {
           throw new Error('TikTok processing...'); // pg-boss will retry
        }
        if (ttStatus === 'PUBLISH_COMPLETE') {
           return { success: true, externalPostId: post.external_post_id };
        }
        if (ttStatus === 'FAILED' || ttStatus === 'PROCESSING_FAILED') {
           return { success: false, error: `TikTok processing failed: ${statusData.data.fail_reason || 'Unknown reason'}` };
        }
        
        throw new Error(`Unknown TikTok status: ${ttStatus}`);
      }

      // 2. We need media
      if (!post.media_ids || post.media_ids.length === 0) {
        return { success: false, error: 'TikTok requires a video asset.' };
      }

      const placeholders = post.media_ids.map((_, i) => `$${i + 1}`).join(',');
      const query = `SELECT url, type FROM media_assets WHERE id IN (${placeholders})`;
      const { rows } = await pool.query(query, post.media_ids);
      
      const videoAssets = rows.filter(r => r.type === 'video');
      if (videoAssets.length === 0) {
        return { success: false, error: 'TikTok requires a valid video format.' };
      }

      const relativeUrl = videoAssets[0].url;
      const cleanUrl = relativeUrl.startsWith('/') ? relativeUrl.slice(1) : relativeUrl;
      const filePath = path.join(process.cwd(), cleanUrl);

      if (!fs.existsSync(filePath)) {
         return { success: false, error: `Media file not found at ${filePath}` };
      }

      const stat = fs.statSync(filePath);
      const videoSize = stat.size;

      // Ensure chunk variables
      const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
      const totalChunkCount = Math.ceil(videoSize / CHUNK_SIZE);

      // Check if we crashed mid-upload and have an active session
      const metadata = post.metadata || {};
      let publishId = metadata.tiktok_publish_id;
      let uploadUrl = metadata.tiktok_upload_url;

      if (!publishId || !uploadUrl) {
         // 3. Creator Info check
         if (env.TIKTOK_OAUTH_MODE !== 'mock') {
            const cInfoRes = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=UTF-8'
              }
            });
            const cInfoData = await cInfoRes.json();
            
            if (!cInfoRes.ok || cInfoData.error?.code !== 0) {
              const msg = cInfoData.error?.message || 'Unknown Creator Info error';
              if (cInfoRes.status === 401 || msg.toLowerCase().includes('token')) {
                 return { success: false, error: `OAuthException: ${msg}` };
              }
              return { success: false, error: `Creator Info API Error: ${msg}` };
            }

            const privacyOptions = cInfoData.data.privacy_level_options || [];
            const desiredPrivacy = metadata.privacy_level || 'SELF_ONLY';

            if (!privacyOptions.includes(desiredPrivacy)) {
               // Fallback to SELF_ONLY if available, otherwise fail
               if (privacyOptions.includes('SELF_ONLY')) {
                  metadata.privacy_level = 'SELF_ONLY';
               } else {
                  return { success: false, error: `Requested privacy level unsupported by this TikTok account. Allowed: ${privacyOptions.join(',')}` };
               }
            }
         } else {
            metadata.privacy_level = 'SELF_ONLY';
         }

         // 4. Init Direct Post
         if (env.TIKTOK_OAUTH_MODE === 'mock') {
           publishId = `mock_tt_post_${Date.now()}`;
           uploadUrl = 'mock_upload_url';
         } else {
           const initBody = {
             post_info: {
               title: post.caption || '',
               privacy_level: metadata.privacy_level,
               disable_duet: false,
               disable_comment: false,
               disable_stitch: false
             },
             source_info: {
               source: 'FILE_UPLOAD',
               video_size: videoSize,
               chunk_size: CHUNK_SIZE,
               total_chunk_count: totalChunkCount
             }
           };

           const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
             method: 'POST',
             headers: {
               'Authorization': `Bearer ${accessToken}`,
               'Content-Type': 'application/json; charset=UTF-8'
             },
             body: JSON.stringify(initBody)
           });

           const initData = await initRes.json();
           
           if (!initRes.ok || initData.error?.code !== 0) {
             const errorMsg = initData.error?.message || initData.error?.description || 'Unknown Init error';
             if (initRes.status === 401 || errorMsg.toLowerCase().includes('token')) {
               return { success: false, error: `OAuthException: ${errorMsg}` };
             }
             return { success: false, error: `TikTok API Init Error: ${errorMsg}` };
           }

           publishId = initData.data.publish_id;
           uploadUrl = initData.data.upload_url;
         }

         // Save state to DB to prevent duplicate uploads if worker crashes
         metadata.tiktok_publish_id = publishId;
         metadata.tiktok_upload_url = uploadUrl;
         const contentRepo = new ContentRepository();
         await contentRepo.updatePostMetadata(post.id, metadata);
      }

      // 5. Upload Chunks
      if (env.TIKTOK_OAUTH_MODE === 'mock') {
         await new Promise(r => setTimeout(r, 1000));
         return { success: true, externalPostId: publishId };
      }

      const fd = fs.openSync(filePath, 'r');
      try {
        for (let i = 0; i < totalChunkCount; i++) {
          const start = i * CHUNK_SIZE;
          let end = start + CHUNK_SIZE - 1;
          if (end >= videoSize) {
             end = videoSize - 1;
          }
          
          const sizeToRead = end - start + 1;
          const buffer = Buffer.alloc(sizeToRead);
          fs.readSync(fd, buffer, 0, sizeToRead, start);
          
          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'video/mp4',
              'Content-Length': sizeToRead.toString(),
              'Content-Range': `bytes ${start}-${end}/${videoSize}`
            },
            body: buffer
          });

          if (!uploadRes.ok) {
             // If URL expired or rejected, we should clear metadata and start over next retry.
             if (uploadRes.status === 403 || uploadRes.status === 401) {
                const contentRepo = new ContentRepository();
                await contentRepo.updatePostMetadata(post.id, {});
                throw new Error('Upload URL expired or rejected. Metadata cleared for next retry.');
             }
             throw new Error(`Upload failed on chunk ${i+1}/${totalChunkCount}: HTTP ${uploadRes.status}`);
          }
        }
      } finally {
        fs.closeSync(fd);
      }

      // Upload complete. We don't wait for processing; we return the publishId to be saved as external_post_id.
      // Next time pg-boss retries (or polling happens), it will hit the status fetch block.
      // We can just throw a processing error immediately to force a quick poll.
      
      return { success: true, externalPostId: publishId };

    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown TikTok publishing error' };
    }
  }
}
