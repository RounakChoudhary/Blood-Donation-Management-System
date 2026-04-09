CREATE TABLE IF NOT EXISTS blood_bank_inventory_batches (
  id SERIAL PRIMARY KEY,
  blood_bank_id INT NOT NULL
    REFERENCES blood_banks(id) ON DELETE CASCADE,
  blood_group blood_group_enum NOT NULL,
  units_available INT NOT NULL
    CHECK (units_available >= 0),
  expiry_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blood_bank_inventory_batches_bank_id
ON blood_bank_inventory_batches(blood_bank_id);

CREATE INDEX IF NOT EXISTS idx_blood_bank_inventory_batches_group
ON blood_bank_inventory_batches(blood_group);

CREATE INDEX IF NOT EXISTS idx_blood_bank_inventory_batches_expiry
ON blood_bank_inventory_batches(expiry_date);
