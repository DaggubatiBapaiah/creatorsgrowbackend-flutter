-- 1. Media Kit Configurations Table
CREATE TABLE IF NOT EXISTS media_kit_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  custom_bio TEXT,
  contact_email TEXT,
  show_instagram BOOLEAN DEFAULT TRUE,
  show_tiktok BOOLEAN DEFAULT TRUE,
  rates JSONB DEFAULT '[]'::jsonb, -- Array of { service: string, rate: number }
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Brand Deal CRM Table
CREATE TABLE IF NOT EXISTS brand_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_name VARCHAR(255) NOT NULL,
  deal_value DECIMAL(10,2) DEFAULT 0.00,
  stage VARCHAR(50) CHECK (stage IN ('pitching', 'negotiating', 'signed', 'completed', 'paid')),
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  notes TEXT,
  associated_post_id UUID REFERENCES content_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);