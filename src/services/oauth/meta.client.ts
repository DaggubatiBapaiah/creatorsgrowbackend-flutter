import crypto from 'crypto';
import { env } from '../../config/env';
import { OAuthClient, OAuthProfile, OAuthTokenResponse } from './oauth-client.interface';

export class RealMetaOAuthClient implements OAuthClient {
  getAuthUrl(state: string): string {
    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${env.META_APP_ID}&redirect_uri=${encodeURIComponent(env.META_REDIRECT_URI)}&state=${state}&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement`;
  }

  async exchangeCode(code: string): Promise<OAuthTokenResponse> {
    const shortLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${env.META_APP_ID}&redirect_uri=${encodeURIComponent(env.META_REDIRECT_URI)}&client_secret=${env.META_APP_SECRET}&code=${code}`;
    const shortResponse = await fetch(shortLivedUrl);
    const shortData = await shortResponse.json();
    
    if (!shortResponse.ok) {
      throw new Error(`Meta Token Exchange Failed: ${shortData.error?.message || 'Unknown error'}`);
    }

    const longLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${env.META_APP_ID}&client_secret=${env.META_APP_SECRET}&fb_exchange_token=${shortData.access_token}`;
    const longResponse = await fetch(longLivedUrl);
    const longData = await longResponse.json();

    if (!longResponse.ok) {
      return {
        accessToken: shortData.access_token,
        expiresInSeconds: shortData.expires_in,
      };
    }

    return {
      accessToken: longData.access_token,
      expiresInSeconds: longData.expires_in,
    };
  }

  async getProfile(accessToken: string): Promise<OAuthProfile> {
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account{id,username,profile_picture_url}&access_token=${accessToken}`;
    const response = await fetch(pagesUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Meta Profile Fetch Failed: ${data.error?.message || 'Unknown error'}`);
    }

    const pages = data.data || [];
    if (pages.length === 0) {
      throw new Error('No Facebook Pages found for this user.');
    }

    const pageWithIg = pages.find((p: any) => p.instagram_business_account != null);

    if (!pageWithIg) {
      throw new Error('No connected Instagram Professional account found on your Facebook Pages.');
    }

    const igAccount = pageWithIg.instagram_business_account;

    return {
      platformAccountId: igAccount.id,
      username: igAccount.username || `ig_${igAccount.id}`,
      profilePictureUrl: igAccount.profile_picture_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      metadata: { facebookPageId: pageWithIg.id },
    };
  }
}

export class DevelopmentMockMetaOAuthClient implements OAuthClient {
  getAuthUrl(state: string): string {
    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${env.META_APP_ID}&redirect_uri=${encodeURIComponent(env.META_REDIRECT_URI)}&state=${state}&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement`;
  }

  async exchangeCode(code: string): Promise<OAuthTokenResponse> {
    return {
      accessToken: 'mock_meta_access_token_' + crypto.randomBytes(8).toString('hex'),
      expiresInSeconds: 5184000,
    };
  }

  async getProfile(accessToken: string): Promise<OAuthProfile> {
    return {
      platformAccountId: '1182224441650601',
      username: 'test_creator_meta',
      profilePictureUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      metadata: { facebookPageId: 'mock_page_id_123' },
    };
  }
}

export const metaOAuthClient: OAuthClient = env.META_OAUTH_MODE === 'real'
  ? new RealMetaOAuthClient()
  : new DevelopmentMockMetaOAuthClient();
