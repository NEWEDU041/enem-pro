#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ENEM Pro — Seed Data Script
# 
# Purpose: Populate database with initial data
# Runs automatically after init-db.sh on first startup
# ═══════════════════════════════════════════════════════════════

set -e

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${POSTGRES_USER:-enem_pro}"
DB_NAME="${POSTGRES_DB:-enem_pro}"
DB_PASSWORD="${POSTGRES_PASSWORD:-changeme}"

# Export for psql
export PGPASSWORD="$DB_PASSWORD"

echo "[seed-data] Populating seed data..."

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'SQL'

-- ═══════════════════════════════════════════════════════════════
-- ENEM Pro Seed Data
-- ═══════════════════════════════════════════════════════════════

-- Don't re-seed if data already exists
DO $do$
BEGIN
  -- Insert sample subscriptions only if table is empty
  IF (SELECT COUNT(*) FROM subscriptions) = 0 THEN
    INSERT INTO subscriptions (user_id, plan, created_at)
    VALUES
      ('user_demo', 'free', NOW());
    RAISE NOTICE 'Sample subscription seeded';
  ELSE
    RAISE NOTICE 'Subscriptions already exist, skipping seed';
  END IF;
END
$do$;

SQL

echo "[seed-data] Seed data complete ✓"
