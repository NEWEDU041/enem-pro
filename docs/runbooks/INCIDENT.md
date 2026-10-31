# Runbook: Incident Response — enem-pro

**Status:** Production-Ready  
**Last Updated:** 2026-10-27  
**Audience:** On-call SRE, Backend Team, Product  
**Goal:** Resolve incidents in < 15 min

---

## 🚨 Quick Decision Tree

```
INCIDENT DETECTED
  │
  ├─ Is it an outage (status page red)?
  │  ├─ YES → Go to: OUTAGE RESPONSE (Section 1)
  │  └─ NO → Continue...
  │
  ├─ Is error rate > 5% in Sentry?
  │  ├─ YES → Go to: ERROR SPIKE (Section 2)
  │  └─ NO → Continue...
  │
  ├─ Is P95 latency > 1000ms?
  │  ├─ YES → Go to: PERFORMANCE DEGRADATION (Section 3)
  │  └─ NO → Continue...
  │
  └─ Is a specific user/feature broken?
     ├─ YES → Go to: USER-FACING BUG (Section 4)
     └─ NO → Go to: MONITORING ALERT (Section 5)
```

---

## 1️⃣ OUTAGE RESPONSE (P1)

**Severity:** 🔴 Critical  
**SLA:** 5 min response, 15 min mitigation

### 1.1 First 60 Seconds: Acknowledge & Gather Context

```bash
# 1. Acknowledge in Slack #alerts
@channel INCIDENT: P1 OUTAGE DETECTED
  - Status: RED / DOWN
  - Impact: <% users affected>
  - Started: <timestamp>
  - On-call owner: <your name>

# 2. Check Vercel deployment status
curl -s https://status.vercel.com/api/v2/status.json | jq '.status'

# 3. Check all region health
curl -s http://localhost:3000/api/health-check | jq '{
  status: .status,
  region: .region,
  checks: .checks
}'

# 4. Gather incident context
# Check 3 key sources:
A. Sentry: https://sentry.io/projects/enem-pro/
   Look for: New exceptions, repeated errors, stack traces
B. Vercel Logs: https://vercel.com/projects/enem-pro/logs
   Look for: Deployment failures, function errors, timeouts
C. Database: Supabase dashboard → Monitoring
   Look for: Connection pool exhausted, replication lag > 60s
```

### 1.2 Minutes 1-5: Root Cause Analysis (RCA)

**Most likely causes (by frequency):**

| Cause | Check | Fix |
|-------|-------|-----|
| **Database down/lag** | `curl /api/health-check \| jq .checks.database` | Failover to read replica OR restart pool |
| **Redis/Cache down** | `redis-cli ping` | Restart Redis OR disable caching layer |
| **API key expired** | Check Sentry for `401 Unauthorized` | Rotate API key in Vercel env |
| **Deployment rollout crashed** | Vercel logs → latest build | Revert to previous version |
| **External service down** | Check Anthropic/Stripe status | Use circuit breaker OR queue requests |
| **Rate limiting triggered** | Check logs for `429 Too Many Requests` | Increase rate limit OR whitelist internal IPs |

**RCA command sequence:**

```bash
# Check deployment status (most common cause)
vercel status --prod
# If: "Deployment Failed" → IMMEDIATE ROLLBACK:
git revert HEAD
git push origin main

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;" 
# If: timeout → Database down

# Check Redis
redis-cli -u $REDIS_URL ping
# If: connection refused → Redis down

# Check for cascading failures
curl -s http://localhost:3000/api/admin/incident-status | jq '
  {
    error_count: .errors.total,
    error_types: .errors.by_type,
    affected_endpoints: .endpoints.failing,
    external_services: .external.status
  }'
```

### 1.3 Minutes 5-15: Mitigation

**Choose mitigation based on root cause:**

#### **If deployment crash:**
```bash
# Immediate rollback
git log -1 --pretty=format:"%h %s"  # Note current commit
git revert HEAD
git push origin main

# Monitor recovery for 2 min
watch -n 2 'curl -s http://localhost:3000/api/health-check | jq ".status"'
# Expected: "healthy" within 2 min
```

#### **If database down:**
```bash
# Option A: Failover to read replica (if configured)
curl -X POST http://localhost:3000/api/admin/failover \
  -d '{"target": "eu-west-1"}' \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Option B: Restart database connection pool
npm run db:restart-pool

# Verify connectivity
curl -s http://localhost:3000/api/health-check | jq '.checks.database'
# Expected: true
```

#### **If Redis down:**
```bash
# Option A: Restart Redis
redis-cli SHUTDOWN
redis-server &

# Option B: Disable caching temporarily
# Update .env.production.local:
# CACHE_ENABLED=false
# Restart: npm run start

# Verify
curl -s http://localhost:3000/api/health-check | jq '.checks.cache'
```

#### **If external API failing:**
```bash
# Activate circuit breaker
curl -X POST http://localhost:3000/api/admin/circuit-breaker \
  -d '{"service": "anthropic", "state": "open"}' \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# This will:
# - Return cached responses for users
# - Queue failed requests to retry later
# - Show degraded UI (no new API calls)

# Once external service recovers:
curl -X POST http://localhost:3000/api/admin/circuit-breaker \
  -d '{"service": "anthropic", "state": "closed"}' \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 1.4 Recovery Verification

Once mitigation applied, wait 2 min then verify:

```bash
# Check health across all regions
for region in gru1 iad1-eu-west-1 iad1; do
  echo "=== Region: $region ==="
  curl -s http://localhost:3000/api/health-check?region=$region | jq '.status'
done

# Check user-facing flows
curl -X POST http://localhost:3000/api/smoke-tests \
  -d '{"flows": ["blog_view", "portal_login"], "concurrent": 10}' | jq '.passed'
# Expected: 10/10

# Check error rate back to < 1%
curl -s http://localhost:3000/api/metrics/errors | jq '.rate'

# Update status page
curl -X POST https://manage.statuspage.io/api/v1/pages/status \
  -H "Authorization: OAuth $STATUSPAGE_TOKEN" \
  -d '{"status": "investigating"}' # Or "identified", "monitoring", "resolved"
```

---

## 2️⃣ ERROR SPIKE (P2)

**Severity:** 🟠 High  
**SLA:** 15 min response, 30 min fix  
**Trigger:** Error rate > 5% OR > 100 errors/min

### 2.1 Immediate Assessment (2 min)

```bash
# Get error breakdown
curl -s https://sentry.io/api/0/projects/enem-pro/stats/ \
  -H "Authorization: Bearer $SENTRY_TOKEN" | jq '{
    total_errors: .stats.total,
    errors_per_minute: .stats.rate,
    top_errors: .errors[0:5] | map({message, count})
  }'

# Example response:
# {
#   "total_errors": 487,
#   "errors_per_minute": 24,
#   "top_errors": [
#     {"message": "ValidationError: Invalid email", "count": 245},
#     {"message": "TimeoutError: Database query", "count": 156},
#     {"message": "TypeError: Cannot read property 'id'", "count": 86}
#   ]
# }

# Check if errors are in new code or infrastructure
git log --oneline -5
# If deployed < 30 min ago → likely new code

# Check which endpoints are failing
curl -s http://localhost:3000/api/metrics/errors?by=endpoint | jq '.[] | {endpoint, error_rate}'
```

### 2.2 Root Cause Analysis

**By error type:**

```bash
# ValidationError: Invalid input
# → Check if input validation rules changed in recent code
# → Check client-side code sending invalid data
grep -r "ValidationError" app/ lib/

# TimeoutError: Database query  
# → Check if database is slow (see Section 3)
# → Check if N+1 queries introduced
# → Check if indexes missing

# TypeError: Null reference
# → Check recent code changes in that file
# → Check if data migration incomplete
# → Check if optional chaining (?) removed
```

### 2.3 Mitigation

**Option A: Revert if code change caused it**
```bash
# Check last deployment time
vercel deployments --prod | head -1

# If deployed < 30 min ago and error spike coincides:
git revert HEAD
git push origin main
```

**Option B: Fix in-place if external cause**
```bash
# If error is from Anthropic API:
# → Check status.anthropic.com
# → Enable circuit breaker (see Section 1.3)

# If error is from database:
# → Check Supabase status and logs
# → Kill long-running queries:
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE duration > interval '5 minutes';

# If error is from validation:
# → Check if client validation in browser is catching bad data
# → Add logging to see what data is being sent:
curl -s http://localhost:3000/api/metrics/validation-sample | jq '.failed_requests[0:3]'
```

### 2.4 Verify Recovery

```bash
# Error rate back to baseline
curl -s http://localhost:3000/api/metrics/errors | jq '.rate'
# Expected: < 1%

# Spot check a few error traces in Sentry
# https://sentry.io/projects/enem-pro/issues/
# Ensure they are old errors, not new ones
```

---

## 3️⃣ PERFORMANCE DEGRADATION (P2)

**Severity:** 🟠 High  
**SLA:** 30 min response, 60 min fix  
**Trigger:** P95 latency > 1000ms OR database query > 500ms

### 3.1 Initial Diagnosis (5 min)

```bash
# Check current latency distribution
curl -s http://localhost:3000/api/metrics/performance | jq '{
  p50: .latency.p50,
  p95: .latency.p95,
  p99: .latency.p99,
  max: .latency.max,
  baseline: .baseline
}'

# Check database query times
curl -s http://localhost:3000/api/metrics/database | jq '{
  slow_queries: .slow | length,
  top_slow: .slow[0:3] | map({query: .query[0:80], duration: .duration})
}'

# Check cache hit rate
curl -s http://localhost:3000/api/metrics/cache | jq '{
  hit_rate: .hit_rate,
  entries: .entries,
  memory_used: .memory_mb
}'

# Check which endpoints are slow
curl -s http://localhost:3000/api/metrics/performance?by=endpoint | jq '.[] | select(.p95 > 500) | {endpoint, p95, p99}'
```

### 3.2 Common Causes & Fixes

| Cause | Indicator | Fix |
|-------|-----------|-----|
| **Database slow queries** | `slow_queries > 0`, query duration > 500ms | Add index OR kill long query |
| **Cache miss spike** | `hit_rate < 60%` | Warm cache OR increase TTL |
| **N+1 queries** | Single endpoint calls DB 50+ times | Refactor to batch query |
| **Connection pool exhausted** | Connection timeouts in logs | Increase pool size OR find connection leak |
| **External API slow** | Latency spike only on endpoints using Anthropic | Check anthropic status OR add timeout |
| **GC/Memory pressure** | Memory spike before latency spike | Restart process OR reduce cache size |

### 3.3 Investigation Commands

```bash
# Find the slow query
psql $DATABASE_URL -c "
  SELECT query, calls, mean_time, max_time 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 5;"

# Find N+1 patterns (same query called multiple times)
curl -s http://localhost:3000/api/metrics/database?pattern=n+1 | jq '.n_plus_one_queries'

# Check if cache is being used
redis-cli INFO stats | grep "keyspace_hits\|keyspace_misses"
# Calculate: hits / (hits + misses) > 0.80

# Check connection pool status
curl -s http://localhost:3000/api/metrics/database?pool=true | jq '{
  available: .pool.available,
  in_use: .pool.in_use,
  total: .pool.total,
  waiting: .pool.waiting
}'
```

### 3.4 Apply Fixes

**Add missing index:**
```bash
# If slow query is like: SELECT * FROM users WHERE email = $1
# Create index:
psql $DATABASE_URL -c "CREATE INDEX CONCURRENTLY idx_users_email ON users(email);"

# Verify index created:
psql $DATABASE_URL -c "SELECT * FROM pg_stat_user_indexes WHERE relname = 'users';"

# Check if query now uses index:
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
# Look for "Index Scan" instead of "Seq Scan"
```

**Warm Redis cache:**
```bash
npm run cache:warm
# This pre-populates Redis with high-traffic keys
# Expected: cache hit rate jumps to > 85%
```

**Restart process if stuck in GC:**
```bash
# Check if Node process memory keeps growing
watch -n 2 'ps aux | grep node | grep -v grep'

# If memory > 80% of available:
npm run stop
npm run start

# Monitor latency recovery
watch -n 5 'curl -s http://localhost:3000/api/metrics/performance | jq ".latency.p95"'
```

### 3.5 Recovery Check

```bash
# P95 back to baseline
curl -s http://localhost:3000/api/metrics/performance | jq '.latency.p95'
# Expected: < 500ms (from 1000+ms)

# Verify users experience improvement
# Check in Grafana dashboard for sustained improvement over 5 min
```

---

## 4️⃣ USER-FACING BUG (P3)

**Severity:** 🟡 Medium  
**SLA:** 1h response, same-day fix

### 4.1 Triage (5 min)

```bash
# Get user report details
# Source 1: Slack #user-issues channel
# Source 2: Sentry user feedback
curl -s https://sentry.io/api/0/projects/enem-pro/user-feedback/ \
  -H "Authorization: Bearer $SENTRY_TOKEN" | jq '.[] | {user_email, comments, affected_page}'

# Search codebase for bug
grep -r "<affected_feature>" app/components/ lib/
# Example: grep -r "portal-login" app/

# Check recent commits
git log --oneline --grep="<feature>" | head -5
```

### 4.2 Reproduce Locally

```bash
# Set up local environment
npm install
npm run dev

# Reproduce user steps
# Example: "Portal login button not responding"
# 1. Go to http://localhost:3000/portal
# 2. Click "Login"
# 3. Expected: Login form appears
# 4. Actual: Button changes but no form

# If reproduced: Bug is in code
# If NOT reproduced: Bug may be environment-specific (cache, cookies, etc)

# Check browser console for errors
# Open DevTools → Console → Check for JavaScript errors
```

### 4.3 Fix & Test

```bash
# Identify affected file(s)
# Example: app/components/portal/LoginButton.tsx

# Review recent changes
git log -p -- app/components/portal/LoginButton.tsx | head -100

# Make minimal fix
# Example: Add missing onClick handler

# Test fix locally
npm run test -- app/components/portal/LoginButton.spec.ts

# Test broader impact
npm test -- --run

# If all pass, commit and deploy
git add .
git commit -m "fix: portal login button not responding [USER-BUG-#123]"
git push origin main
```

---

## 5️⃣ MONITORING ALERT (P4)

**Severity:** ⚪ Low  
**SLA:** 24h response  
**Examples:** Warning-level CPU spike, slow non-critical endpoint

### 5.1 Assessment

```bash
# Get alert details from Grafana
# http://localhost:3000/grafana/d/enem-pro-alerts

# Determine if actionable
# - Is it affecting users? NO → log and move on
# - Is it a trend (growing over time)? YES → schedule optimization
# - Is it a one-off spike? YES → probably harmless

# Create issue for later
echo "Low-priority optimization: <alert summary>" | \
  gh issue create --title "perf: <summary>" --labels "performance" --body -
```

### 5.2 Log Alert

```bash
# Add to monitoring log
echo "$(date): Alert <name> - <status> - <owner>" >> /root/projetos/enem-pro/.claude/analytics/alerts-log.md
```

---

## 📋 Incident Closure Checklist

After incident resolved:

```markdown
## Incident: <name> [<date>]

### Resolution
- Root cause: <explanation>
- Time to detect: <minutes>
- Time to mitigate: <minutes>
- User impact: <X% users affected for Y minutes>

### Verification
- [ ] Health check passing in all regions
- [ ] Error rate < 1%
- [ ] P95 latency < 500ms
- [ ] No new Sentry alerts
- [ ] Users reporting normal experience

### Post-Mortem
- [ ] Root cause documented in .claude/decision-traces/
- [ ] Issue created for preventive fix
- [ ] Runbook updated if needed

### Owner
- Incident lead: <name>
- Date resolved: <timestamp>
```

---

## 🆘 Escalation Matrix

| Severity | Owner | Escalate After | Contact |
|----------|-------|---|---|
| 🔴 P1 (Outage) | On-call SRE | — | Immediate: Slack, Phone, SMS |
| 🟠 P2 (Degradation) | Backend Lead | 30 min | Slack, Email |
| 🟡 P3 (Bug) | Assigned Dev | 4h | Slack, Hermes task |
| ⚪ P4 (Warning) | Team | 24h | Slack thread |

---

**Last Tested:** 2026-10-27  
**Approver:** SRE Lead  
**Version:** 1.0
