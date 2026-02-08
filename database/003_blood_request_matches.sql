-- Stores which donors were matched/notified and their response

CREATE TABLE blood_request_matches (
  id SERIAL PRIMARY KEY,

  request_id INT NOT NULL
    REFERENCES blood_requests(id) ON DELETE CASCADE,

  donor_id INT NOT NULL
    REFERENCES donors(id) ON DELETE CASCADE,

  distance_meters INT NOT NULL CHECK (distance_meters >= 0),

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','notified','accepted','declined','no_response')),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (request_id, donor_id)
);

CREATE INDEX idx_matches_request
ON blood_request_matches(request_id);

CREATE INDEX idx_matches_donor
ON blood_request_matches(donor_id);

CREATE INDEX idx_matches_status
ON blood_request_matches(status);