-- 029_add_system_config_bcrypt.sql
-- Compatibility migration for historical bcrypt_rounds config work.
--
-- Earlier drafts expected a key/value style system_config schema. The
-- released schema uses fixed typed columns instead, so a clean deployment
-- must treat this migration as a safe no-op unless those legacy columns
-- exist.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'system_config'
      AND column_name = 'key'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'system_config'
      AND column_name = 'value'
  ) THEN
    INSERT INTO system_config (key, value, description)
    VALUES ('bcrypt_rounds', '12', 'Number of rounds for bcrypt hashing')
    ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;
