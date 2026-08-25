import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { SocialRepository } from '../repositories/social.repository';
import { UnauthorizedError, ValidationError } from '../utils/errors';
import { encrypt } from '../utils/crypto';
import { metaOAuthClient } from '../services/oauth/meta.client';

export class SocialController {
  private socialRepository = new SocialRepository();

  getAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const accounts = await this.socialRepository.getAccountsByUserId(userId);
      
      const safeAccounts = accounts.map((acc) => ({
        id: acc.id,
        platform: acc.platform.toLowerCase(),
        accountName: acc.username,
        platformAccountId: acc.platform_account_id,
        profileImageUrl: acc.profile_picture_url,
        status: acc.status,
      }));

      return res.status(200).json({ accounts: safeAccounts });
    } catch (error) {
      next(error);
    }
  };

  disconnectAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const deleted = await this.socialRepository.deleteAccount(id, userId);
      if (!deleted) {
        throw new ValidationError('Account not found or access denied');
      }

      return res.status(200).json({ status: 'ok', message: 'Account disconnected successfully.' });
    } catch (error) {
      next(error);
    }
  };

  metaConnect = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      // Generate 32-byte secure random state
      const state = crypto.randomBytes(32).toString('hex');
      
      // Store in DB, expires in 10 minutes (600,000 ms)
      await this.socialRepository.createOAuthState(state, userId, 'META', 10 * 60 * 1000);

      // Meta OAuth Dialog url
      const metaAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${env.META_APP_ID}&redirect_uri=${encodeURIComponent(env.META_REDIRECT_URI)}&state=${state}&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement`;

      return res.status(200).json({ authUrl: metaAuthUrl });
    } catch (error) {
      next(error);
    }
  };

  metaCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, state, error, error_description } = req.query;

      if (error) {
        return res.status(400).send(`<h1>Connection Failed</h1><p>${error_description || 'OAuth connection request was cancelled or denied.'}</p>`);
      }

      if (!code || !state) {
        return res.status(400).send('<h1>Bad Request</h1><p>Missing authorization code or verification state.</p>');
      }

      // Atomically consume state (Single-Use Validation)
      const oauthState = await this.socialRepository.consumeOAuthState(state as string);
      
      if (!oauthState) {
        return res.status(400).send('<h1>Security Validation Failed</h1><p>Invalid or already used OAuth state parameter.</p>');
      }

      if (new Date() > oauthState.expires_at) {
        return res.status(400).send('<h1>Security Validation Failed</h1><p>OAuth state has expired. Please try connecting again.</p>');
      }

      const userId = oauthState.user_id;

      // Exchange code and get profile using the MetaOAuthClient
      const tokenData = await metaOAuthClient.exchangeCode(code as string);
      const profile = await metaOAuthClient.getProfile(tokenData.accessToken);

      // Encrypt sensitive access token before saving
      const encryptedToken = encrypt(tokenData.accessToken);

      let expiresAt: Date | null = null;
      if (tokenData.expiresInSeconds) {
        expiresAt = new Date(Date.now() + tokenData.expiresInSeconds * 1000);
      }

      // Create connection record
      await this.socialRepository.createOrUpdateAccount(
        userId,
        'INSTAGRAM',
        profile.platformAccountId,
        profile.username,
        profile.profilePictureUrl,
        encryptedToken,
        null, // refresh token not supported by this basic flow
        expiresAt,
        'connected',
        { facebookPageId: profile.facebookPageId }
      );

      res.setHeader('Content-Type', 'text/html');
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Connection Successful</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              background-color: #0F172A;
              color: #F8FAFC;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 24px;
              text-align: center;
            }
            .card {
              background-color: #1E293B;
              border-radius: 16px;
              padding: 32px;
              max-width: 400px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            h1 {
              color: #10B981;
              font-size: 24px;
              margin-top: 16px;
              margin-bottom: 8px;
            }
            p {
              color: #94A3B8;
              font-size: 16px;
              line-height: 1.5;
            }
            .icon {
              font-size: 64px;
              color: #10B981;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h1>Connection Successful!</h1>
            <p>Your social account has been connected successfully.</p>
            <p>You can now close this browser tab and return to the application.</p>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      next(error);
    }
  };
}
