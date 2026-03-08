ALTER TABLE users
DROP COLUMN IF EXISTS whatsapp_phone;

ALTER TABLE users
DROP COLUMN IF EXISTS whatsapp_opt_in;

ALTER TABLE users
DROP COLUMN IF EXISTS whatsapp_opt_in_at;