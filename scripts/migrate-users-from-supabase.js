#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const { PrismaClient } = require('../src/generated/prisma')
const { createClient } = require('@supabase/supabase-js')

const prisma = new PrismaClient()
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function migrateUsers() {
  try {
    console.log('🔍 Fetching users from Supabase...')

    // Fetch all users from Supabase
    const { data: supabaseUsers, error } = await supabase
      .from('users')
      .select('*')

    if (error) {
      throw error
    }

    console.log(`📊 Found ${supabaseUsers.length} users in Supabase`)

    // Check existing users in Prisma
    const existingUsers = await prisma.user.findMany({
      select: { email: true }
    })
    const existingEmails = new Set(existingUsers.map(u => u.email))

    console.log(`📊 Found ${existingUsers.length} existing users in Prisma Postgres`)

    // Migrate users that don't already exist
    let migratedCount = 0

    for (const supabaseUser of supabaseUsers) {
      if (existingEmails.has(supabaseUser.email)) {
        console.log(`⏭️  Skipping ${supabaseUser.email} (already exists in Prisma)`)
        continue
      }

      try {
        const newUser = await prisma.user.create({
          data: {
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.name,
            image: supabaseUser.image,
            passwordHash: supabaseUser.password_hash,
            emailVerified: supabaseUser.email_verified ? new Date(supabaseUser.email_verified) : null,
            createdAt: new Date(supabaseUser.created_at),
            updatedAt: new Date(supabaseUser.updated_at || supabaseUser.created_at),
          }
        })

        console.log(`✅ Migrated user: ${newUser.email}`)
        migratedCount++
      } catch (error) {
        console.error(`❌ Failed to migrate user ${supabaseUser.email}:`, error.message)
      }
    }

    console.log(`🎉 Migration completed! Migrated ${migratedCount} users.`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

migrateUsers()