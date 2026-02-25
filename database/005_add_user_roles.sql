ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'donor'
CHECK (role IN ('donor', 'admin'));