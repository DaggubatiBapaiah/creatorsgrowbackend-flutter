import crypto from 'crypto';
import { env } from '../../config/env';
import { OAuthClient, OAuthProfile, OAuthTokenResponse } from './oauth-client.interface';

export class RealTikTokOAuthClient implements OAuthClient {
  getAuthUrl(state: string): string {
    return `https://www.tiktok.com/v2/auth/authorize/?client_key=${env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.publish,video.upload&response_type=code&redirect_uri=${encodeURIComponent(env.TIKTOK_REDIRECT_URI)}&state=${state}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokenResponse> {
    const url = 'https://open.tiktokapis.com/v2/oauth/token/';
    
    const body = new URLSearchParams();
    body.append('client_key', env.TIKTOK_CLIENT_KEY);
    body.append('client_secret', env.TIKTOK_CLIENT_SECRET);
    body.append('code', code);
    body.append('grant_type', 'authorization_code');
    body.append('redirect_uri', env.TIKTOK_REDIRECT_URI);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`TikTok Token Exchange Failed: ${data.error_description || 'Unknown error'}`);
    }

    return {
      accessToken: data.access_token,
      expiresInSeconds: data.expires_in,
      refreshToken: data.refresh_token,
    };
  }

  async getProfile(accessToken: string): Promise<OAuthProfile> {
    const url = 'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    const data = await response.json();

    if (!response.ok || data.error?.code !== 0) {
      throw new Error(`TikTok Profile Fetch Failed: ${data.error?.message || 'Unknown error'}`);
    }

    const user = data.data.user;

    return {
      platformAccountId: user.open_id,
      username: user.display_name,
      profilePictureUrl: user.avatar_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150',
      metadata: { union_id: user.union_id },
    };
  }
}

export class DevelopmentMockTikTokOAuthClient implements OAuthClient {
  getAuthUrl(state: string): string {
    return `http://localhost:5173/auth/tiktok/callback?code=mock_tiktok_code&state=${state}`; // Simulate redirect
  }

  async exchangeCode(code: string): Promise<OAuthTokenResponse> {
    return {
      accessToken: 'mock_tiktok_access_token_' + crypto.randomBytes(8).toString('hex'),
      expiresInSeconds: 86400,
      refreshToken: 'mock_tiktok_refresh_token',
    };
  }

  async getProfile(accessToken: string): Promise<OAuthProfile> {
    return {
      platformAccountId: 'tiktok_mock_user_123',
      username: 'test_creator_tiktok',
      profilePictureUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150',
    };
  }
}

export const tiktokOAuthClient: OAuthClient = env.TIKTOK_OAUTH_MODE === 'real'
  ? new RealTikTokOAuthClient()
  : new DevelopmentMockTikTokOAuthClient();
