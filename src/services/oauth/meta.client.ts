import crypto from 'crypto';
import { env } from '../../config/env';
import { OAuthClient, OAuthProfile, OAuthTokenResponse } from './oauth-client.interface';

export class RealMetaOAuthClient implements OAuthClient {
  private get appId(): string {
    return env.INSTAGRAM_APP_ID || env.META_APP_ID;
  }
  
  private get appSecret(): string {
    return env.INSTAGRAM_APP_SECRET || env.META_APP_SECRET;
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      enable_fb_login: '0',
      force_authentication: '1',
      client_id: this.appId,
      redirect_uri: env.META_REDIRECT_URI,
      response_type: 'code',
      scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments,instagram_business_manage_messages,instagram_business_manage_insights',
      state: state,
    });
    return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokenResponse> {
    const formData = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      grant_type: 'authorization_code',
      redirect_uri: env.META_REDIRECT_URI,
      code: code,
    });

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
      metadata: { instagramUserId: data.user_id },
    };
  }

  async getProfile(accessToken: string): Promise<OAuthProfile> {
    // Fetch directly from Instagram Graph API
    const url = `https://graph.instagram.com/v20.0/me?fields=id,username,profile_picture_url&access_token=${accessToken}`;
    const response = await fetch(url);
    if (!response || !response.ok) {
      throw new Error(`Instagram Profile Fetch Failed: HTTP ${response?.status || 'Unknown'}`);
    }
    
    const igAccount = await response.json();

    if (!igAccount || !igAccount.id) {
      throw new Error('No connected Instagram account found.');
    }

    return {
      platformAccountId: igAccount.id,
      username: igAccount.username || `ig_${igAccount.id}`,
      profilePictureUrl: igAccount.profile_picture_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      metadata: { source: 'instagram_login' },
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
