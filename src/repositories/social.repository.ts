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
  metadata: Record<string, any> | null;
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
    console.log('[DB FORENSIC] GET ACCOUNTS START');
    console.log(`[DB FORENSIC] user_id = ${userId}`);
    const query = 'SELECT * FROM social_accounts WHERE user_id = $1 ORDER BY created_at DESC';
    const { rows } = await pool.query(query, [userId]);
    console.log(`[DB FORENSIC] rows returned = ${rows.length}`);
    if (rows.length > 0) {
      console.log(`[DB FORENSIC] platforms = ${rows.map(r => r.platform).join(', ')}`);
      console.log(`[DB FORENSIC] usernames = ${rows.map(r => r.username).join(', ')}`);
    }
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
    status: string = 'connected',
    metadata: Record<string, any> | null = null
  ): Promise<SocialAccount> {
    console.log('[DB FORENSIC] createOrUpdateAccount START');
    console.log(`[DB FORENSIC] user_id = ${userId}`);
    console.log(`[DB FORENSIC] platform = ${platform.toUpperCase()}`);
    console.log(`[DB FORENSIC] platform_account_id = ${platformAccountId}`);
    console.log(`[DB FORENSIC] username = ${username}`);

    const query = `
      INSERT INTO social_accounts (
        id, user_id, platform, platform_account_id, username, 
        profile_picture_url, access_token, refresh_token, expires_at, status, metadata, updated_at
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (platform, platform_account_id)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        username = EXCLUDED.username,
        profile_picture_url = EXCLUDED.profile_picture_url,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        status = EXCLUDED.status,
        metadata = EXCLUDED.metadata,
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
      metadata,
    ];
    
    try {
      const { rows } = await pool.query(query, values);
      const row = rows[0];
      console.log('[DB FORENSIC] INSERT/UPDATE SUCCESS');
      console.log(`[DB FORENSIC] returned row id = ${row.id}`);
      console.log(`[DB FORENSIC] returned user_id = ${row.user_id}`);
      console.log(`[DB FORENSIC] returned platform = ${row.platform}`);
      
      // IMMEDIATE POST-SAVE READ
      console.log('[DB FORENSIC] POST-SAVE READ START');
      const verifyQuery = 'SELECT * FROM social_accounts WHERE user_id = $1 ORDER BY created_at DESC';
      const verifyRes = await pool.query(verifyQuery, [userId]);
      console.log(`[DB FORENSIC] rows found = ${verifyRes.rows.length}`);
      if (verifyRes.rows.length > 0) {
        console.log(`[DB FORENSIC] returned user_id = ${verifyRes.rows[0].user_id}`);
        console.log(`[DB FORENSIC] returned platform = ${verifyRes.rows[0].platform}`);
        console.log(`[DB FORENSIC] returned username = ${verifyRes.rows[0].username}`);
      }
      
      return row;
    } catch (error: any) {
      console.log('[DB FORENSIC] INSERT/UPDATE FAILED');
      console.log(`[DB FORENSIC] error type = ${error.name}`);
      console.log(`[DB FORENSIC] error code = ${error.code}`);
      console.log(`[DB FORENSIC] error message = ${error.message}`);
      throw error;
    }
  }

  async deleteAccount(id: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM social_accounts WHERE id = $1 AND user_id = $2';
    const { rowCount } = await pool.query(query, [id, userId]);
    return (rowCount ?? 0) > 0;
  }

  async deleteAccountByPlatformId(platform: string, platformAccountId: string): Promise<boolean> {
    const query = 'DELETE FROM social_accounts WHERE platform = $1 AND platform_account_id = $2';
    const { rowCount } = await pool.query(query, [platform.toUpperCase(), platformAccountId]);
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
