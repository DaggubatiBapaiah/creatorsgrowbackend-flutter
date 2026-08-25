-- 006_strict_state_machine_and_analytics.sql

-- 1. Enforce strict status on content_posts
ALTER TABLE content_posts DROP CONSTRAINT IF EXISTS chk_content_posts_status;
ALTER TABLE content_posts 
ADD CONSTRAINT chk_content_posts_status 
CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled', 'reconnect_required'));

-- 2. Enforce safety lock for duplicate external_post_id
DROP INDEX IF EXISTS idx_content_posts_external_id;
CREATE UNIQUE INDEX idx_content_posts_external_id ON content_posts (external_post_id) WHERE external_post_id IS NOT NULL;

-- 3. Analytics table
CREATE TABLE IF NOT EXISTS post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES content_posts(id) ON DELETE CASCADE UNIQUE,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
