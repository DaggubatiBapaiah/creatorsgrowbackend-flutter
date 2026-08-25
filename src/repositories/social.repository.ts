import { pool } from '../config/db';

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: string;
  platform_account_id: string;
  username: string;
  profile_picture_url: string | null;
  access_token: string;
  refresh_token: string | null;
  expires_at: Date | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface OAuthState {
  state: string;
  user_id: string;
  platform: string;
  expires_at: Date;
  created_at: Date;
}

export class SocialRepository {
  async getAccountsByUserId(userId: string): Promise<SocialAccount[]> {
    const query = 'SELECT * FROM social_accounts WHERE user_id = $1 ORDER BY created_at DESC';
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  async findAccountByPlatformId(platform: string, platformAccountId: string): Promise<SocialAccount | null> {
    const query = 'SELECT * FROM social_accounts WHERE platform = $1 AND platform_account_id = $2';
    const { rows } = await pool.query(query, [platform.toUpperCase(), platformAccountId]);
    return rows[0] || null;
  }

  async findById(id: string): Promise<SocialAccount | null> {
    const query = 'SELECT * FROM social_accounts WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async createOrUpdateAccount(
    userId: string,
    platform: string,
    platformAccountId: string,
    username: string,
    profilePictureUrl: string | null,
    accessToken: string,
    refreshToken: string | null,
    expiresAt: Date | null,
    status: string = 'connected'
  ): Promise<SocialAccount> {
    const query = `
      INSERT INTO social_accounts (
        id, user_id, platform, platform_account_id, username, 
        profile_picture_url, access_token, refresh_token, expires_at, status, updated_at
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (platform, platform_account_id)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        username = EXCLUDED.username,
        profile_picture_url = EXCLUDED.profile_picture_url,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING *
    `;
    const values = [
      userId,
      platform.toUpperCase(),
      platformAccountId,
      username,
      profilePictureUrl,
      accessToken,
      refreshToken,
      expiresAt,
      status,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async deleteAccount(id: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM social_accounts WHERE id = $1 AND user_id = $2';
    const { rowCount } = await pool.query(query, [id, userId]);
    return (rowCount ?? 0) > 0;
  }

  // --- OAuth State Management ---

  async createOAuthState(state: string, userId: string, platform: string, expiresInMs: number): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresInMs);
    const query = 'INSERT INTO oauth_states (state, user_id, platform, expires_at) VALUES ($1, $2, $3, $4)';
    await pool.query(query, [state, userId, platform, expiresAt]);
  }

  /**
   * Retrieves and deletes the OAuth state atomically to ensure single-use.
   */
  async consumeOAuthState(state: string): Promise<OAuthState | null> {
    const query = 'DELETE FROM oauth_states WHERE state = $1 RETURNING *';
    const { rows } = await pool.query(query, [state]);
    return rows[0] || null;
  }
}
