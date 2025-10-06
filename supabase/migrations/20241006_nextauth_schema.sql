-- Create NextAuth.js schema and tables
-- This migration creates the required tables for NextAuth.js with Supabase adapter

-- Create the auth schema tables in the public schema
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text,
    email text UNIQUE,
    email_verified timestamptz,
    image text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    provider text NOT NULL,
    provider_account_id text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at bigint,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS public.sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token text UNIQUE NOT NULL,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    expires timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.verification_tokens (
    identifier text NOT NULL,
    token text UNIQUE NOT NULL,
    expires timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (identifier, token)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_session_token_idx ON public.sessions(session_token);
CREATE INDEX IF NOT EXISTS verification_tokens_identifier_idx ON public.verification_tokens(identifier);
CREATE INDEX IF NOT EXISTS verification_tokens_token_idx ON public.verification_tokens(token);

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for NextAuth.js adapter
-- Users can read their own data
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Accounts policies
CREATE POLICY "Users can view their own accounts" ON public.accounts
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Sessions policies
CREATE POLICY "Users can view their own sessions" ON public.sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Allow service role to manage all tables
CREATE POLICY "Service role can manage users" ON public.users
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage accounts" ON public.accounts
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage sessions" ON public.sessions
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage verification tokens" ON public.verification_tokens
    USING (auth.jwt() ->> 'role' = 'service_role');