
-- Add user status enum
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
