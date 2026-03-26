ALTER TABLE email_log
ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0
CHECK (attempt_count >= 0);

ALTER TABLE email_log
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_email_log_last_attempt_at
ON email_log(last_attempt_at);
