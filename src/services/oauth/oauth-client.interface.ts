export interface OAuthProfile {
  platformAccountId: string;
  username: string;
  profilePictureUrl: string;
  metadata?: Record<string, any>;
}

export interface OAuthTokenResponse {
  accessToken: string;
  expiresInSeconds?: number;
  refreshToken?: string;
}

export interface OAuthClient {
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<OAuthTokenResponse>;
  getProfile(accessToken: string): Promise<OAuthProfile>;
}
