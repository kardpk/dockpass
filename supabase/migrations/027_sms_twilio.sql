-- =============================================
-- Migration 027: SMS via Twilio Infrastructure
--
-- Introduces the sms_log table and updates existing
-- tables to track SMS delivery and opt-in states.
-- =============================================

-- Add sms_opt_in to captains
ALTER TABLE captains ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN DEFAULT true;

-- Add tracking columns to trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS snapshot_sms_sent_at TIMESTAMPTZ;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS manifest_emailed_at TIMESTAMPTZ;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS manifest_sms_sent_at TIMESTAMPTZ;

-- Create sms_log table
CREATE TABLE IF NOT EXISTS sms_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID REFERENCES trips(id),
  recipient_type  TEXT NOT NULL CHECK (recipient_type IN ('captain','operator','guest')),
  recipient_phone TEXT NOT NULL,
  message_body    TEXT NOT NULL,
  twilio_sid      TEXT,           -- Twilio message SID for delivery tracking
  event_type      TEXT NOT NULL,  -- 'snapshot_ready','trip_started','manifest', etc.
  delivered_at    TIMESTAMPTZ,    -- set by Twilio status webhook
  failed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_log_trip ON sms_log(trip_id);
CREATE INDEX IF NOT EXISTS idx_sms_log_twilio_sid ON sms_log(twilio_sid);

-- RLS Configuration for sms_log
ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;

-- Note: We assume Operators should be able to view their own SMS logs via trips relationship.
DROP POLICY IF EXISTS "sms_log_operator_view" ON sms_log;
CREATE POLICY "sms_log_operator_view" ON sms_log
  FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE operator_id = auth.uid()
    )
  );

COMMENT ON TABLE sms_log IS
  'Defensible legal record of SMS messages sent via Twilio (primarily Captain Snapshots and Manifest tracking).';
