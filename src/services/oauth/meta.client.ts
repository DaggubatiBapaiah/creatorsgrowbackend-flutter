import crypto from 'crypto';
import { env } from '../../config/env';
import { OAuthClient, OAuthProfile, OAuthTokenResponse } from './oauth-client.interface';

export class RealMetaOAuthClient implements OAuthClient {
  private get appId(): string {
    return env.INSTAGRAM_APP_ID || '2137859737614991'; // Must use Instagram App ID
  }
  
  private get appSecret(): string {
    return env.INSTAGRAM_APP_SECRET || env.META_APP_SECRET;
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: env.META_REDIRECT_URI,
      response_type: 'code',
      scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments,instagram_business_manage_messages,instagram_business_manage_insights',
      state: state,
    });
    return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokenResponse> {
    // 1. Strip trailing #_ if Meta appended it to the code
    const cleanCode = code.replace(/#_$/, '');

    const formData = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      grant_type: 'authorization_code',
      redirect_uri: env.META_REDIRECT_URI,
      code: cleanCode,
    });

    // Forensic logging
    console.log('[Meta OAuth] Token Exchange Start');
    console.log(`[Meta OAuth] Using client_id: ${this.appId}`);
    console.log(`[Meta OAuth] Using redirect_uri: ${env.META_REDIRECT_URI}`);
    console.log(`[Meta OAuth] Is INSTAGRAM_APP_SECRET defined? ${!!env.INSTAGRAM_APP_SECRET}`);
    console.log(`[Meta OAuth] Is META_APP_SECRET defined? ${!!env.META_APP_SECRET}`);

    const res = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const data = await res.json();
    
    if (!res.ok || !data.access_token) {
      throw new Error(`Instagram Token Exchange Failed: ${data.error_message || data.error?.message || 'Invalid authorization code'}`);
    }
    
    return {
      accessToken: data.access_token,
      expiresInSeconds: 5184000, // Short-lived tokens are usually valid for 1 hour, but we mock 60 days here for simplicity unless swapped for long-lived.
    };
  }

  async getProfile(accessToken: string): Promise<OAuthProfile> {
    // Fetch directly from Instagram Graph API (Instagram Login)
    // Note: profile_picture_url is NOT available on the base /me endpoint for Instagram Login.
    const url = `https://graph.instagram.com/v20.0/me?fields=id,username,account_type&access_token=${accessToken}`;
    const response = await fetch(url);
    if (!response || !response.ok) {
      const errData = await response.text().catch(() => '');
      throw new Error(`Instagram Profile Fetch Failed: HTTP ${response?.status || 'Unknown'} - ${errData}`);
    }
    
    const igAccount = await response.json();

    if (!igAccount || !igAccount.id) {
      throw new Error('No connected Instagram account found in response.');
    }

    return {
      platformAccountId: igAccount.id,
      username: igAccount.username || `ig_${igAccount.id}`,
      // profile_picture_url is not returned by the API, so we provide a default avatar
      profilePictureUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      metadata: { source: 'instagram_login', accountType: igAccount.account_type },
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
