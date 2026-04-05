-- 026_add_audit_log_action_type.sql
-- Adds action_type column to audit_log table for detailed logging as per SRS.

ALTER TABLE audit_log
ADD COLUMN IF NOT EXISTS action_type VARCHAR(50);

-- Optional: Add index for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_action_type
ON audit_log(action_type);