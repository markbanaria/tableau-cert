-- Add password_hash column to users table for credential-based authentication
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_hash text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- Add comment
COMMENT ON COLUMN public.users.password_hash IS 'Hashed password for credential-based authentication. NULL for OAuth/Email-only users.';
