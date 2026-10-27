# Multi-Region Deployment Architecture & Runbook

**Last Updated:** 2026-10-27  
**Status:** Ready for deployment  
**Regions:** sa-east-1 (Primary), eu-west-1 (Replica), us-east-1 (Fallback)

---

## 1. Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    User Request                              │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
    ┌────▼─────┐          ┌──────▼──────┐
    │ Geoloc   │          │ Cloudflare  │
    │ Detection│          │ Worker      │
    └────┬─────┘          └──────┬──────┘
         │                       │
    ┌────▼───────────────────────▼────┐
    │    Health Check & Route           │
    │  (Failover Decision Engine)       │
    └────┬─────────────┬───────────┬────┘
         │             │           │
    ┌────▼──┐     ┌────▼──┐   ┌────▼──┐
    │ SA-E1 │     │ EU-W1 │   │ US-E1 │
    │ Prim  │     │ Read  │   │ FB    │
    └────┬──┘     └────┬──┘   └────┬──┘
         │             │           │
    ┌────▼─────────────▼───────────▼────┐
    │    Vercel Edge Network              │
    │    (CDN + Static Assets)            │
    └────────┬─────────────────────────┬──┘
             │                         │
       ┌─────▼──┐              ┌──────▼──┐
       │ Supabase│              │ Cloudfl.│
       │Primary  │              │Cache    │
       └──────┬──┘              └─────────┘
              │
         ┌────▼──────┐
         │ Read Repl.│
         │ (EU)      │
         └───────────┘
```

### Key Features

- **Geolocation-based routing:** Detect user location, route to nearest region
- **Health checks:** Every 30s per region via `/api/health-check`
- **Circuit breaker:** Automatic failover after 5 consecutive failures
- **Replication lag monitoring:** Track EU replica lag from primary (target: <5s)
- **Edge caching:** Vercel Edge Functions + Cloudflare for static assets
- **CDN integration:** 24h cache for immutable assets, 1h for static HTML

---

## 2. Pre-Deployment Checklist

### Vercel Configuration

- [ ] Both projects (enem-pro, site-clicks) have `vercel.json` with multi-region config
- [ ] Regions in vercel.json: `["iad1", "iad1-eu-west-1", "gru1"]`
  - `gru1` = São Paulo (Primary)
  - `iad1-eu-west-1` = Frankfurt (EU)
  - `iad1` = Virginia (Fallback)
- [ ] Environment variables set in Vercel dashboard:
  ```
  ENABLE_EDGE_CACHING=true
  MULTI_REGION_ENABLED=true
  PRIMARY_REGION=gru1
  FALLBACK_REGION=iad1
  EDGE_REGION=iad1-eu-west-1
  ```

### Supabase Configuration

- [ ] Primary database: São Paulo region (sa-east-1)
- [ ] Read replica created in Frankfurt (eu-west-1)
- [ ] Connection pooling enabled (20 max connections)
- [ ] Replication lag monitoring enabled
- [ ] Environment variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_URL_EU=https://xxxx-eu.supabase.co
  SUPABASE_ANON_KEY=xxxx
  SUPABASE_SERVICE_KEY=xxxx
  ```

### Cloudflare Configuration

- [ ] Cloudflare account linked to domain
- [ ] SSL/TLS set to "Full (Strict)"
- [ ] Cache rules created:
  - `/assets/*` → 24h cache
  - `/api/health-check` → No cache
  - `/` → 1h cache
- [ ] Cloudflare Worker deployed (failover logic)
- [ ] Rate limiting rules set

### Health Check Endpoint

- [ ] `/api/health-check` deployed to all regions
- [ ] Checks: database, cache, external connectivity
- [ ] Returns 200 for healthy, 503 for degraded/unhealthy
- [ ] Timeout: 10 seconds per health check

---

## 3. Deployment Steps

### Step 1: Deploy Vercel Configuration

```bash
cd /root/projetos/enem-pro
git add vercel.json app/api/health-check/route.ts lib/multi-region-db.ts
git commit -m "feat: add multi-region deployment config"
git push origin main

# Trigger deployment
vercel deploy --prod
```

Repeat for site-clicks:
```bash
cd /root/projetos/site-clicks
git add vercel.json
git commit -m "feat: add multi-region deployment config"
git push origin main
vercel deploy --prod
```

### Step 2: Deploy Cloudflare Worker

```bash
# Copy worker code
cp /root/projetos/enem-pro/public/cf-worker-failover.ts ./src/worker.ts

# Deploy (requires Wrangler CLI)
npm install -g @cloudflare/wrangler
wrangler publish src/worker.ts --name enem-pro-failover

# Bind to domain route
# In Cloudflare dashboard: enem-pro.com → Route to Workers → enem-pro-failover
```

### Step 3: Configure Database Replicas

```sql
-- In Supabase Console: SQL Editor

-- Create EU replica (run on primary)
SELECT * FROM pg_create_physical_replication_slot('eu_replica_slot', 'physical');

-- Monitor replication slot status
SELECT slot_name, slot_type, restart_lsn FROM pg_replication_slots;

-- Check replica lag (run on primary)
SELECT 
  pid,
  usename,
  write_lsn,
  flush_lsn,
  replay_lsn,
  (pg_current_wal_lsn() - replay_lsn) AS replication_lag_bytes
FROM pg_stat_replication;
```

### Step 4: Test Health Checks

```bash
# Test each region
curl -I https://enem-pro.vercel.app/api/health-check
curl -I https://enem-pro-eu.vercel.app/api/health-check
curl -I https://enem-pro-gru.vercel.app/api/health-check

# Expected response:
# HTTP/2 200
# x-health-status: healthy
# x-served-by: <region>
```

### Step 5: Configure Cache Rules (Cloudflare)

In Cloudflare Dashboard → Caching → Rules:

```
Rule 1:
  Path: /assets/*
  Cache Level: Cache Everything
  Browser TTL: 30 days
  Edge TTL: 30 days

Rule 2:
  Path: /api/health-check
  Cache Level: Bypass Cache
  
Rule 3:
  Path: / (homepage)
  Cache Level: Cache Everything
  Browser TTL: 1 hour
  Edge TTL: 24 hours
```

---

## 4. Failover Testing

### Test 1: Health Check Verification

```bash
# Verify health checks are accessible
for region in gru1 iad1-eu-west-1 iad1; do
  echo "Testing region: $region"
  curl -s https://enem-pro-${region}.vercel.app/api/health-check | jq .
done
```

### Test 2: Simulate Region Failure

```bash
# Simulate failure of sa-east-1 (primary)
curl -X POST https://enem-pro.vercel.app/api/failover-test \
  -H "Content-Type: application/json" \
  -d '{
    "action": "simulate-failure",
    "region": "sa-east-1",
    "duration": 60000
  }'

# Expected response:
{
  "status": "failure-simulated",
  "region": "sa-east-1",
  "duration": 60000,
  "expiresAt": "2026-10-27T12:35:00Z"
}
```

### Test 3: Verify Automatic Failover

```bash
# Check current active region
curl https://enem-pro.vercel.app/api/failover-test?action=status | jq .

# Should show:
{
  "activeRegion": "eu-west-1",
  "simulatedFailures": [
    {
      "region": "sa-east-1",
      "timestamp": 1698408900000,
      "duration": 60000
    }
  ]
}
```

### Test 4: Measure Latency

```bash
# Measure latency to each region
curl https://enem-pro.vercel.app/api/failover-test?action=latency | jq .

# Expected output:
{
  "latencyByRegion": {
    "sa-east-1": [45.2, 48.1, 46.5],
    "eu-west-1": [125.3, 128.1, 126.7],
    "us-east-1": [85.2, 87.1, 86.5]
  },
  "timestamp": "2026-10-27T12:30:00Z"
}
```

### Test 5: Clear Simulated Failures

```bash
# Clear all simulated failures
curl -X POST https://enem-pro.vercel.app/api/failover-test \
  -H "Content-Type: application/json" \
  -d '{"action": "clear-all-failures"}'

# Verify restoration
curl https://enem-pro.vercel.app/api/failover-test?action=status | jq .
```

---

## 5. Monitoring & Observability

### Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select project → Analytics → Regions
3. Monitor:
   - Requests per region
   - Error rate by region
   - Response time by region

### Cloudflare Dashboard

1. Go to https://dash.cloudflare.com
2. Select domain → Analytics
3. Monitor:
   - Cache hit ratio (target >85%)
   - Request volume by region
   - Error rates

### Custom Monitoring (Create Dashboard)

```bash
# Create monitoring script
cat > /root/projetos/enem-pro/scripts/monitor-regions.ts << 'EOF'
import { FailoverTester } from '@/lib/failover-tester';

const tester = new FailoverTester();

async function monitor() {
  const results = await tester.runFullTest();
  
  console.log('=== Multi-Region Status ===');
  console.log(`Total Tests: ${results.summary.totalTests}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Avg Latency: ${results.summary.avgLatency.toFixed(2)}ms`);
  
  console.log('\n=== Results by Test ===');
  results.results.forEach(r => {
    console.log(`${r.region} / ${r.test}: ${r.status} (${r.latency.toFixed(2)}ms)`);
  });
}

monitor().catch(console.error);
EOF

# Run monitoring
npx ts-node scripts/monitor-regions.ts
```

---

## 6. Runbook: Common Operations

### Add New Region

1. **Vercel Configuration:**
   ```json
   {
     "regions": ["iad1", "iad1-eu-west-1", "ap-northeast-1"]
   }
   ```

2. **Update Database:**
   ```sql
   -- Create new replication slot
   SELECT * FROM pg_create_physical_replication_slot('ap_replica_slot', 'physical');
   ```

3. **Update Cloudflare Worker:**
   - Add region to REGIONS object
   - Add geolocation mapping for countries

4. **Test:**
   ```bash
   curl https://enem-pro-ap.vercel.app/api/health-check
   ```

### Rollback Region

If a region is consistently failing:

```bash
# 1. Remove from vercel.json
# 2. Update Cloudflare Worker to skip region
# 3. Deploy
vercel deploy --prod

# 4. Verify traffic routing to fallback
curl https://enem-pro.vercel.app/api/failover-test?action=status
```

### Emergency: Switch to Single Region

```bash
# 1. Disable failover (set all regions to primary)
# 2. Update VERCEL_REGION in environment
# 3. Monitor closely
# 4. Create incident post-mortem

# Temporarily route all to primary
curl -X POST https://enem-pro.vercel.app/api/failover-test \
  -H "Content-Type: application/json" \
  -d '{"action": "simulate-failure", "region": "eu-west-1", "duration": 3600000}'
```

### Database Replication Monitoring

```sql
-- Check replication lag
SELECT 
  slot_name,
  (pg_current_wal_lsn() - restart_lsn) / 1024 / 1024 AS slot_lag_mb
FROM pg_replication_slots
WHERE slot_type = 'physical';

-- Monitor transaction log retention
SELECT 
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), pg_current_wal_lsn() - (SELECT setting::bigint FROM pg_settings WHERE name = 'wal_keep_segments') * 16 * 1024 * 1024)) AS wal_retained_size;
```

---

## 7. Success Metrics & SLOs

### Target Metrics

| Metric | Target | Monitoring |
|--------|--------|------------|
| **Failover Time** | < 5 seconds | `/api/failover-test` |
| **Cache Hit Ratio** | > 85% | Cloudflare Dashboard |
| **Availability** | 99.95% | Vercel Analytics |
| **Replication Lag** | < 5 seconds | Database metrics |
| **Latency (SA)** | < 150ms | Vercel Analytics |
| **Latency (EU)** | < 100ms | Vercel Analytics |

### Alerting Rules

```json
{
  "alerts": [
    {
      "metric": "health-check-failure-rate",
      "threshold": "> 10% for 5 minutes",
      "action": "Page on-call engineer"
    },
    {
      "metric": "replication-lag",
      "threshold": "> 30 seconds",
      "action": "Slack notification to #infrastructure"
    },
    {
      "metric": "cache-hit-ratio",
      "threshold": "< 70%",
      "action": "Review cache rules"
    }
  ]
}
```

---

## 8. Troubleshooting

### Health Check Failing

```bash
# Check what's failing
curl -s https://enem-pro.vercel.app/api/health-check | jq '.checks'

# Common issues:
# 1. Database unreachable: Check Supabase credentials
# 2. Cache unreachable: Check Redis/KV connection
# 3. External check failing: Network issues

# Manually test database
curl -s https://your-project.supabase.co/rest/v1/ \
  -H "apikey: $SUPABASE_ANON_KEY"
```

### Failover Not Working

```bash
# 1. Verify Cloudflare Worker is deployed
curl -I https://enem-pro.com/api/health-check
# Should return: cf-cache-status: HIT (if cached)

# 2. Check region availability
vercel list -- deployments --meta=region

# 3. Verify environment variables in all regions
vercel env list --prod
```

### High Latency to EU

```bash
# 1. Check replication lag
# SQL: SELECT (pg_current_wal_lsn() - restart_lsn) FROM pg_replication_slots;

# 2. Check cache effectiveness
# Cloudflare Dashboard → Caching → Analytics

# 3. Consider adding EU-specific cache rules
# Cloudflare → Caching → Rules → Add rule for EU IPs
```

---

## 9. Disaster Recovery

### Complete Region Failure

1. **Detect:** Health check returns 503 for 5+ consecutive attempts
2. **Notify:** Send alert to #infrastructure Slack
3. **Failover:** Automatic to next healthy region (< 5s)
4. **Investigate:** Check region logs in Vercel
5. **Restore:** Once region healthy, re-enable in Cloudflare Worker

### Database Replication Failure

1. **Detect:** Replication lag > 5 minutes
2. **Action:** Send alert, do NOT failover writes to replica
3. **Investigation:**
   ```sql
   SELECT * FROM pg_stat_replication;
   ```
4. **Fix:**
   ```sql
   -- Reset replication if needed
   SELECT pg_drop_replication_slot('eu_replica_slot');
   SELECT * FROM pg_create_physical_replication_slot('eu_replica_slot', 'physical');
   ```

### Cache Corruption

```bash
# Purge Cloudflare cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://enem-pro.com/*"]}'
```

---

## 10. Deployment Verification Checklist

After deployment, verify:

- [ ] All regions responding to health checks (200 OK)
- [ ] Geolocation routing working (test from different VPNs)
- [ ] Cache hit ratio > 85% (wait 24h for warmup)
- [ ] Latency improvements measured and documented
- [ ] Failover tests pass (< 5s failover time)
- [ ] Database replication synced (lag < 5s)
- [ ] Cloudflare Worker active and routing correctly
- [ ] Alerts configured in monitoring system
- [ ] Documentation updated with regional endpoints

---

## Quick Reference

```bash
# Health Check All Regions
for region in gru1 iad1-eu-west-1 iad1; do
  echo "=== $region ===" 
  curl -s https://enem-pro-${region}.vercel.app/api/health-check | jq -c '{status: .status, latency: .latency, region: .region}'
done

# Test Failover
curl -X POST https://enem-pro.vercel.app/api/failover-test \
  -H "Content-Type: application/json" \
  -d '{"action": "simulate-failure", "region": "sa-east-1", "duration": 30000}'

# Monitor Status
watch -n 5 'curl -s https://enem-pro.vercel.app/api/failover-test?action=status | jq .'

# Latency Report
curl -s https://enem-pro.vercel.app/api/failover-test?action=latency | jq '.latencyByRegion | to_entries[] | {region: .key, avg: (.value | add / length | round)}'
```

---

**End of Runbook**
