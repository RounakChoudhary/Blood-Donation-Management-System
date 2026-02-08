-- 001_init.sql
-- Base schema: PostGIS + enums + users + donors + hospitals

-- Enable PostGIS (safe to keep IF NOT EXISTS even in migrations)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Blood group enum
CREATE TYPE blood_group_enum AS ENUM (
  'A+','A-',
  'B+','B-',
  'AB+','AB-',
  'O+','O-'
);

-- USERS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,

  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,

  password_hash TEXT NOT NULL,

  location GEOGRAPHY(POINT, 4326),
  location_updated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_location
ON users USING GIST(location);

-- DONORS 
CREATE TABLE donors (
  id SERIAL PRIMARY KEY,

  user_id INT UNIQUE
    REFERENCES users(id) ON DELETE CASCADE,

  blood_group blood_group_enum NOT NULL,

  last_donation_date DATE,
  deferred_until DATE
);

CREATE INDEX idx_donors_blood
ON donors(blood_group);

-- HOSPITALS
CREATE TABLE hospitals (
  id SERIAL PRIMARY KEY,

  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,

  location GEOGRAPHY(POINT, 4326) NOT NULL,

  onboarding_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (onboarding_status IN ('pending','verified','rejected')),

  verified_at TIMESTAMPTZ,

  -- Optional login (after verification)
  email VARCHAR(150) UNIQUE,
  password_hash TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hospitals_location
ON hospitals USING GIST(location);

CREATE INDEX idx_hospitals_status
ON hospitals(onboarding_status);
