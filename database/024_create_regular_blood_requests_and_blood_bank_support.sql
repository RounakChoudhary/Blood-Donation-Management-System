CREATE TABLE IF NOT EXISTS regular_blood_requests (
  id SERIAL PRIMARY KEY,
  hospital_id INT NOT NULL
    REFERENCES hospitals(id) ON DELETE CASCADE,
  blood_group blood_group_enum NOT NULL,
  units_required INT NOT NULL CHECK (units_required > 0),
  required_date DATE NOT NULL,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'notified', 'fulfilled', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regular_blood_request_notifications (
  id SERIAL PRIMARY KEY,
  regular_request_id INT NOT NULL
    REFERENCES regular_blood_requests(id) ON DELETE CASCADE,
  blood_bank_id INT NOT NULL
    REFERENCES blood_banks(id) ON DELETE CASCADE,
  recipient_email VARCHAR(150),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regular_blood_requests_hospital_id
ON regular_blood_requests(hospital_id);

CREATE INDEX IF NOT EXISTS idx_regular_blood_requests_required_date
ON regular_blood_requests(required_date);

CREATE INDEX IF NOT EXISTS idx_regular_blood_requests_status
ON regular_blood_requests(status);

CREATE INDEX IF NOT EXISTS idx_regular_request_notifications_request_id
ON regular_blood_request_notifications(regular_request_id);

CREATE INDEX IF NOT EXISTS idx_regular_request_notifications_blood_bank_id
ON regular_blood_request_notifications(blood_bank_id);
