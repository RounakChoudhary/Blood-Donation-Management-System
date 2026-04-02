ALTER TABLE donors
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

ALTER TABLE donors
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE donors
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100);

ALTER TABLE donors
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);

CREATE TABLE IF NOT EXISTS donation_records (
  id SERIAL PRIMARY KEY,
  donor_id INT NOT NULL
    REFERENCES donors(id) ON DELETE CASCADE,
  hospital_id INT NOT NULL
    REFERENCES hospitals(id) ON DELETE CASCADE,
  blood_group blood_group_enum NOT NULL,
  units INT NOT NULL CHECK (units > 0),
  donation_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donation_records_donor_id
ON donation_records(donor_id);

CREATE INDEX IF NOT EXISTS idx_donation_records_hospital_id
ON donation_records(hospital_id);

CREATE INDEX IF NOT EXISTS idx_donation_records_donation_date
ON donation_records(donation_date);
