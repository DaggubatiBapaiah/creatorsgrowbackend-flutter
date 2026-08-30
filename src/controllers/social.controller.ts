import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { SocialRepository } from '../repositories/social.repository';
import { EntitlementService } from '../services/billing/entitlement.service';
import { UnauthorizedError, ValidationError } from '../utils/errors';
import { encrypt } from '../utils/crypto';
import { OAuthClientFactory } from '../services/oauth/oauth-client.factory';

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

  connect = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const entitlementService = new EntitlementService();
      const withinLimit = await entitlementService.checkAccountLimit(userId);
      if (!withinLimit) {
        res.status(403).json({ error: { message: 'Social accounts limit reached for your plan. Please upgrade.' } });
        return;
      }
    } catch (e) {
      return next(e);
    }
    try {
      const userId = req.user!.id;
      const { platform } = req.params;

      const client = OAuthClientFactory.getClient(platform);

      const state = crypto.randomBytes(32).toString('hex');
      
      await this.socialRepository.createOAuthState(state, userId, platform.toUpperCase(), 10 * 60 * 1000);

      const authUrl = client.getAuthUrl(state);
      return res.status(200).json({ authUrl });
    } catch (error) {
      next(error);
    }
  };

  callback = async (req: Request, res: Response, next: NextFunction) => {
    const requestId = crypto.randomBytes(4).toString('hex');
    console.log(`[OAuth Callback] [${requestId}] START platform=${req.params.platform}`);
    
    try {
      const { platform } = req.params;
      const { code, state, error, error_description } = req.query;

      console.log(`[OAuth Callback] [${requestId}] Query Code received: ${!!code}`);
      console.log(`[OAuth Callback] [${requestId}] Query State received: ${!!state}`);
      console.log(`[OAuth Callback] [${requestId}] Query Error received: ${!!error}`);
      console.log(`[OAuth Callback] [${requestId}] Server Canonical redirect_uri: ${env.META_REDIRECT_URI}`);

      if (error) {
        return res.status(400).send(`<h1>Connection Failed</h1><p>${error_description || 'OAuth connection request was cancelled or denied.'}</p>`);
      }

      if (!code || !state) {
        return res.status(400).send('<h1>Bad Request</h1><p>Missing authorization code or verification state.</p>');
      }

      const originalCodeStr = code as string;
      const hasHashSuffix = originalCodeStr.endsWith('#_');
      const sanitizedCode = originalCodeStr.replace(/#_$/, '');
      console.log(`[OAuth Callback] [${requestId}] Code Length: ${originalCodeStr.length}`);
      console.log(`[OAuth Callback] [${requestId}] Has Hash Suffix: ${hasHashSuffix}`);
      console.log(`[OAuth Callback] [${requestId}] Sanitized Code Length: ${sanitizedCode.length}`);

      const oauthState = await this.socialRepository.consumeOAuthState(state as string);
      
      if (!oauthState) {
        return res.status(400).send('<h1>Security Validation Failed</h1><p>Invalid or already used OAuth state parameter.</p>');
      }

      const isMetaGroup = (platform.toUpperCase() === 'META' || platform.toUpperCase() === 'INSTAGRAM' || platform.toUpperCase() === 'FACEBOOK') &&
                          (oauthState.platform === 'META' || oauthState.platform === 'INSTAGRAM' || oauthState.platform === 'FACEBOOK');

      if (!isMetaGroup && oauthState.platform !== platform.toUpperCase()) {
        return res.status(400).send('<h1>Security Validation Failed</h1><p>Invalid or already used OAuth state parameter.</p>');
      }

      if (new Date() > oauthState.expires_at) {
        return res.status(400).send('<h1>Security Validation Failed</h1><p>OAuth state has expired. Please try connecting again.</p>');
      }

      const userId = oauthState.user_id;
      const client = OAuthClientFactory.getClient(platform);
      
      console.log(`[OAuth Callback] [${requestId}] Starting Token Exchange`);
      // We pass the exact sanitized code to the client
      const tokenData = await client.exchangeCode(sanitizedCode);
      console.log(`[OAuth Callback] [${requestId}] Token Exchange Success`);
      
      const profile = await client.getProfile(tokenData.accessToken);
      console.log(`[OAuth Callback] [${requestId}] Profile Fetch Success`);

      const encryptedToken = encrypt(tokenData.accessToken);
      const encryptedRefreshToken = tokenData.refreshToken ? encrypt(tokenData.refreshToken) : null;

      let expiresAt: Date | null = null;
      if (tokenData.expiresInSeconds) {
        expiresAt = new Date(Date.now() + tokenData.expiresInSeconds * 1000);
      }

      await this.socialRepository.createOrUpdateAccount(
        userId,
        oauthState.platform.toUpperCase() === 'META' ? 'INSTAGRAM' : oauthState.platform.toUpperCase(),
        profile.platformAccountId,
        profile.username,
        profile.profilePictureUrl,
        encryptedToken,
        encryptedRefreshToken,
        expiresAt,
        'connected',
        profile.metadata
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
            <div class="icon">âœ“</div>
            <h1>Connection Successful!</h1>
            <p>Your social account has been connected successfully.</p>
            <p>You can now close this browser tab and return to the application.</p>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('[OAuth Callback Error]', error);
      res.status(500).send(`<h1>OAuth Failed</h1><p>${error instanceof Error ? error.message : 'Unknown error'}</p>`);
    }
  };

  private parseSignedRequest(signedRequest: string, secret: string) {
    try {
      const [encodedSig, payload] = signedRequest.split('.', 2);
      const decodedPayload = Buffer.from(payload, 'base64url').toString('utf8');
      return JSON.parse(decodedPayload);
    } catch {
      return null;
    }
  }

  metaDeauthorize = async (req: Request, res: Response) => {
    try {
      console.log('[Meta Webhook] Deauthorize request received');
      const { signed_request } = req.body;
      if (!signed_request) {
        return res.status(400).send('Missing signed_request');
      }

      const payload = this.parseSignedRequest(signed_request, env.INSTAGRAM_APP_SECRET || env.META_APP_SECRET);
      if (payload && payload.user_id) {
        // Meta user_id maps to our platform_account_id
        await this.socialRepository.deleteAccountByPlatformId('INSTAGRAM', payload.user_id);
        console.log(`[Meta Webhook] Successfully deauthorized and deleted IG account ${payload.user_id}`);
      }
      
      // Meta expects a 200 response
      return res.status(200).send('OK');
    } catch (error) {
      console.error('[Meta Webhook] Deauthorize Error:', error);
      return res.status(500).send('Internal Error');
    }
  };

  metaDataDeletion = async (req: Request, res: Response) => {
    try {
      console.log('[Meta Webhook] Data Deletion request received');
      const { signed_request } = req.body;
      if (!signed_request) {
        return res.status(400).send('Missing signed_request');
      }

      let confirmationCode = 'N/A';
      let statusUrl = 'N/A';

      const payload = this.parseSignedRequest(signed_request, env.INSTAGRAM_APP_SECRET || env.META_APP_SECRET);
      if (payload && payload.user_id) {
        await this.socialRepository.deleteAccountByPlatformId('INSTAGRAM', payload.user_id);
        
        confirmationCode = crypto.randomBytes(8).toString('hex');
        statusUrl = `${env.META_REDIRECT_URI.replace('/api/v1/auth/meta/callback', '')}/data-deletion-status?code=${confirmationCode}`;
        
        console.log(`[Meta Webhook] Successfully processed data deletion for IG account ${payload.user_id}`);
      }

      return res.status(200).json({
        url: statusUrl,
        confirmation_code: confirmationCode
      });
    } catch (error) {
      console.error('[Meta Webhook] Data Deletion Error:', error);
      return res.status(500).send('Internal Error');
    }
  };
}

