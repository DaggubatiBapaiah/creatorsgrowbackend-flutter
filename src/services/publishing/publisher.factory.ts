import { SocialPublisher } from './social-publisher.interface';
import { MetaPublisher } from './meta.publisher';
import { TikTokPublisher } from './tiktok.publisher';

export class PublisherFactory {
  static getPublisher(platform: string): SocialPublisher {
    switch (platform.toUpperCase()) {
      case 'INSTAGRAM':
      case 'FACEBOOK':
      case 'META':
        return new MetaPublisher();
      case 'TIKTOK':
        return new TikTokPublisher();
      default:
        throw new Error(`Publisher for platform ${platform} is not implemented.`);
    }
  }
}
