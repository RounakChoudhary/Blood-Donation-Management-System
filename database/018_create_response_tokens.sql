CREATE TABLE IF NOT EXISTS response_tokens (
  id SERIAL PRIMARY KEY,
  match_id INT NOT NULL
    REFERENCES blood_request_matches(id) ON DELETE CASCADE,
  donor_id INT NOT NULL
    REFERENCES donors(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_response_tokens_match_donor
ON response_tokens(match_id, donor_id);

CREATE INDEX IF NOT EXISTS idx_response_tokens_expires_at
ON response_tokens(expires_at);

ALTER TABLE donors
DROP CONSTRAINT IF EXISTS donors_availability_status_check;

ALTER TABLE donors
ADD CONSTRAINT donors_availability_status_check
CHECK (availability_status IN ('available', 'paused', 'busy', 'unavailable'));
