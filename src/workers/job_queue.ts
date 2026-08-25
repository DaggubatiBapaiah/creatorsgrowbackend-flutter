import { env } from '../config/env';
import { ContentRepository } from '../repositories/content.repository';
import { SocialRepository } from '../repositories/social.repository';
import { PublisherFactory } from '../services/publishing/publisher.factory';

export let boss: any = {
  send: async () => {},
  start: async () => {},
  work: async () => {},
  on: () => {}
};

if (process.env.NODE_ENV !== 'test') {
  const PgBoss = require('pg-boss');
  boss = new PgBoss({
    connectionString: env.DATABASE_URL,
  });
}

export const PUBLISH_JOB = 'publish-post';

export async function startJobQueue() {
  if (process.env.NODE_ENV === 'test') return;

  boss.on('error', (error: any) => console.error('[PgBoss] Error:', error));

  await boss.start();
  console.log('[PgBoss] Job queue started');

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
      if (!acquired) {
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
        if (result.error?.includes('disconnected or expired') || result.error?.includes('OAuthException')) {
           await contentRepo.transitionToFailed(post.id, result.error, true); // reconnect required
        } else {
           // Throw to allow pg-boss to retry
           throw new Error(result.error || 'Unknown error');
        }
      }
    } catch (err: any) {
      await contentRepo.transitionToFailed(data.postId, err.message || 'Worker exception');
      throw err; // Ensure pg-boss knows it failed
    }
  });
}
