ALTER TABLE blood_requests
ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20);

ALTER TABLE blood_requests
ADD COLUMN IF NOT EXISTS patient_name VARCHAR(120);

ALTER TABLE blood_requests
ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE blood_requests
SET status = CASE
  WHEN status = 'open' THEN 'pending'
  WHEN status = 'matched' THEN 'active'
  ELSE status
END
WHERE status IN ('open', 'matched');

ALTER TABLE blood_requests
ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE blood_requests
DROP CONSTRAINT IF EXISTS blood_requests_status_check;

ALTER TABLE blood_requests
ADD CONSTRAINT blood_requests_status_check
CHECK (status IN ('pending', 'matching', 'active', 'fulfilled', 'cancelled'));

ALTER TABLE blood_requests
DROP CONSTRAINT IF EXISTS blood_requests_urgency_level_check;

ALTER TABLE blood_requests
ADD CONSTRAINT blood_requests_urgency_level_check
CHECK (
  urgency_level IS NULL
  OR urgency_level IN ('Critical', 'Urgent', 'Routine')
);

ALTER TABLE blood_requests
ALTER COLUMN search_radius_meters SET DEFAULT 3000;

DROP INDEX IF EXISTS idx_blood_requests_bg_status;

CREATE INDEX IF NOT EXISTS idx_blood_requests_status
ON blood_requests(status);

CREATE INDEX IF NOT EXISTS idx_blood_requests_hospital_id
ON blood_requests(hospital_id);

CREATE INDEX IF NOT EXISTS idx_blood_requests_hospital_status
ON blood_requests(hospital_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blood_requests_unique_active_per_hospital_bg
ON blood_requests(hospital_id, blood_group)
WHERE is_deleted = FALSE
  AND status IN ('pending', 'matching', 'active');
