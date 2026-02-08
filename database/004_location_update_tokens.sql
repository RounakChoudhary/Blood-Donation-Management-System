-- For secure WhatsApp "Update location" links

CREATE TABLE location_update_tokens (
  id SERIAL PRIMARY KEY,

  user_id INT NOT NULL
    REFERENCES users(id) ON DELETE CASCADE,

  token TEXT UNIQUE NOT NULL,

  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_location_tokens_user
ON location_update_tokens(user_id);