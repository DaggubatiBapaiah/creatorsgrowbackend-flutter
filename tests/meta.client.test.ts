import { RealMetaOAuthClient } from '../src/services/oauth/meta.client';
import { OAuthProfile, OAuthTokenResponse } from '../src/services/oauth/oauth-client.interface';

describe('RealMetaOAuthClient', () => {
  let client: RealMetaOAuthClient;

  beforeEach(() => {
    client = new RealMetaOAuthClient();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('exchangeCode', () => {
    it('should fallback to short-lived token if long-lived exchange fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'short_token', expires_in: 3600 }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: { message: 'Long lived failed' } }),
        });

      const result = await client.exchangeCode('test_code');
      expect(result.accessToken).toBe('short_token');
      expect(result.expiresInSeconds).toBe(3600);
    });

    it('should return long-lived token successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'short_token', expires_in: 3600 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'long_token', expires_in: 5184000 }),
        });

      const result = await client.exchangeCode('test_code');
      expect(result.accessToken).toBe('long_token');
      expect(result.expiresInSeconds).toBe(5184000);
    });
  });

  describe('getProfile', () => {
    it('should return profile correctly when an instagram business account is present', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'page1',
              name: 'Page 1',
            },
            {
              id: 'page2',
              name: 'Page 2',
              instagram_business_account: {
                id: 'ig123',
                username: 'my_ig_account',
                profile_picture_url: 'http://example.com/pic.jpg',
              }
            }
          ]
        })
      });

      const profile = await client.getProfile('some_token');
      expect(profile.platformAccountId).toBe('ig123');
      expect(profile.username).toBe('my_ig_account');
      expect(profile.profilePictureUrl).toBe('http://example.com/pic.jpg');
      expect(profile.metadata?.facebookPageId).toBe('page2');
    });

    it('should throw an error if no instagram business account is found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'page1',
              name: 'Page 1',
            }
          ]
        })
      });

      await expect(client.getProfile('some_token')).rejects.toThrow('No connected Instagram Professional account found on your Facebook Pages.');
    });
  });
});
