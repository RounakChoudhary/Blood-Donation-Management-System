-- 002_blood_requests.sql
-- Blood requests table + indexes

CREATE TABLE blood_requests (
  id SERIAL PRIMARY KEY,

  hospital_id INT NOT NULL
    REFERENCES hospitals(id) ON DELETE CASCADE,

  blood_group blood_group_enum NOT NULL,
  units_required INT NOT NULL CHECK (units_required > 0),

  -- where blood is needed (often hospital itself, or ward address)
  location GEOGRAPHY(POINT, 4326) NOT NULL,

  patient_name VARCHAR(120),
  notes TEXT,

  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','matched','fulfilled','cancelled')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Geo index for distance / radius queries
CREATE INDEX idx_blood_requests_location
ON blood_requests USING GIST(location);

-- Useful for filtering lists
CREATE INDEX idx_blood_requests_status
ON blood_requests(status);

-- Useful for "open A+ requests" style queries
CREATE INDEX idx_blood_requests_bg_status
ON blood_requests(blood_group, status);
