#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ENEM Pro — Database Initialization Script
# 
# Purpose: Initialize Supabase PostgreSQL database with schema
# Run automatically by docker-compose entrypoint on first startup
# ═══════════════════════════════════════════════════════════════

set -e

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${POSTGRES_USER:-enem_pro}"
DB_NAME="${POSTGRES_DB:-enem_pro}"
DB_PASSWORD="${POSTGRES_PASSWORD:-changeme}"

# Export for psql
export PGPASSWORD="$DB_PASSWORD"

echo "[init-db] Waiting for PostgreSQL to be ready at $DB_HOST:$DB_PORT..."

# Wait for PostgreSQL to be ready
max_attempts=30
attempt=0
while ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" 2>/dev/null; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "[init-db] ERROR: PostgreSQL not ready after $max_attempts attempts"
    exit 1
  fi
  echo "[init-db] Attempt $attempt/$max_attempts: PostgreSQL not ready, waiting..."
  sleep 1
done

echo "[init-db] PostgreSQL is ready ✓"

# Check if database exists and has tables
SCHEMA_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")

if [ "$SCHEMA_EXISTS" -gt 0 ]; then
  echo "[init-db] Database schema already exists ($SCHEMA_EXISTS tables). Skipping migrations."
  exit 0
fi

echo "[init-db] Database is empty. Running migrations..."

# ─────────────────────────────────────────────────────────────
# ENEM Pro SCHEMA (from enem-pro/schema.sql)
# ─────────────────────────────────────────────────────────────

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'SQL'

-- ═══════════════════════════════════════════════════════════════
-- ENEM Pro — Schema
-- ═══════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────
-- TABELAS
-- ────────────────────────────────────────────────────────────

-- User subscriptions (plan management)
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  expires_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily usage tracking (limit control for free tier)
CREATE TABLE IF NOT EXISTS daily_usage (
  user_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  explanation_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- User answers to questions
CREATE TABLE IF NOT EXISTS user_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_alternative TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  discipline TEXT,
  year INTEGER,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Questions cache (reduces API calls to api.enem.dev)
CREATE TABLE IF NOT EXISTS questions_cache (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  discipline TEXT,
  data JSONB NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- ÍNDICES — Performance
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers (user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_answered ON user_answers (user_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_answers_disc_year ON user_answers (user_id, discipline, year);
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage (user_id, date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions (plan, expires_at);
CREATE INDEX IF NOT EXISTS idx_questions_cache_year ON questions_cache (year);
CREATE INDEX IF NOT EXISTS idx_questions_cache_discipline ON questions_cache (discipline);

-- ────────────────────────────────────────────────────────────
-- COMMENTS — Documentation
-- ────────────────────────────────────────────────────────────

COMMENT ON TABLE subscriptions IS 'User subscription plans and billing management';
COMMENT ON TABLE daily_usage IS 'Daily usage tracking for free tier rate limiting';
COMMENT ON TABLE user_answers IS 'Historical record of user question responses';
COMMENT ON TABLE questions_cache IS 'Cached ENEM questions to reduce external API calls';

SQL

echo "[init-db] Schema created successfully ✓"

# Run seed data script if it exists
if [ -f "$(dirname "$0")/seed-data.sh" ]; then
  echo "[init-db] Running seed data script..."
  bash "$(dirname "$0")/seed-data.sh"
else
  echo "[init-db] No seed-data.sh found, skipping seed data"
fi

echo "[init-db] Database initialization complete ✓"
