-- 032_add_api_notifications_blood_inventory_and_request_status.sql

-- Extend existing notifications for in-app user notifications.
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS message TEXT;

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
ON notifications(user_id);

-- Create a simple blood inventory table for API inventory read/update.
CREATE TABLE IF NOT EXISTS blood_inventory (
  id SERIAL PRIMARY KEY,
  hospital_id INT NOT NULL,
  blood_group blood_group_enum NOT NULL,
  units_available INT NOT NULL CHECK (units_available >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blood_inventory_hospital_group
ON blood_inventory(hospital_id, blood_group);

-- Allow additional request statuses for basic tracking.
ALTER TABLE blood_requests
DROP CONSTRAINT IF EXISTS blood_requests_status_check;

ALTER TABLE blood_requests
ADD CONSTRAINT blood_requests_status_check
CHECK (status IN ('pending', 'matching', 'active', 'fulfilled', 'cancelled', 'accepted', 'completed'));
