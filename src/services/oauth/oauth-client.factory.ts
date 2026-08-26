import { OAuthClient } from './oauth-client.interface';
import { metaOAuthClient } from './meta.client';
import { tiktokOAuthClient } from './tiktok.client';

export class OAuthClientFactory {
  static getClient(platform: string): OAuthClient {
    switch (platform.toUpperCase()) {
      case 'INSTAGRAM':
      case 'META':
      case 'FACEBOOK':
        return metaOAuthClient;
      case 'TIKTOK':
        return tiktokOAuthClient;
      default:
        throw new Error(`OAuthClient for platform ${platform} is not implemented.`);
    }
  }
}
