UPDATE notifications
SET channel = 'email'
WHERE channel IS DISTINCT FROM 'email';

UPDATE notifications
SET status = CASE
  WHEN status = 'sent' THEN 'sent'
  WHEN status = 'failed' THEN 'failed'
  ELSE 'pending'
END;

ALTER TABLE notifications
ALTER COLUMN channel SET DEFAULT 'email';

ALTER TABLE notifications
ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_channel_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_channel_check
CHECK (channel = 'email');

ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_status_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_status_check
CHECK (status IN ('pending', 'sent', 'failed'));

CREATE TABLE IF NOT EXISTS email_log (
  id SERIAL PRIMARY KEY,
  notification_id INT
    REFERENCES notifications(id) ON DELETE SET NULL,
  match_id INT NOT NULL
    REFERENCES blood_request_matches(id) ON DELETE CASCADE,
  recipient_email VARCHAR(150) NOT NULL,
  template_name VARCHAR(100),
  provider_message_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  payload JSONB,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_log_match_id
ON email_log(match_id);

CREATE INDEX IF NOT EXISTS idx_email_log_status
ON email_log(status);

CREATE INDEX IF NOT EXISTS idx_email_log_provider_message_id
ON email_log(provider_message_id);
