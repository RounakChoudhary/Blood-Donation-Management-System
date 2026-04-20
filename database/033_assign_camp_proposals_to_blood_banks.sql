ALTER TABLE blood_camps
ADD COLUMN IF NOT EXISTS assigned_blood_bank_id INT
REFERENCES blood_banks(id) ON DELETE SET NULL;

ALTER TABLE blood_camps
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

ALTER TABLE blood_camps
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_blood_camps_assigned_blood_bank_id
ON blood_camps(assigned_blood_bank_id);

CREATE INDEX IF NOT EXISTS idx_blood_camps_pending_assigned
ON blood_camps(assigned_blood_bank_id, approval_status, date)
WHERE assigned_blood_bank_id IS NOT NULL
  AND approval_status = 'pending';
