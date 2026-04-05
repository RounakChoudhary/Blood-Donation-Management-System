-- 027_add_otp_expires_index.sql
-- Adds index on otp_tokens.expires_at for efficient cleanup queries.

CREATE INDEX IF NOT EXISTS idx_otp_expires
ON otp_tokens(expires_at);