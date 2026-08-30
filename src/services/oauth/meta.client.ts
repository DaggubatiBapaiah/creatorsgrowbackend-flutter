import crypto from 'crypto';
import { env } from '../../config/env';
import { OAuthClient, OAuthProfile, OAuthTokenResponse } from './oauth-client.interface';

export class RealMetaOAuthClient implements OAuthClient {
  getAuthUrl(state: string): string {
    // We are using Facebook Login for Business to get Instagram Professional accounts.
    // META_APP_ID MUST be the Facebook App ID from Settings > Basic.
    // config_id MUST be the Facebook Login for Business Configuration ID.
    const params = new URLSearchParams({
      client_id: env.META_APP_ID,
      redirect_uri: env.META_REDIRECT_URI,
      response_type: 'code',
      scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments,instagram_business_manage_messages,instagram_business_manage_insights,pages_show_list,pages_read_engagement,business_management,public_profile',
      state: state,
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokenResponse> {
    const fbUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${env.META_APP_ID}&redirect_uri=${encodeURIComponent(env.META_REDIRECT_URI)}&client_secret=${env.META_APP_SECRET}&code=${code}`;
    const fbRes = await fetch(fbUrl);
    const fbData = await fbRes.json();
    
    if (!fbRes.ok || !fbData.access_token) {
      throw new Error(`Meta Token Exchange Failed: ${fbData.error?.message || 'Invalid authorization code'}`);
    }
    
    return {
      accessToken: fbData.access_token,
      expiresInSeconds: fbData.expires_in,
    };
  }

  async getProfile(accessToken: string): Promise<OAuthProfile> {
    // Fetch via Facebook Page Graph API
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account{id,username,profile_picture_url}&access_token=${accessToken}`;
    const response = await fetch(pagesUrl);
    if (!response || !response.ok) {
      throw new Error(`Meta Profile Fetch Failed: HTTP ${response?.status || 'Unknown'}`);
    }
    const data = await response.json();

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
    return `${env.META_REDIRECT_URI}?code=mock_code_${state.substring(0, 8)}&state=${state}`;
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
