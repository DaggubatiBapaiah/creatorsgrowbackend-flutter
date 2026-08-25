import { ScheduledPost } from '../../repositories/content.repository';
import { SocialAccount } from '../../repositories/social.repository';

export interface PublishResult {
  success: boolean;
  externalPostId?: string;
  error?: string;
}

export interface SocialPublisher {
  publish(post: ScheduledPost, account: SocialAccount): Promise<PublishResult>;
}
