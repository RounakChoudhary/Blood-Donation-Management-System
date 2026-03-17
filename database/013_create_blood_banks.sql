-- 013_create_blood_banks.sql
-- FR 4.1.2 Blood Bank Registration

CREATE TABLE IF NOT EXISTS blood_banks (
  id SERIAL PRIMARY KEY,

  name VARCHAR(150) NOT NULL,
  license_number VARCHAR(100) UNIQUE NOT NULL,
  address TEXT NOT NULL,

  location GEOGRAPHY(POINT, 4326) NOT NULL,

  contact_person VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  
  operating_hours VARCHAR(100),
  facilities TEXT,

  onboarding_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (onboarding_status IN ('pending','verified','rejected')),

  verified_at TIMESTAMPTZ,

  -- Optional login fields (after verification)
  email VARCHAR(150) UNIQUE,
  password_hash TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blood_banks_location
ON blood_banks USING GIST(location);

CREATE INDEX IF NOT EXISTS idx_blood_banks_status
ON blood_banks(onboarding_status);
