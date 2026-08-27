-- Create Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan_code VARCHAR(50) NOT NULL DEFAULT 'free',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    razorpay_subscription_id VARCHAR(255) UNIQUE,
    current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '30 days',
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Webhook Logs Table for Idempotence / Duplicate Protection
CREATE TABLE IF NOT EXISTS razorpay_webhook_logs (
    id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Trigger function to automatically create a FREE subscription on user creation
CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscriptions (user_id, plan_code, status, current_period_start, current_period_end)
    VALUES (NEW.id, 'free', 'active', NOW(), NOW() + INTERVAL '30 days')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_user_signup_create_subscription
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user_subscription();

-- Ensure all existing users have a free subscription
INSERT INTO subscriptions (user_id, plan_code, status, current_period_start, current_period_end)
SELECT id, 'free', 'active', NOW(), NOW() + INTERVAL '30 days' FROM users
ON CONFLICT (user_id) DO NOTHING;
