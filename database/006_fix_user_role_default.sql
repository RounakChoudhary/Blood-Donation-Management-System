ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ALTER COLUMN role SET DEFAULT 'user';

UPDATE users
SET role = 'user'
WHERE role NOT IN ('user', 'admin');

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('user', 'admin'));
