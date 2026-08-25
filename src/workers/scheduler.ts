import { ContentRepository } from '../repositories/content.repository';
import { SocialRepository } from '../repositories/social.repository';
import { PublisherFactory } from '../services/publishing/publisher.factory';

export class SchedulerWorker {
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;
  private contentRepo = new ContentRepository();
  private socialRepo = new SocialRepository();

  start() {
    if (this.intervalId) return;
    console.log('[Scheduler] Starting background worker for scheduled posts...');
    
    this.intervalId = setInterval(() => this.processDuePosts(), 60000);
    setTimeout(() => this.processDuePosts(), 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private async processDuePosts() {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const posts = await this.contentRepo.getDuePosts();
      
      for (const post of posts) {
        const acquired = await this.contentRepo.markPublishing(post.id);
        if (!acquired) continue;

        try {
          const account = await this.socialRepo.findById(post.social_account_id);
          if (!account) {
            await this.contentRepo.markFailed(post.id, 'Social account not found');
            continue;
          }

          const publisher = PublisherFactory.getPublisher(account.platform);
          const result = await publisher.publish(post, account);

          if (result.success && result.externalPostId) {
            await this.contentRepo.markPublished(post.id, result.externalPostId);
          } else {
            await this.contentRepo.markFailed(post.id, result.error || 'Unknown error');
          }
        } catch (err: any) {
          await this.contentRepo.markFailed(post.id, err.message || 'Worker exception');
        }
      }
    } catch (error) {
      console.error('[Scheduler] Error processing posts:', error);
    } finally {
      this.isRunning = false;
    }
  }
}

export const schedulerWorker = new SchedulerWorker();
