ALTER TABLE blood_request_matches
ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

ALTER TABLE blood_request_matches
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

ALTER TABLE blood_request_matches
ADD COLUMN IF NOT EXISTS response_channel VARCHAR(20)
CHECK (response_channel IS NULL OR response_channel = 'email');

ALTER TABLE email_log
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_email_log_retry_scan
ON email_log(status, next_retry_at)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_response_tokens_pending_cleanup
ON response_tokens(expires_at, used)
WHERE used = FALSE;

CREATE INDEX IF NOT EXISTS idx_blood_request_matches_pending_response_cleanup
ON blood_request_matches(status, notified_at, responded_at)
WHERE status IN ('pending', 'notified');
