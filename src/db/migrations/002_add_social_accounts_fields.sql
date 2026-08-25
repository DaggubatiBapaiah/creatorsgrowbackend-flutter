-- 1. Create table if not exists (in case it doesn't exist locally/in test environment)
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(255) NOT NULL,
  platform_account_id VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  profile_picture_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'connected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (platform, platform_account_id)
);

-- 2. Add columns if table already existed but lacked them
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'connected';
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'social_accounts_platform_platform_account_id_key'
  ) THEN
    ALTER TABLE social_accounts ADD CONSTRAINT social_accounts_platform_platform_account_id_key UNIQUE (platform, platform_account_id);
  END IF;
END $$;