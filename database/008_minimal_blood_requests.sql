ALTER TABLE blood_requests
ADD COLUMN IF NOT EXISTS search_radius_meters INT NOT NULL DEFAULT 5000
CHECK (search_radius_meters > 0);

-- only run these if these columns currently exist and you truly want to remove them
ALTER TABLE blood_requests DROP COLUMN IF EXISTS patient_name;
ALTER TABLE blood_requests DROP COLUMN IF EXISTS notes;
ALTER TABLE blood_requests DROP COLUMN IF EXISTS status;