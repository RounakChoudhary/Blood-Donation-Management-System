ALTER TABLE users
ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0
CHECK (failed_login_attempts >= 0);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMPTZ;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0
CHECK (failed_login_attempts >= 0);

ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMPTZ;

ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  actor_type VARCHAR(20) NOT NULL
    CHECK (actor_type IN ('user', 'hospital')),
  user_or_hospital_id INT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_locked_until
ON users(locked_until);

CREATE INDEX IF NOT EXISTS idx_hospitals_locked_until
ON hospitals(locked_until);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at
ON password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_actor_lookup
ON password_reset_tokens(actor_type, user_or_hospital_id, created_at DESC);
