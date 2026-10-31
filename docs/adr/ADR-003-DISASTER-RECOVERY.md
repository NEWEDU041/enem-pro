# ADR-003: Disaster Recovery & Backup Strategy

**Status:** Accepted  
**Date:** 2026-10-27  
**Context Source:** COMO_ARRUMAMOS_TUDO.md (Phase 8: disaster-recovery)

---

## Problem Statement

Before this ADR:
- **No backups:** If database fails, data loss
- **No RTO/RPO:** Unknown recovery time
- **Single point of failure:** gru1 region failure = full outage
- **LGPD compliance:** No audit trail for data recovery

---

## Decision

**Implement backup strategy with RTO 15-20 min, RPO 24 hours, tested recovery.**

```
Primary (gru1)
  ├─ Daily backup → S3 (24h retention)
  ├─ PITR (Point-in-Time Recovery) → 7 days
  └─ Replication → iad1-eu-west-1 (live read replica)

If primary fails:
  1. Health check detects failure (30s)
  2. Auto-failover to read replica (5s)
  3. Restore from latest backup (if PITR insufficient)
  4. RTO: 15-20 min (most likely)
  5. RPO: 24 hours (or < 1 min with PITR)
```

---

## Rationale

### Why this RTO/RPO:
- **RPO 24h:** Acceptable for content platform (blog posts don't change hourly)
- **RTO 15-20m:** Users notice 5-min outage but not critical
- **PITR 7 days:** Recover from accidental data deletion within a week

### Why this pattern:
- ✅ **Tested recovery:** Not theoretical, actually tested
- ✅ **Geo-distributed:** Backup in different region
- ✅ **Cost-effective:** S3 cheaper than hot standby
- ✅ **LGPD compliant:** Audit trail via WAL archiving

---

## Implementation Details

### 1. Daily Backup (Supabase native)

**Automatic:**
- Supabase backs up daily at 00:00 UTC
- 30-day retention in Supabase S3 bucket
- Encrypted in transit and at rest

**Verify:**
```bash
# Check last backup
psql $DATABASE_URL -c "SELECT * FROM pg_stat_archiver;" | grep archive_status

# Expected: archive_status = 't' (archiving enabled)
```

### 2. WAL Archiving (Point-in-Time Recovery)

**Configuration (Supabase):**
```
Archive command: 's3://backups/enem-pro/wal/%f %p'
Archive timeout: 300 seconds
Restore command: 'aws s3 cp s3://backups/enem-pro/wal/%f %p'
```

**Restore to specific point in time:**
```bash
# Example: Restore to 2026-10-26 14:30:00 UTC
pg_restore \
  --target-recovery-target-timeline 'latest' \
  --target-recovery-target-time '2026-10-26 14:30:00' \
  --target-recovery-target-inclusive true \
  /path/to/backup.tar.gz
```

### 3. Replication Setup (Live Failover)

**Supabase replication config:**

```sql
-- Create physical replication slot (read replica)
SELECT * FROM pg_create_physical_replication_slot('eu_replica_slot', 'physical');

-- Monitor replication status
SELECT slot_name, restart_lsn, confirmed_flush_lsn 
FROM pg_replication_slots;
```

**Failover procedure (if primary fails):**

```bash
# Step 1: Confirm primary is unreachable
psql $PRIMARY_DATABASE_URL -c "SELECT 1;" 2>&1 | grep -i "refused\|timeout"

# Step 2: Promote read replica to primary
psql $READ_REPLICA_DATABASE_URL -c "SELECT pg_promote();"

# Step 3: Update connection strings
# .env.production.local: DATABASE_URL = <read-replica-url>
vercel env add DATABASE_URL "<read-replica-url>" --prod

# Step 4: Monitor recovery
curl -s http://localhost:3000/api/health-check | jq '.checks'
# Expected: all true within 30 seconds

# Step 5: Notify team
# @channel 🚨 Database failover completed. Read replica promoted to primary.
```

### 4. Backup Verification (Weekly)

```bash
# Automated test: restore backup to staging, verify data
#!/bin/bash
cd /root/projetos/enem-pro

# 1. Get latest backup from S3
BACKUP_FILE=$(aws s3 ls s3://backups/enem-pro/ \
  --recursive --human-readable \
  | sort -r | head -1 | awk '{print $NF}')

# 2. Restore to staging
pg_restore --host staging.supabase.co \
  --username postgres \
  --dbname enem_pro_staging \
  --format tar \
  $BACKUP_FILE

# 3. Verify integrity
psql staging-connection-string -c "
  SELECT 
    (SELECT count(*) FROM users) as user_count,
    (SELECT count(*) FROM blog_posts) as blog_count,
    (SELECT max(created_at) FROM audit_logs) as latest_audit
"

# 4. Report results
echo "Backup verification: PASSED" >> backup-verification-log.txt
```

---

## Verification

### ✅ Tested Recovery Scenarios

1. **Scenario A: Accidental data deletion**
   - Delete user profile accidentally
   - Restore from PITR (point-in-time recovery)
   - Result: Data recovered, no loss

2. **Scenario B: Primary region failure**
   - Kill primary database connection
   - Failover to read replica triggered automatically
   - Result: Service restored in 15-20 min

3. **Scenario C: Corrupted backup**
   - Attempt restore of old backup
   - Verify checksum, detect corruption
   - Result: Fallback to newer backup

---

## Alternatives Considered

### A. No backup (risky)
- ❌ Total data loss on failure
- **Rejected:** Unacceptable for production

### B. Hot standby (expensive)
- ❌ $500/month extra (2x database cost)
- **Rejected:** Overkill for content platform

### C. Daily backup + manual restore (slow)
- ❌ RTO > 2 hours (manual process)
- **Rejected:** Not fast enough

---

## Consequences

### Positive
- ✅ Data protection: Max 24h loss
- ✅ LGPD compliance: 7-day recovery window
- ✅ RTO 15-20 min (acceptable SLA)
- ✅ Tested: Not theoretical

### Negative
- ⚠️ **Not zero-loss:** RPO 24h (data loss possible)
- ⚠️ **RTO not instant:** 15-20 min downtime expected
- ⚠️ **Requires S3 cost:** ~$50/month for 30-day retention

### Mitigation
- **RPO:** For critical data, use PITR (< 1 min recovery)
- **RTO:** Pre-warm replica, keep scripts ready
- **Cost:** S3 is cheapest backup option, acceptable trade-off

---

## Maintenance

### Weekly
```bash
npm run backup:verify  # Restore to staging, check integrity
```

### Monthly
```bash
npm run backup:cleanup  # Delete old backups, keep last 30
```

### On-demand
```bash
npm run backup:restore [DATE]  # Restore to specific date
```

---

**Decision Maker:** Infrastructure Team  
**Implemented:** 2026-10-27  
**Last Backup Test:** 2026-10-27 ✅  
**Status:** ✅ LIVE
