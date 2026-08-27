import { RealMetaOAuthClient } from '../src/services/oauth/meta.client';
import { env } from '../src/config/env';
// Mock fetch globally
global.fetch = jest.fn();
describe('RealMetaOAuthClient', () => {
  let client: RealMetaOAuthClient;
  beforeEach(() => {
    client = new RealMetaOAuthClient();
    jest.resetAllMocks();
  });
  describe('getAuthUrl', () => {
    it('should generate a valid Facebook Login for Business authorization URL', () => {
      const state = 'test_state_123';
      const url = client.getAuthUrl(state);
      expect(url).toContain('https://www.facebook.com/v19.0/dialog/oauth');
      expect(url).toContain('client_id=' + env.META_APP_ID);
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('config_id=' + env.META_CONFIG_ID);
      expect(url).toContain('state=test_state_123');
    });
  });
  describe('exchangeCode', () => {
    it('should exchange code for access token successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'long_token', expires_in: 5184000 }),
      });
      const response = await client.exchangeCode('valid_code');
      expect(response.accessToken).toBe('long_token');
      expect(response.expiresInSeconds).toBe(5184000);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('https://graph.facebook.com/v19.0/oauth/access_token'));
    });
  });
  describe('getProfile', () => {
    it('should fetch Instagram profile via Facebook Page Graph API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'page1',
              name: 'Test Page Without IG'
            },
            {
              id: 'page2',
              name: 'Test Page With IG',
              instagram_business_account: {
                id: '12345678',
                username: 'ig_testuser',
                profile_picture_url: 'http://example.com/pic.jpg'
              }
            }
          ]
        }),
      });
      const profile = await client.getProfile('valid_token');
      expect(profile.platformAccountId).toBe('12345678');
      expect(profile.username).toBe('ig_testuser');
      expect(profile.profilePictureUrl).toBe('http://example.com/pic.jpg');
      expect(profile.metadata).toEqual({
        facebookPageId: 'page2',
      });
    });
    it('should throw error if no Facebook Pages found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await expect(client.getProfile('valid_token')).rejects.toThrow('No Facebook Pages found for this user.');
    });
    it('should throw error if fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad request',
      });
      await expect(client.getProfile('invalid_token')).rejects.toThrow('Meta Profile Fetch Failed: HTTP 400');
    });
  });
});
