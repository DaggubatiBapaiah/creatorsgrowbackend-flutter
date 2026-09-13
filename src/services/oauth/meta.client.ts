import crypto from 'crypto';
import { env } from '../../config/env';
import { OAuthClient, OAuthProfile, OAuthTokenResponse } from './oauth-client.interface';

export class RealMetaOAuthClient implements OAuthClient {
  private get appId(): string {
    return env.META_APP_ID;
  }
  
  private get appSecret(): string {
    return env.META_APP_SECRET;
  }

  private get configId(): string {
    return env.META_CONFIG_ID;
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      config_id: this.configId,
      redirect_uri: env.META_REDIRECT_URI,
      response_type: 'code',
      state: state,
    });
    return `https://www.facebook.com/v25.0/dialog/oauth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokenResponse> {
    const cleanCode = code.replace(/#_$/, '');
    
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: env.META_REDIRECT_URI,
      code: cleanCode,
    });

    console.log(`[Meta OAuth] Endpoint: GET https://graph.facebook.com/v25.0/oauth/access_token`);

    const res = await fetch(`https://graph.facebook.com/v25.0/oauth/access_token?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok || !data.access_token) {
      console.error(`[Meta OAuth] Token Exchange Failed. Status: ${res.status}`);
      console.error(`[Meta OAuth] Upstream Error Data: ${JSON.stringify(data)}`);
      throw new Error(`Meta Token Exchange Failed: ${data.error?.message || 'Invalid authorization code'}`);
    }
    
    return {
      accessToken: data.access_token,
      expiresInSeconds: data.expires_in || 5184000,
    };
  }

  async getProfile(accessToken: string): Promise<OAuthProfile> {
    // 1. Get Facebook Pages and their connected Instagram Business Accounts
    const url = `https://graph.facebook.com/v25.0/me/accounts?fields=id,name,instagram_business_account{id,username,profile_picture_url}&access_token=${accessToken}`;
    const response = await fetch(url);
    if (!response || !response.ok) {
      const errData = await response.text().catch(() => '');
      throw new Error(`Meta Pages Fetch Failed: HTTP ${response?.status || 'Unknown'} - ${errData}`);
    }
    
    const pagesData = await response.json();
    const pages = pagesData.data || [];

    // 2. Find the first page with a connected Instagram Professional account
    let igAccount = null;
    let connectedPageId = null;

    for (const page of pages) {
      if (page.instagram_business_account) {
        igAccount = page.instagram_business_account;
        connectedPageId = page.id;
        break;
      }
    }

    if (!igAccount || !igAccount.id) {
      throw new Error('No connected Instagram Professional account found on the authorized Facebook Pages.');
    }

    return {
      platformAccountId: igAccount.id,
      username: igAccount.username || `ig_${igAccount.id}`,
      profilePictureUrl: igAccount.profile_picture_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      metadata: { source: 'facebook_login_for_business', facebookPageId: connectedPageId },
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
