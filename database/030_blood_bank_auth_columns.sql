-- Add authentication columns to blood_banks table
ALTER TABLE blood_banks
  ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;
