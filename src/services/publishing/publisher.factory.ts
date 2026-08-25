import { SocialPublisher } from './social-publisher.interface';
import { MetaPublisher } from './meta.publisher';

export class PublisherFactory {
  static getPublisher(platform: string): SocialPublisher {
    switch (platform.toUpperCase()) {
      case 'INSTAGRAM':
      case 'FACEBOOK':
      case 'META':
        return new MetaPublisher();
      default:
        throw new Error(`Publisher for platform ${platform} is not implemented.`);
    }
  }
}
