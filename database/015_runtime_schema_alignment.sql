ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE blood_banks
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE blood_requests
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'open'
CHECK (status IN ('open', 'matched', 'fulfilled', 'cancelled'));

ALTER TABLE blood_requests
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_is_deleted
ON users(is_deleted);

CREATE INDEX IF NOT EXISTS idx_hospitals_is_deleted
ON hospitals(is_deleted);

CREATE INDEX IF NOT EXISTS idx_blood_banks_is_deleted
ON blood_banks(is_deleted);

CREATE INDEX IF NOT EXISTS idx_blood_requests_is_deleted
ON blood_requests(is_deleted);

CREATE INDEX IF NOT EXISTS idx_blood_requests_hospital_status
ON blood_requests(hospital_id, status);
