#!/usr/bin/env node

/**
 * Script to apply password hash migration to Supabase using REST API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!key.startsWith('#') && value) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project ref from Supabase URL');
  process.exit(1);
}

console.log('📦 Applying password hash migration to Supabase...\n');
console.log('Project:', projectRef);
console.log('\n⚠️  IMPORTANT: This migration needs to be applied via Supabase Dashboard');
console.log('\n📋 Steps to apply the migration:\n');
console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
console.log('\n2. Copy and paste this SQL:\n');
console.log('═'.repeat(80));
console.log(`
-- Add password_hash column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_hash text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- Add comment
COMMENT ON COLUMN public.users.password_hash IS 'Hashed password for credential-based authentication. NULL for OAuth/Email-only users.';
`);
console.log('═'.repeat(80));
console.log('\n3. Click the "Run" button\n');
console.log('4. You should see "Success. No rows returned"\n');
console.log('5. Restart your dev server with: npm run dev\n');
console.log('✅ Once applied, you can register with a password!\n');
