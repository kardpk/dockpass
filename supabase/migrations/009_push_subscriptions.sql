-- Migration 009: Push Subscriptions
-- Enables web push notifications for guests and operators across multiple browsers

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT UNIQUE NOT NULL,
    keys JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Target context
    target_type TEXT NOT NULL CHECK (target_type IN ('guest', 'operator', 'captain')),
    target_id UUID NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for speedy queries when pushing to a target
CREATE INDEX IF NOT EXISTS push_subs_target_idx
  ON push_subscriptions (target_type, target_id)
  WHERE is_active = true;

-- Optional: Since we insert blindly from service workers relying on auth/context payloads,
-- we'll rely on the RLS policies or service role for upserts.

-- RLS: We can keep it simple because writes go through /api/push/subscription (trusted server)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow operators to read their own Subscriptions natively if needed
CREATE POLICY "Operators can read own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (target_type = 'operator' AND target_id = auth.uid());
