-- 012_notifications.sql
--
-- Prime feature: real-time issue alerts to a phone via SMS or WhatsApp.
-- A single verified destination number per org. Verification is handled by
-- Twilio Verify; we only persist the phone, chosen channel, and verified flag.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS notify_phone    TEXT,
  ADD COLUMN IF NOT EXISTS notify_channel  TEXT
    CHECK (notify_channel IN ('sms', 'whatsapp')),
  ADD COLUMN IF NOT EXISTS notify_verified BOOLEAN NOT NULL DEFAULT false;

-- notify_phone/channel are set when a manager starts verification; notify_verified
-- only flips true once the Twilio code is confirmed. Issue alerts require all three.
