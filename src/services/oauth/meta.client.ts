import crypto from 'crypto';
import { env } from '../../config/env';

export interface MetaProfile {
  platformAccountId: string;
  username: string;
  profilePictureUrl: string;
}

export interface MetaOAuthClient {
  exchangeCode(code: string): Promise<string>;
  getProfile(accessToken: string): Promise<MetaProfile>;
}

export class RealMetaOAuthClient implements MetaOAuthClient {
  async exchangeCode(code: string): Promise<string> {
    const url = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${env.META_APP_ID}&redirect_uri=${encodeURIComponent(env.META_REDIRECT_URI)}&client_secret=${env.META_APP_SECRET}&code=${code}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Meta Token Exchange Failed: ${data.error?.message || 'Unknown error'}`);
    }
    
    return data.access_token;
  }

  async getProfile(accessToken: string): Promise<MetaProfile> {
    // Requires instagram_basic permissions
    // We typically fetch the user's facebook pages, then connected instagram accounts.
    // For simplicity of this milestone, we'll hit the /me endpoint.
    const response = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=${accessToken}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Meta Profile Fetch Failed: ${data.error?.message || 'Unknown error'}`);
    }

    return {
      platformAccountId: data.id,
      username: data.name || `meta_user_${data.id}`,
      profilePictureUrl: data.picture?.data?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    };
  }
}

export class DevelopmentMockMetaOAuthClient implements MetaOAuthClient {
  async exchangeCode(code: string): Promise<string> {
    console.log('[MOCK] Exchanging code for Meta access token');
    return 'mock_meta_access_token_' + crypto.randomBytes(8).toString('hex');
  }

  async getProfile(accessToken: string): Promise<MetaProfile> {
    console.log('[MOCK] Fetching profile for token:', accessToken);
    return {
      platformAccountId: '1182224441650601',
      username: 'test_creator_meta',
      profilePictureUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    };
  }
}

export const metaOAuthClient: MetaOAuthClient = env.META_OAUTH_MODE === 'real'
  ? new RealMetaOAuthClient()
  : new DevelopmentMockMetaOAuthClient();
