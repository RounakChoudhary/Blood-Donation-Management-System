ALTER TABLE blood_requests
ADD COLUMN IF NOT EXISTS last_radius_expanded_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_blood_requests_last_radius_expanded_at
ON blood_requests(last_radius_expanded_at);
