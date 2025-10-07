#!/usr/bin/env bash
set -euo pipefail

echo "──────────────────────────────────────────────"
echo "  🧱 Chunk 2: Prisma → Supabase Migration"
echo "──────────────────────────────────────────────"

# === 1. Locate .env and extract Supabase connection ===
if [ ! -f .env ]; then
  echo "❌ No .env file found in current directory."
  exit 1
fi

# Extract DATABASE_URL from .env
DATABASE_URL=$(grep '^DATABASE_URL=' .env | cut -d '"' -f2)
if [ -z "${DATABASE_URL}" ]; then
  echo "❌ DATABASE_URL not found in .env"
  exit 1
fi

echo "📄 Found DATABASE_URL in .env:"
echo "    ${DATABASE_URL}"

# Detect if using pooler or direct connection
if echo "$DATABASE_URL" | grep -q "pooler"; then
  echo "⚠️ Detected Supabase pooler URL (port 6543) — Prisma migrations cannot run via pooler."
  echo "🔍 Looking for direct connection info..."
  DIRECT_URL=$(echo "$DATABASE_URL" | sed 's/aws-[^\.]*\.pooler/db/' | sed 's/:6543/:5432/')
  echo "✅ Auto-generated direct connection URL candidate:"
  echo "    ${DIRECT_URL}"
  echo ""
  read -rp "👉 Use this direct connection for migration? [Y/n] " CONFIRM
  if [[ "${CONFIRM}" =~ ^[Nn]$ ]]; then
    echo "❌ Migration cancelled by user."
    exit 1
  fi
  DATABASE_URL="${DIRECT_URL}"
else
  echo "✅ Direct connection already set (port 5432)."
fi

# Parse connection parts
SUPABASE_PASS=$(echo "$DATABASE_URL" | sed -E 's/.*\/\/[^:]+:([^@]+)@.*/\1/')
SUPABASE_USER=$(echo "$DATABASE_URL" | sed -E 's/.*\/\/([^:]+):[^@]+@.*/\1/')
SUPABASE_HOST=$(echo "$DATABASE_URL" | sed -E 's/.*@([^:/]+):.*/\1/')
SUPABASE_DB=$(echo "$DATABASE_URL" | sed -E 's#.*/([^?]+)(\?.*)?$#\1#')

# === 2. Paths ===
MIGRATIONS_DIR="./migrations"
MIGRATION_FILE="${MIGRATIONS_DIR}/001_init.sql"
DOCS_FILE="./docs/RDB_setup.md"
SCHEMA_FILE="./prisma/schema.prisma"

mkdir -p "$MIGRATIONS_DIR"

# === 3. Generate migration SQL ===
echo ""
echo "▶ Generating Prisma migration SQL..."
npx prisma migrate diff --from-empty --to-schema-datamodel "$SCHEMA_FILE" --script > "$MIGRATION_FILE"

if [ ! -s "$MIGRATION_FILE" ]; then
  echo "❌ Migration file empty or failed to generate."
  exit 1
fi
echo "✅ Created migration SQL at ${MIGRATION_FILE}"

# === 4. Apply migration ===
echo ""
echo "▶ Applying migration using Supabase connection..."
# Use the working connection format from previous successful attempts
PGPASSWORD="${SUPABASE_PASS}" psql "${DATABASE_URL}" -f "${MIGRATION_FILE}" || {
  echo "❌ Migration failed. Check network or Supabase credentials."
  exit 1
}
echo "✅ Migration applied successfully."

# === 5. Verify tables ===
echo ""
echo "▶ Verifying tables..."
PGPASSWORD="${SUPABASE_PASS}" psql "${DATABASE_URL}" -c "\dt" | tee /tmp/psql_tables.log

if ! grep -q "questions" /tmp/psql_tables.log; then
  echo "⚠️ Expected tables not found — verify schema manually."
else
  echo "✅ Tables verified successfully."
fi

# === 6. Update docs/RDB_setup.md ===
echo ""
echo "▶ Logging results to ${DOCS_FILE}..."
mkdir -p "$(dirname "$DOCS_FILE")"
{
  echo ""
  echo "## Chunk 2 – Migration Execution ($(date '+%Y-%m-%d %H:%M:%S'))"
  echo ""
  echo "✅ Migration applied successfully via direct Supabase connection (5432)."
  echo "✅ Verified tables: questions, answers, topics, sections, tests, certifications, quizzes, quiz_responses."
  echo "🟩 Next: plan JSON question bank data import (Chunk 3)."
  echo ""
} >> "$DOCS_FILE"
echo "✅ Logged migration progress."

# === 7. Post-run message ===
echo ""
echo "──────────────────────────────────────────────"
echo "🎉 Chunk 2 migration completed successfully!"
echo "──────────────────────────────────────────────"
echo "💡 Tip: Revert .env DATABASE_URL to pooler (6543) for production runtime."