import { Request, Response, NextFunction } from 'express';
import { ContentRepository } from '../repositories/content.repository';
import { SocialRepository } from '../repositories/social.repository';
import { ValidationError } from '../utils/errors';
import { PublisherFactory } from '../services/publishing/publisher.factory';

export class ContentController {
  private contentRepo = new ContentRepository();
  private socialRepo = new SocialRepository();

  createPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { socialAccountId, platform, caption, mediaIds, status, scheduledAt } = req.body;

      if (!socialAccountId || !platform) {
        throw new ValidationError('socialAccountId and platform are required.');
      }

      const account = await this.socialRepo.findById(socialAccountId);
      if (!account || account.user_id !== userId) {
        throw new ValidationError('Invalid social account.');
      }

      if (status === 'scheduled') {
        if (!scheduledAt) throw new ValidationError('scheduledAt is required for scheduled status.');
        if (new Date(scheduledAt) <= new Date()) {
          throw new ValidationError('Cannot schedule a post in the past.');
        }
      }

      const post = await this.contentRepo.createPost(
        userId,
        socialAccountId,
        platform,
        caption,
        mediaIds || [],
        status || 'draft',
        scheduledAt ? new Date(scheduledAt) : null
      );

      if (post.status === 'published' || post.status === 'publishing') {
         await this.contentRepo.markPublishing(post.id);
         const publisher = PublisherFactory.getPublisher(account.platform);
         const result = await publisher.publish(post, account);
         
         if (result.success && result.externalPostId) {
           await this.contentRepo.markPublished(post.id, result.externalPostId);
         } else {
           await this.contentRepo.markFailed(post.id, result.error || 'Unknown error');
         }
         
         const updatedPost = await this.contentRepo.getPostById(post.id, userId);
         return res.status(201).json({ post: updatedPost });
      }

      return res.status(201).json({ post });
    } catch (error) {
      next(error);
    }
  };

  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { caption, mediaIds, status, scheduledAt } = req.body;

      let post = await this.contentRepo.getPostById(id, userId);
      if (!post) throw new ValidationError('Post not found');

      if (post.status === 'published' || post.status === 'publishing') {
        throw new ValidationError('Cannot edit a post that is already published or publishing.');
      }

      if (status === 'scheduled' || (post.status === 'scheduled' && scheduledAt !== undefined)) {
        const finalScheduledAt = scheduledAt !== undefined ? scheduledAt : post.scheduled_at;
        if (!finalScheduledAt) throw new ValidationError('scheduledAt is required for scheduled status.');
        if (new Date(finalScheduledAt) <= new Date()) {
          throw new ValidationError('Cannot schedule a post in the past.');
        }
      }

      const updated = await this.contentRepo.updatePost(
        id,
        userId,
        caption ?? post.caption,
        mediaIds ?? post.media_ids,
        status ?? post.status,
        scheduledAt !== undefined ? (scheduledAt ? new Date(scheduledAt) : null) : post.scheduled_at
      );

      return res.status(200).json({ post: updated });
    } catch (error) {
      next(error);
    }
  };

  getPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const posts = await this.contentRepo.getPostsByUser(userId);
      return res.status(200).json({ posts });
    } catch (error) {
      next(error);
    }
  };

  deletePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      const success = await this.contentRepo.deletePost(id, userId);
      if (!success) throw new ValidationError('Post not found or cannot be deleted.');

      return res.status(200).json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  cancelPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const post = await this.contentRepo.getPostById(id, userId);
      if (!post) throw new ValidationError('Post not found');

      if (post.status !== 'scheduled') {
        throw new ValidationError('Only scheduled posts can be cancelled.');
      }

      const updated = await this.contentRepo.updatePost(id, userId, post.caption, post.media_ids, 'cancelled', post.scheduled_at);
      return res.status(200).json({ post: updated });
    } catch (error) {
      next(error);
    }
  };
}
