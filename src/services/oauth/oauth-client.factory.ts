import { OAuthClient } from './oauth-client.interface';
import { metaOAuthClient } from './meta.client';
import { tiktokOAuthClient } from './tiktok.client';

export class OAuthClientFactory {
  static getClient(platform: string): OAuthClient {
    switch (platform.toUpperCase()) {
      case 'INSTAGRAM':
      case 'META':
        return metaOAuthClient;
      case 'TIKTOK':
        return tiktokOAuthClient;
      case 'FACEBOOK':
        throw new Error('OAuthClient for Facebook is not yet implemented.');
      default:
        throw new Error(`OAuthClient for platform ${platform} is not implemented.`);
    }
  }
}
