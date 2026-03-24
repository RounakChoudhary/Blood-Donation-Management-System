-- 014_create_blood_camps.sql
-- FR 4.3.1 - FR 4.3.3 Blood Camp Management

CREATE TABLE IF NOT EXISTS blood_camps (
  id SERIAL PRIMARY KEY,

  name VARCHAR(150) NOT NULL,
  date DATE NOT NULL,
  time VARCHAR(50) NOT NULL,
  
  venue_name VARCHAR(150) NOT NULL,
  address TEXT NOT NULL,

  location GEOGRAPHY(POINT, 4326) NOT NULL,

  capacity INT,

  organiser_name VARCHAR(100) NOT NULL,
  organiser_phone VARCHAR(20) NOT NULL,
  organiser_email VARCHAR(150) NOT NULL,

  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','rejected')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for PostGIS proximity matching
CREATE INDEX IF NOT EXISTS idx_blood_camps_location
ON blood_camps USING GIST(location);

-- Index for approval queries
CREATE INDEX IF NOT EXISTS idx_blood_camps_status
ON blood_camps(approval_status);

-- Index for date-based retrieval
CREATE INDEX IF NOT EXISTS idx_blood_camps_date
ON blood_camps(date);
