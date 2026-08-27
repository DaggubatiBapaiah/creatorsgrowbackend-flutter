CREATE TABLE IF NOT EXISTS engagement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_avatar_url TEXT,
    content TEXT NOT NULL,
    external_id VARCHAR(255) NOT NULL UNIQUE,
    parent_external_id VARCHAR(255),
    post_external_id VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_replied BOOLEAN NOT NULL DEFAULT FALSE,
    like_count INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engagement_user ON engagement_items(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_account ON engagement_items(social_account_id);
CREATE INDEX IF NOT EXISTS idx_engagement_platform ON engagement_items(platform);
CREATE INDEX IF NOT EXISTS idx_engagement_read ON engagement_items(is_read);
CREATE INDEX IF NOT EXISTS idx_engagement_parent ON engagement_items(parent_external_id);
