-- 007_analytics_snapshots.sql

-- Safely drop old mock table if it exists
DROP TABLE IF EXISTS post_analytics CASCADE;

-- Create Account-level snapshots
CREATE TABLE IF NOT EXISTS social_account_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE,
  followers_count INTEGER DEFAULT 0,
  reach_24h INTEGER DEFAULT 0,
  impressions_24h INTEGER DEFAULT 0,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Create a unique constraint for the day to prevent duplicate polling noise if needed
  -- but we want time-series, so simple index on collected_at is fine.
  CONSTRAINT uq_social_account_snapshot_time UNIQUE (social_account_id, collected_at)
);

CREATE INDEX IF NOT EXISTS idx_social_account_snapshots_collected_at ON social_account_snapshots (social_account_id, collected_at DESC);

-- Create Post-level snapshots
CREATE TABLE IF NOT EXISTS content_post_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES content_posts(id) ON DELETE CASCADE,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  saved INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,4) DEFAULT 0.0000, -- e.g., 0.0125 for 1.25%
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT uq_content_post_snapshot_time UNIQUE (post_id, collected_at)
);

CREATE INDEX IF NOT EXISTS idx_content_post_snapshots_collected_at ON content_post_snapshots (post_id, collected_at DESC);
