import { env } from '../config/env';
import { ContentRepository } from '../repositories/content.repository';
import { SocialRepository } from '../repositories/social.repository';
import { PublisherFactory } from '../services/publishing/publisher.factory';
import { metaAnalyticsClient } from '../services/analytics/meta.analytics';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { decrypt } from '../utils/crypto';
import { pool } from '../config/db';

export let boss: any = {
  send: async () => {},
  start: async () => {},
  work: async () => {},
  on: () => {}
};

if (process.env.NODE_ENV !== 'test') {
  const PgBoss = require('pg-boss');
  const PgBossClass = PgBoss.PgBoss || PgBoss.default || PgBoss;
  boss = new PgBossClass({
    connectionString: env.DATABASE_URL,
  });
}

export const PUBLISH_JOB = 'publish-post';
export const ANALYTICS_ACCOUNT_SYNC = 'analytics-account-sync';
export const ANALYTICS_POST_SYNC = 'analytics-post-sync';

export async function startJobQueue() {
  if (process.env.NODE_ENV === 'test') return;

  boss.on('error', (error: any) => console.error('[PgBoss] Error:', error));

  await boss.start();
  console.log('[PgBoss] Job queue started');

  // Schedule analytics syncs
  await boss.schedule(ANALYTICS_ACCOUNT_SYNC, '0 * * * *'); // Every hour
  await boss.schedule(ANALYTICS_POST_SYNC, '15 * * * *'); // Every hour at :15

  // Work on publishing jobs
  await boss.work(PUBLISH_JOB, async (job: any) => {
    const data = job.data as { postId: string };
    const contentRepo = new ContentRepository();
    const socialRepo = new SocialRepository();

    try {
      const post = await contentRepo.getPostByIdInternal(data.postId);
      if (!post) {
        console.warn(`[PgBoss] Job ${job.id}: Post ${data.postId} not found`);
        return;
      }

      if (post.status === 'published' || post.external_post_id) {
        console.log(`[PgBoss] Job ${job.id}: Post ${data.postId} already published.`);
        return;
      }
      
      if (post.status === 'cancelled' || post.status === 'failed') {
        console.log(`[PgBoss] Job ${job.id}: Post ${data.postId} is cancelled or failed.`);
        return;
      }

      const acquired = await contentRepo.transitionToPublishing(post.id);
      if (!acquired && post.status !== 'publishing') {
         console.warn(`[PgBoss] Job ${job.id}: Failed to acquire publishing lock for ${post.id}`);
         return; // Maybe it's being published elsewhere
      }

      const account = await socialRepo.findById(post.social_account_id);
      if (!account) {
        await contentRepo.transitionToFailed(post.id, 'Social account not found');
        return;
      }

      const publisher = PublisherFactory.getPublisher(account.platform);
      const result = await publisher.publish(post, account);

      if (result.success && result.externalPostId) {
        await contentRepo.transitionToPublished(post.id, result.externalPostId);
      } else {
        const errorMsg = result.error || 'Unknown error';
        if (errorMsg.includes('disconnected or expired') || errorMsg.includes('OAuthException')) {
           await contentRepo.transitionToFailed(post.id, errorMsg, true); // reconnect required
        } else if (errorMsg.includes('permanent_failure') || errorMsg.includes('requires a video asset')) {
           await contentRepo.transitionToFailed(post.id, errorMsg, false); // permanent failure
        } else {
           // Retryable error (e.g. network timeout, or "TikTok processing...")
           // Do not transition to failed. Just throw so pg-boss retries it later.
           console.log(`[PgBoss] Job ${job.id}: Retryable error for post ${post.id}: ${errorMsg}`);
           throw new Error(errorMsg);
        }
      }
    } catch (err: any) {
       // Only mark as failed if it's an unexpected severe exception.
       // We'll assume everything caught here is retryable unless we manually called transitionToFailed above.
       const message = err.message || 'Worker exception';
       console.error(`[PgBoss] Job ${job.id} exception:`, message);
       throw err; // Let pg-boss retry it. We leave status as 'publishing'.
    }
  });

  // Work on analytics account sync
  await boss.work(ANALYTICS_ACCOUNT_SYNC, async () => {
    // Analytics sync code remains unchanged
    console.log('[PgBoss] Starting analytics account sync');
    const socialRepo = new SocialRepository();
    const analyticsRepo = new AnalyticsRepository();
    
    const result = await pool.query(`SELECT * FROM social_accounts WHERE status = 'connected'`);
    const accounts = result.rows;

    for (const acc of accounts) {
      if (acc.platform === 'instagram') {
        try {
          const accessToken = decrypt(acc.access_token_encrypted);
          const insights = await metaAnalyticsClient.getAccountInsights(acc.platform_account_id, accessToken);
          
          await analyticsRepo.saveAccountSnapshot(
            acc.id,
            insights.followersCount,
            insights.reach24h,
            insights.impressions24h
          );
        } catch (e: any) {
          console.error(`[PgBoss] Failed to sync account ${acc.id}:`, e.message);
        }
      }
    }
  });

  // Work on analytics post sync
  await boss.work(ANALYTICS_POST_SYNC, async () => {
    // Analytics sync code remains unchanged
    console.log('[PgBoss] Starting analytics post sync');
    const analyticsRepo = new AnalyticsRepository();
    
    const result = await pool.query(`
      SELECT p.*, a.access_token_encrypted, a.access_token_iv, a.platform_account_id
      FROM content_posts p
      JOIN social_accounts a ON p.social_account_id = a.id
      WHERE p.status = 'published' 
        AND p.external_post_id IS NOT NULL 
        AND p.updated_at >= NOW() - INTERVAL '30 days'
        AND a.status = 'connected'
    `);
    const posts = result.rows;

    for (const post of posts) {
      try {
        const accessToken = decrypt(post.access_token_encrypted);
        const insights = await metaAnalyticsClient.getPostInsights(post.external_post_id, accessToken);
        
        let engagementRate = 0;
        if (insights.reach > 0) {
          engagementRate = (insights.likes + insights.comments + insights.saved) / insights.reach;
        }

        await analyticsRepo.savePostSnapshot(
          post.id,
          insights.likes,
          insights.comments,
          insights.reach,
          insights.impressions,
          insights.saved,
          engagementRate
        );
      } catch (e: any) {
        console.error(`[PgBoss] Failed to sync post ${post.id}:`, e.message);
      }
    }
  });
}
