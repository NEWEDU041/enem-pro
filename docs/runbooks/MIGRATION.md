# Runbook: Database Migration — enem-pro

**Status:** Production-Ready  
**Last Updated:** 2026-10-27  
**Audience:** Database Admin, Backend Lead, DevOps

---

## 📋 Pre-Migration Checklist

Before ANY migration to production:

```bash
# ✓ Create backup
pg_dump $DATABASE_URL > backup-$(date +%s).sql

# ✓ Test on staging first
# Create staging copy of production database
psql $STAGING_DATABASE_URL < backup-*.sql

# ✓ Verify rollback plan documented
# See: ROLLBACK PROCEDURE (Section 4)

# ✓ Notify team in Slack
# @channel MIGRATION: enem-pro DB migration starting at 14:00 UTC

# ✓ Ensure no active deployments
git status  # must be clean
```

---

## 🚀 Migration Process

### Type A: Non-Breaking (Safe, Zero-Downtime)

**Examples:** Add column, Create index, Update view

```bash
# 1. Create migration file
psql $DATABASE_URL -c "
  -- Migration: Add user_preferences column
  ALTER TABLE users ADD COLUMN preferences jsonb DEFAULT '{}';
  CREATE INDEX idx_users_preferences ON users USING GIN(preferences);
"

# 2. Test on staging
psql $STAGING_DATABASE_URL -c "
  ALTER TABLE users ADD COLUMN preferences jsonb DEFAULT '{}';
  -- Verify column exists
  SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='preferences';
"

# 3. Run on production
psql $DATABASE_URL -c "
  ALTER TABLE users ADD COLUMN preferences jsonb DEFAULT '{}';
"

# 4. Verify migration
psql $DATABASE_URL -c "
  SELECT * FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position DESC LIMIT 3;
"

# Expected:
#  column_name    | data_type | is_nullable
# ----------------+-----------+-------------
#  preferences    | jsonb     | YES
#  created_at     | timestamp | NO
#  updated_at     | timestamp | NO
```

### Type B: Breaking Change (Requires Downtime)

**Examples:** Drop column, Rename column, Change column type

```bash
# 1. Plan downtime window (usually off-peak)
# Announce in Slack: Migration window 02:00-03:00 UTC (1 hour planned maintenance)

# 2. Stop application servers
# Set maintenance mode in Vercel/Next.js
curl -X POST http://localhost:3000/api/admin/maintenance \
  -d '{"enabled": true, "message": "Database migration in progress"}' \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. Wait for active requests to drain (< 10 active)
watch -n 2 'curl -s http://localhost:3000/api/metrics/requests | jq ".active"'

# 4. Create backup before any change
pg_dump $DATABASE_URL > backup-before-breaking-change.sql

# 5. Run migration
psql $DATABASE_URL -c "
  -- Example: Rename column (requires table rewrite)
  ALTER TABLE users RENAME COLUMN old_name TO new_name;
"

# 6. Update application code
# Update any queries that reference old column name
grep -r "old_name" app/ lib/ | head -10
# Update code:
# SELECT old_name → SELECT new_name
# WHERE old_name = → WHERE new_name =

# 7. Test code changes locally
npm test -- --run

# 8. Deploy new code
git add .
git commit -m "refactor: update queries for renamed column"
git push origin main

# 9. Verify migration
psql $DATABASE_URL -c "
  SELECT column_name FROM information_schema.columns WHERE table_name='users';
"

# 10. Disable maintenance mode
curl -X POST http://localhost:3000/api/admin/maintenance \
  -d '{"enabled": false}' \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 11. Monitor for errors
curl -s http://localhost:3000/api/metrics/errors | jq '.rate'
# Expected: < 1%
```

---

## ✅ Index Addition (Common Operation)

```bash
# 1. Identify slow query needing index
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = $1;
# Output: Seq Scan (inefficient)

# 2. Create index (non-blocking)
# Use CONCURRENTLY to avoid locking table
psql $DATABASE_URL -c "
  CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
"
# ℹ️ CONCURRENTLY means:
# - Doesn't lock table for writes
# - Takes longer to create (2-5 min)
# - Other queries can run during creation

# 3. Verify index created successfully
psql $DATABASE_URL -c "
  SELECT schemaname, tablename, indexname, indexdef 
  FROM pg_indexes 
  WHERE tablename = 'orders' AND indexname = 'idx_orders_user_id';
"

# 4. Verify index is being used
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = $1;
# Output should show: "Index Scan using idx_orders_user_id" instead of "Seq Scan"

# 5. Check index size
psql $DATABASE_URL -c "
  SELECT pg_size_pretty(pg_relation_size('idx_orders_user_id'));
"
# Expected: < 50MB for typical table
```

---

## 🔄 Data Migration (Backfill)

```bash
# Scenario: Add new required column and backfill with data

# 1. Add column (nullable initially)
psql $DATABASE_URL -c "
  ALTER TABLE users ADD COLUMN avatar_url TEXT;
"

# 2. Deploy code that populates new column for NEW records
// In app/api/users/route.ts:
const newUser = {
  id: userId,
  avatar_url: generateAvatarUrl(userId),  // ← New code
  ...
}

# 3. Backfill existing records
# For large tables, do in batches to avoid locking
psql $DATABASE_URL -c "
  UPDATE users 
  SET avatar_url = '/avatars/default.png'
  WHERE avatar_url IS NULL
  LIMIT 1000;
"

# 4. Repeat backfill until all updated
# Check progress
psql $DATABASE_URL -c "
  SELECT COUNT(*) as remaining FROM users WHERE avatar_url IS NULL;
"

# 5. Once done, make column NOT NULL
psql $DATABASE_URL -c "
  ALTER TABLE users ALTER COLUMN avatar_url SET NOT NULL;
"

# 6. Verify all rows updated
psql $DATABASE_URL -c "
  SELECT COUNT(*) FROM users WHERE avatar_url IS NULL;
"
# Expected: 0
```

---

## 🔐 Schema Migration (Safety Checklist)

Before running any migration script:

```bash
# Test migration syntax
psql $STAGING_DATABASE_URL --dry-run < migration.sql

# Check for long locks
# Any ALTER TABLE that rewrites table is risky
grep -E "ALTER TABLE|ADD CONSTRAINT|CHANGE|CONVERT" migration.sql

# Risky operations (require downtime):
# ❌ ALTER TABLE ... CHANGE COLUMN <type>  (rewrites all rows)
# ❌ ADD PRIMARY KEY (if doesn't exist)
# ❌ DROP CONSTRAINT (if others depend on it)

# Safe operations (zero-downtime):
# ✅ ALTER TABLE ... ADD COLUMN
# ✅ ALTER TABLE ... DROP COLUMN (with CONCURRENTLY)
# ✅ CREATE INDEX CONCURRENTLY
# ✅ UPDATE (with batching)
```

---

## 4️⃣ ROLLBACK PROCEDURE

### If migration succeeds but causes errors:

```bash
# Step 1: Detect problem (within first 5 min)
curl -s http://localhost:3000/api/metrics/errors | jq '.rate'
# If > 5%: migration likely caused issue

# Step 2: Restore from backup
# Stop application
curl -X POST http://localhost:3000/api/admin/maintenance \
  -d '{"enabled": true}' \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Restore database
psql $DATABASE_URL < backup-before-migration.sql

# Step 3: Restart application
curl -X POST http://localhost:3000/api/admin/maintenance \
  -d '{"enabled": false}' \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Step 4: Verify recovery
curl -s http://localhost:3000/api/health-check | jq '.status'
# Expected: "healthy"

# Step 5: Investigate root cause
# Review migration script for errors
# Test on staging again before reattempt

# Notify team
# @channel ROLLBACK: Migration rolled back. Root cause: <reason>
```

### Time to Rollback: ~10-15 minutes (depending on database size)

---

## 📊 Monitoring Migration Progress

For long-running migrations:

```bash
# Check migration status
psql $DATABASE_URL -c "
  SELECT pid, usename, state, query, duration 
  FROM pg_stat_activity 
  WHERE query LIKE 'ALTER%' OR query LIKE 'UPDATE%'
  LIMIT 5;
"

# If migration hangs (> 30 min for typical operation):
# Kill it and rollback
psql $DATABASE_URL -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE query LIKE 'ALTER%';
"

# Check database size growth
psql $DATABASE_URL -c "
  SELECT pg_size_pretty(pg_database_size(current_database()));
"
```

---

## 📝 Migration Template

Use this template for documenting migrations:

```markdown
## Migration: <Name>

**Date:** 2026-10-27  
**Author:** <Your name>  
**Duration:** ~5 minutes  
**Risk Level:** 🟢 Low / 🟡 Medium / 🔴 High

### Description
<What does this migration do?>

### Rollback Plan
<How to undo if something goes wrong?>

### Verification
```sql
-- Commands to verify migration succeeded
SELECT * FROM information_schema.columns WHERE table_name = 'users';
```

### Code Changes Required
<Any application code changes needed to support this migration?>
```

---

## 🆘 Troubleshooting

### Issue: Migration takes > 10 minutes

**Cause:** Table is being locked, or Supabase is under load  
**Solution:**
```bash
# 1. Check active queries
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity WHERE state != 'idle';"

# 2. If migration is blocked by another query:
psql $DATABASE_URL -c "SELECT pg_terminate_backend(<pid from above>);"

# 3. Retry migration
psql $DATABASE_URL -c "ALTER TABLE ..."
```

### Issue: "ERROR: relation does not exist"

**Cause:** Table or column name typo  
**Solution:**
```bash
# 1. List all tables
psql $DATABASE_URL -c "\dt"

# 2. Check exact table/column names
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"

# 3. Fix migration SQL and retry
```

### Issue: Disk space full during migration

**Cause:** Database grew during migration  
**Solution:**
```bash
# 1. Check available space
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# 2. Contact Supabase support to increase disk quota

# 3. Or delete old backups to free space
ls -lh backup-*.sql | tail -5 | awk '{print $9}' | xargs rm
```

---

**Last Tested:** 2026-10-27  
**Related:** [DEPLOY.md](./DEPLOY.md)  
**Version:** 1.0
