#!/usr/bin/env node

/**
 * Script to apply password hash migration to Supabase
 * Run with: node scripts/apply-password-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
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

// Read the migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20241006_add_password_hash.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('📦 Applying password hash migration to Supabase...\n');
console.log('📋 Please apply this SQL in your Supabase SQL Editor:');
console.log('   https://supabase.com/dashboard/project/ppvfpwtwffbuntbvpyvw/sql/new');
console.log('\n' + '='.repeat(80));
console.log(migrationSQL);
console.log('='.repeat(80));
console.log('\n✅ Copy the SQL above and paste it in the Supabase SQL Editor, then click "Run"');
