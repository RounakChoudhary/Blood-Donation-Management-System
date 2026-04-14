ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);

ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);

ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS hospital_type VARCHAR(20);

ALTER TABLE hospitals
DROP CONSTRAINT IF EXISTS hospitals_hospital_type_check;

ALTER TABLE hospitals
ADD CONSTRAINT hospitals_hospital_type_check
CHECK (
  hospital_type IS NULL
  OR hospital_type IN ('Government', 'Private', 'Trust')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hospitals_license_number_unique
ON hospitals (license_number)
WHERE license_number IS NOT NULL;
