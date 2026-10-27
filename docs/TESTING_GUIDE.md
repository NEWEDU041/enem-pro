# Multi-Region Testing & Verification Guide

This guide covers all testing procedures for the multi-region deployment setup.

## Quick Start

```bash
# Run all tests
npm run test:multi-region

# Test specific region
npm run test:region -- --region=sa-east-1

# Simulate failure
npm run test:failover -- --region=sa-east-1

# Measure latency
npm run test:latency

# View results
npm run test:report
```

---

## Test Suite 1: Health Check Validation

### Purpose
Verify that each region's health check endpoint is responding correctly and all system components are healthy.

### Test Command
```bash
npm run test:health-checks
```

### Manual Test
```bash
# Test SA-EAST-1 (Primary)
curl -v https://enem-pro-gru.vercel.app/api/health-check

# Test EU-WEST-1 (Replica)
curl -v https://enem-pro-eu.vercel.app/api/health-check

# Test US-EAST-1 (Fallback)
curl -v https://enem-pro-iad.vercel.app/api/health-check
```

### Expected Results
- **Status Code:** 200 (healthy) or 503 (degraded/unhealthy)
- **Response Time:** < 2 seconds per region
- **All Checks:** Should return true for healthy status

### Success Criteria
✅ All 3 regions respond with 200 or 503  
✅ Response times < 2s  
✅ JSON structure matches expected schema  

---

## Test Suite 2: Failover Simulation

### Purpose
Verify automatic failover triggers when a region becomes unhealthy and traffic switches to next-best region.

### Test Command
```bash
npm run test:failover
```

### Step-by-Step Manual Test

**Step 1: Get Baseline Status**
```bash
curl https://enem-pro.vercel.app/api/failover-test?action=status
```
Expected: All 3 regions healthy

**Step 2: Simulate SA-EAST-1 Failure**
```bash
curl -X POST https://enem-pro.vercel.app/api/failover-test \
  -H "Content-Type: application/json" \
  -d '{
    "action": "simulate-failure",
    "region": "sa-east-1",
    "duration": 30000
  }'
```
Expected: Returns status "failure-simulated"

**Step 3: Verify Traffic Redirected**
```bash
curl https://enem-pro.vercel.app/api/failover-test?action=status
```
Expected: activeRegion is now "eu-west-1"

**Step 4: Test Still Works**
```bash
curl https://enem-pro.vercel.app/
```
Expected: Homepage loads successfully from EU

**Step 5: Clear Failure**
```bash
curl -X POST https://enem-pro.vercel.app/api/failover-test \
  -H "Content-Type: application/json" \
  -d '{"action": "clear-all-failures"}'
```
Expected: Failures cleared, traffic returns to primary

**Step 6: Verify Recovery**
```bash
curl https://enem-pro.vercel.app/api/failover-test?action=status
```
Expected: activeRegion is "sa-east-1" again

### Success Criteria
✅ Failover triggered in < 5 seconds  
✅ Traffic successfully routed to healthy region  
✅ No errors during failover  
✅ Automatic recovery when primary comes back  

---

## Test Suite 3: Latency Benchmarking

### Purpose
Measure response times from different regions and compare before/after improvement.

### Test Command
```bash
npm run test:latency
```

### Automated Latency Test
```bash
# Get latency metrics for all regions
curl https://enem-pro.vercel.app/api/failover-test?action=latency | jq .

# Expected output:
{
  "latencyByRegion": {
    "sa-east-1": [45.2, 48.1, 46.5],
    "eu-west-1": [125.3, 128.1, 126.7],
    "us-east-1": [85.2, 87.1, 86.5]
  }
}
```

### Manual Latency Test (from Different Locations)

**Using VPN to simulate different regions:**

```bash
# Connect to Brazil VPN, then:
time curl -o /dev/null -s https://enem-pro.com/

# Connect to Germany VPN, then:
time curl -o /dev/null -s https://enem-pro.com/

# Connect to US VPN, then:
time curl -o /dev/null -s https://enem-pro.com/
```

### Expected Results

| Region | Expected Latency |
|--------|------------------|
| SA-EAST-1 (Primary) | 40-60ms |
| EU-WEST-1 (Replica) | 100-150ms |
| US-EAST-1 (Fallback) | 80-120ms |

### Improvement Metrics

Compare before/after deployment:

```bash
# Before multi-region (single region latency)
# All regions had: 200-300ms

# After multi-region
# SA: 45ms (↓70% improvement)
# EU: 125ms (↓60% improvement)
# US: 85ms (↓60% improvement)
```

---

## Test Suite 4: Database Replication Verification

### Purpose
Verify data is being replicated from primary to read replicas with acceptable lag.

### Prerequisites
```bash
# Export database credentials
export SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_KEY="eyJxx..."
```

### SQL Test Queries

**Check Replication Slot Status:**
```sql
SELECT 
  slot_name,
  slot_type,
  restart_lsn,
  confirmed_flush_lsn,
  (pg_current_wal_lsn() - restart_lsn) / 1024 / 1024 AS lag_mb
FROM pg_replication_slots;
```

**Expected:** lag_mb < 1 (less than 1MB = <5 seconds)

**Monitor Replication Activity:**
```sql
SELECT 
  pid,
  usename,
  application_name,
  state,
  sync_state,
  (pg_current_wal_lsn() - flush_lsn) / 1024 / 1024 AS flush_lag_mb
FROM pg_stat_replication;
```

**Expected:** State = "streaming", flush_lag_mb < 1

**Test Write → Replica Sync:**
```sql
-- On primary:
BEGIN;
INSERT INTO _replication_test (test_id, created_at) 
VALUES (NOW()::text, NOW());
SELECT pg_current_wal_lsn();
COMMIT;

-- On read replica (within 5 seconds):
SELECT * FROM _replication_test WHERE created_at > NOW() - INTERVAL '10 seconds';
-- Should see the inserted row
```

### Success Criteria
✅ Replication lag < 5 seconds  
✅ Slot state is "streaming"  
✅ Writes visible on replica within 5s  
✅ No errors in WAL logs  

---

## Test Suite 5: Cache Effectiveness

### Purpose
Verify CDN and edge caching are working correctly and improving performance.

### Test Command
```bash
# Run cache effectiveness test
curl -v https://enem-pro.com/ 2>&1 | grep -i "cf-cache-status"

# Expected: cf-cache-status: HIT (or MISS on first request)
```

### Automated Cache Test

```bash
# First request (cache miss)
curl -I https://enem-pro.com/ | grep cf-cache-status
# Expected: MISS

# Second request (cache hit)
curl -I https://enem-pro.com/ | grep cf-cache-status
# Expected: HIT

# Check cache headers
curl -I https://enem-pro.com/assets/main.js
# Expected: Cache-Control: public, max-age=31536000, immutable
#           cf-cache-status: HIT
```

### Cache Rule Verification

In Cloudflare Dashboard:
1. Analytics → Caching
2. Verify cache hit ratio > 85% after 24 hours
3. Check cache performance by content type

### Success Criteria
✅ Static assets cached for 30 days  
✅ Homepage cached for 1 hour  
✅ Cache hit ratio > 85%  
✅ Health check endpoints NOT cached  

---

## Test Suite 6: Geolocation Routing

### Purpose
Verify users are routed to the nearest region based on their location.

### Test Using VPN

```bash
# Install OpenVPN or connect to VPN service

# 1. Connect to São Paulo VPN
vpn connect brazil
curl -s https://enem-pro.com/api/health-check | jq '.region'
# Expected: gru1 (or eu-west-1 if SA failing)

# 2. Connect to Frankfurt VPN
vpn connect germany
curl -s https://enem-pro.com/api/health-check | jq '.region'
# Expected: iad1-eu-west-1

# 3. Connect to New York VPN
vpn connect usa
curl -s https://enem-pro.com/api/health-check | jq '.region'
# Expected: iad1 (or gru1/iad1-eu-west-1 if US failing)
```

### Test Using Header Simulation

```bash
# Simulate Brazil geolocation
curl https://enem-pro.com/ \
  -H "CF-IPCountry: BR" \
  -v | grep "x-served-by"
# Expected: x-served-by: sa-east-1

# Simulate Germany geolocation
curl https://enem-pro.com/ \
  -H "CF-IPCountry: DE" \
  -v | grep "x-served-by"
# Expected: x-served-by: eu-west-1
```

### Success Criteria
✅ Brazilian users routed to SA  
✅ European users routed to EU  
✅ US users routed to US  
✅ Fallback works if region unavailable  

---

## Test Suite 7: End-to-End Load Test

### Purpose
Simulate realistic traffic from multiple regions simultaneously to test stability.

### Setup Artillery (Load Testing Tool)

```bash
npm install -g artillery

# Create load-test.yml
cat > load-test.yml << 'EOF'
config:
  target: "https://enem-pro.com"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "User Flow"
    flow:
      - get:
          url: "/"
      - think: 5
      - get:
          url: "/blog"
      - think: 3
      - get:
          url: "/api/health-check"
EOF
```

### Run Load Test

```bash
# Run load test
artillery run load-test.yml

# Expected metrics:
# - Response time p95: < 500ms
# - Error rate: < 1%
# - Throughput: > 100 req/s
```

### Analyze Results

```bash
# View detailed report
artillery run load-test.yml --output results.json
artillery report results.json
```

### Success Criteria
✅ < 1% error rate under load  
✅ Response time p95 < 500ms  
✅ Throughput > 100 req/s  
✅ No region-specific failures  

---

## Continuous Monitoring

### Setup Automated Health Checks

```bash
# Create cron job (every 5 minutes)
*/5 * * * * curl -s https://enem-pro.com/api/health-check | tee -a /var/log/health-check.log

# Monitor in real-time
tail -f /var/log/health-check.log | grep -v healthy
```

### Dashboard Monitoring

**Vercel Analytics:**
1. Dashboard → Project → Analytics → Regions
2. Watch for spikes in error rate

**Cloudflare Analytics:**
1. Dashboard → Domain → Analytics
2. Monitor cache hit ratio and response times

**Custom Metrics:**
```bash
# Run monitoring script
npm run monitor:regions

# Expected output every 5 minutes:
# ✓ sa-east-1: healthy (45ms)
# ✓ eu-west-1: healthy (125ms)
# ✓ us-east-1: healthy (85ms)
```

---

## Rollback Testing

### Purpose
Verify rollback procedures work in case of issues.

### Rollback Test Procedure

```bash
# 1. Disable multi-region in vercel.json
# Change regions to just: ["gru1"]

# 2. Deploy rollback
git add vercel.json
git commit -m "fix: rollback to single region"
git push origin main
vercel deploy --prod

# 3. Verify single region
curl https://enem-pro.vercel.app/api/health-check

# 4. Confirm only one region
vercel deployments --meta=region

# 5. Re-enable when ready
# Revert the vercel.json change and redeploy
```

### Success Criteria
✅ Rollback completes in < 5 minutes  
✅ No data loss during rollback  
✅ Service remains available  
✅ Can be re-deployed to multi-region  

---

## Test Results Documentation

### Record Test Results

```bash
# Create results file
cat > MULTI_REGION_TEST_RESULTS.md << 'EOF'
# Multi-Region Deployment Test Results

**Date:** 2026-10-27  
**Tester:** Your Name

## Test Results Summary

| Test | Status | Details |
|------|--------|---------|
| Health Checks | PASS | All 3 regions responding |
| Failover | PASS | <5s failover time |
| Latency (SA) | PASS | 45ms average |
| Latency (EU) | PASS | 125ms average |
| Database Replication | PASS | <5s lag |
| Cache Hit Ratio | PASS | 87% |
| Geolocation Routing | PASS | Correct routing observed |
| Load Test | PASS | <1% error rate |

## Performance Comparison

**Before:** Single region (300ms average latency)  
**After:** Multi-region (SA 45ms, EU 125ms, US 85ms)  
**Improvement:** 60-70% latency reduction by region  

## Sign-Off

- Tested by: Your Name
- Date: 2026-10-27
- Status: APPROVED FOR PRODUCTION
EOF
```

---

## Troubleshooting Failed Tests

### Health Check Failing

```bash
# Debug step 1: Check endpoint exists
curl -v https://enem-pro-gru.vercel.app/api/health-check

# Debug step 2: Check Supabase connectivity
curl -I https://your-project.supabase.co/rest/v1/

# Debug step 3: View Vercel logs
vercel logs --since=30m --tail

# Fix: Update environment variables in Vercel
vercel env list --prod
vercel env add SUPABASE_ANON_KEY
```

### Failover Not Working

```bash
# Debug step 1: Check Cloudflare Worker
curl -I https://enem-pro.com/api/health-check

# Debug step 2: Verify route
# In Cloudflare: Domain → Workers → Routes

# Debug step 3: Check circuit breaker logic
# Verify /api/failover-test?action=status returns correct activeRegion

# Fix: Redeploy Cloudflare Worker
wrangler publish --env production
```

### Latency Higher Than Expected

```bash
# Debug: Check where slowness occurs
curl -w "@curl-format.txt" -o /dev/null -s https://enem-pro.com/

# Check content:
# time_namelookup + time_connect = network latency
# time_starttransfer - time_connect = server processing
# time_total - time_starttransfer = content transfer

# If network latency high: Check CDN/network
# If server processing high: Optimize API endpoints
# If transfer high: Enable compression, optimize assets
```

---

## Final Checklist

- [ ] All health checks passing
- [ ] Failover tests successful
- [ ] Latency improvements documented
- [ ] Cache hit ratio > 85%
- [ ] Database replication synced
- [ ] Geolocation routing verified
- [ ] Load testing successful
- [ ] Monitoring dashboards active
- [ ] Team trained on runbook
- [ ] Deployment approved

---

**Document Version:** 1.0  
**Last Updated:** 2026-10-27
