ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users
SET
  email_verified = TRUE,
  is_active = TRUE
WHERE created_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS otp_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL
    REFERENCES users(id) ON DELETE CASCADE,
  purpose VARCHAR(50) NOT NULL DEFAULT 'email_verification'
    CHECK (purpose IN ('email_verification')),
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_tokens_user_purpose
ON otp_tokens(user_id, purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_otp_tokens_expires_at
ON otp_tokens(expires_at);
