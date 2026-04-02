CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  matching_radius INT NOT NULL DEFAULT 3000 CHECK (matching_radius > 0),
  cooldown_days INT NOT NULL DEFAULT 120 CHECK (cooldown_days > 0),
  max_donors_per_request INT NOT NULL DEFAULT 25 CHECK (max_donors_per_request > 0),
  sender_identity VARCHAR(150) NOT NULL DEFAULT 'Blood Donation System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_config (matching_radius, cooldown_days, max_donors_per_request, sender_identity)
SELECT 3000, 120, 25, 'Blood Donation System'
WHERE NOT EXISTS (SELECT 1 FROM system_config);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  actor JSONB NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS access_status VARCHAR(20) NOT NULL DEFAULT 'active'
CHECK (access_status IN ('active', 'deactivated', 'restricted'));

CREATE INDEX IF NOT EXISTS idx_system_config_updated_at
ON system_config(updated_at);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp
ON audit_log(timestamp);

CREATE INDEX IF NOT EXISTS idx_audit_log_action_entity
ON audit_log(action, entity);

CREATE INDEX IF NOT EXISTS idx_users_access_status
ON users(access_status);
