-- 029_add_system_config_bcrypt.sql
-- Adds system_config entry for bcrypt_rounds to make it configurable.

INSERT INTO system_config (key, value, description)
VALUES ('bcrypt_rounds', '12', 'Number of rounds for bcrypt hashing')
ON CONFLICT (key) DO NOTHING;