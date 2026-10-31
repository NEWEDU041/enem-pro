# Runbook: Production Deployment — enem-pro

**Status:** Production-Ready  
**Last Updated:** 2026-10-27  
**Audience:** DevOps, Release Manager, SRE  
**SLA:** Zero-downtime deployment (blue-green + canary)

---

## 🎯 Quick Reference

| Step | Tool | Time | Risk |
|------|------|------|------|
| 1. Pre-flight checks | Script | 5 min | ⬜ Low |
| 2. Build & test | Vercel CI | 15 min | ⬜ Low |
| 3. Canary (5% traffic) | Cloudflare | 10 min | 🟨 Medium |
| 4. Canary (25% traffic) | Cloudflare | 15 min | 🟨 Medium |
| 5. Full rollout (100%) | Cloudflare | 5 min | 🟨 Medium |
| 6. Monitoring (2h) | Sentry + Grafana | 120 min | 🟥 High (during) |
| **Total** | — | ~170 min | — |

---

## ✅ Phase 1: Pre-Flight Checks (5 min)

### 1.1 Verify Git Status

```bash
cd /root/projetos/enem-pro

# Ensure main branch is clean
git status
# Expected: "On branch main ... nothing to commit, working tree clean"

# Verify commit is signed
git log -1 --pretty=format:"%G? %h %s"
# Expected: G or U flag (signed by GPG key)

# Check no uncommitted changes in docs/
git diff -- docs/
# Expected: empty (no changes to revert)
```

### 1.2 Verify Environment & Secrets

```bash
# Check Vercel production environment
vercel env ls --prod

# Expected variables present:
# ✓ DATABASE_URL
# ✓ SUPABASE_SERVICE_ROLE_KEY
# ✓ REDIS_URL (for multi-region failover)
# ✓ SENTRY_DSN (for error tracking)
# ✓ STRIPE_SECRET_KEY (for checkout)

# If missing, add via:
# vercel env add DATABASE_URL <value> --prod
```

### 1.3 Verify Recent Tests

```bash
# Run full test suite (must pass)
npm test -- --run --coverage

# Expected output:
# PASS  vitest/unit/checkout.spec.ts
# PASS  vitest/unit/portal.spec.ts
# PASS  vitest/e2e/checkout.e2e.ts
# Coverage: > 80%
```

### 1.4 Verify Database Health

```bash
# Check Supabase connection
curl -s "https://$(echo $NEXT_PUBLIC_SUPABASE_URL | cut -d/ -f3)/rest/v1/" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | head -c 100

# Expected: JSON response with version info

# Check replication lag (multi-region setup)
curl -s http://localhost:3000/api/health-check | jq '.checks'
# Expected: all true, latencies < 500ms
```

---

## 🏗️ Phase 2: Build & Test (15 min)

### 2.1 Trigger Vercel Build

```bash
# Push code to main branch (CI auto-triggers)
git push origin main

# OR manually trigger:
vercel deploy --prod

# Monitor build in Vercel Dashboard:
# https://vercel.com/projects/enem-pro
```

### 2.2 Monitor Build Progress

```bash
# Wait for "Deployment Successful" message
# Check build logs for:
# ✓ ESLint: 0 errors
# ✓ Next.js build: > 600 routes optimized
# ✓ Bundle size: < 2.5MB (total JS)

# Build typically takes 8-12 minutes
```

### 2.3 Verify Build Artifacts

```bash
# Once build completes, check:
vercel inspect <deployment-url> --prod

# Expected:
# - Status: READY
# - Functions: 12+ API routes
# - Static pages: 400+ cached
# - Regions: iad1, iad1-eu-west-1, gru1 (multi-region)
```

---

## 🔄 Phase 3: Canary Rollout (30 min total)

### 3.1 Start Canary Phase 1 (5% Traffic)

```bash
# Update Cloudflare Worker to route 5% to new version
# File: /root/projetos/enem-pro/public/cf-worker-failover.ts
# Update: CANARY_PERCENTAGE = 5

wrangler publish

# Verify canary is live:
curl -v https://enem-pro.com/api/health-check

# Expected header:
# x-canary-version: <new-version>
# x-traffic-percentage: 5%
```

### 3.2 Monitor Canary Phase 1 (10 min)

**Watch these metrics (should be stable):**

```bash
# Terminal 1: Watch P95 latency
watch -n 5 'curl -s http://localhost:3000/api/metrics/performance | jq ".p95"'

# Terminal 2: Watch error rate (Sentry)
# Open: https://sentry.io/projects/enem-pro/
# Look for: new errors, exceptions, 5xx responses
# Expected: Error rate stable (±1% variance)

# Terminal 3: Watch database replication lag
watch -n 10 'curl -s http://localhost:3000/api/health-check | jq ".latency"'
```

**If all stable after 10 min → proceed to Phase 2**

**If errors detected:**
```bash
# ROLLBACK: Revert Cloudflare Worker
CANARY_PERCENTAGE = 0
wrangler publish

# Check error logs:
# 1. Sentry: https://sentry.io/projects/enem-pro/
# 2. Vercel: https://vercel.com/projects/enem-pro/logs
# 3. Database: Check Supabase audit logs for slow queries

# DO NOT proceed until root cause identified
```

### 3.3 Start Canary Phase 2 (25% Traffic)

```bash
# Update Cloudflare Worker
CANARY_PERCENTAGE = 25
wrangler publish

# Monitor for 15 min using same commands as Phase 1
# Expected: P95 variance +2-3%, error rate < 0.5%
```

### 3.4 Verify Canary Metrics

```bash
# Check aggregated metrics across 30 min canary period:
curl -s http://localhost:3000/api/metrics/deployment-report | jq '
  {
    p50: .latency.p50,
    p95: .latency.p95,
    error_rate: .errors.rate,
    successful_requests: .requests.success,
    failed_requests: .requests.failed,
    canary_vs_baseline: .comparison
  }'

# Expected output:
# {
#   "p50": "85ms",      (vs baseline 89ms, OK)
#   "p95": "347ms",     (vs baseline 426ms, BETTER)
#   "error_rate": "0.2%", (vs baseline 0%, OK)
#   "successful_requests": 2847,
#   "failed_requests": 6,
#   "canary_vs_baseline": "SAFE_TO_PROCEED"
# }
```

---

## 🚀 Phase 4: Full Rollout (5 min)

### 4.1 Promote Canary to 100%

```bash
# Update Cloudflare Worker
CANARY_PERCENTAGE = 100
wrangler publish

# Verify traffic switched:
curl -v https://enem-pro.com/api/health-check | grep x-traffic

# Expected: x-traffic-percentage: 100%
```

### 4.2 Clean Up Canary Configuration

```bash
# Once 100% stable for 30 seconds, remove canary config:
CANARY_PERCENTAGE = 0  # Disable flag
DEPLOYMENT_STABLE = true

wrangler publish
```

---

## 📊 Phase 5: Production Monitoring (120 min)

### 5.1 Set Up Monitoring Dashboard

```bash
# Open Grafana dashboard:
# http://localhost:3000/grafana/d/enem-pro-deployment

# Pin these charts to main view:
1. P95 Latency (baseline: 426ms, target: < 500ms)
2. Error Rate (baseline: 0%, target: < 1%)
3. Database Query Times (target: < 100ms p95)
4. Cache Hit Rate (target: > 80%)
5. CPU usage across regions (target: < 60%)
6. Memory usage (target: < 70%)
```

### 5.2 Set Up Alert Rules

```bash
# Alert if P95 latency > 600ms for 2 consecutive minutes:
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "high_latency_post_deploy",
    "condition": "p95_latency > 600ms",
    "duration": "2m",
    "severity": "critical",
    "actions": ["slack", "email", "page_oncall"]
  }'

# Alert if error rate > 2%:
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "high_error_rate_post_deploy",
    "condition": "error_rate > 2%",
    "duration": "1m",
    "severity": "critical"
  }'
```

### 5.3 Run Production Smoke Tests

```bash
# Check critical user flows work end-to-end
curl -X POST http://localhost:3000/api/smoke-tests \
  -H "Content-Type: application/json" \
  -d '{
    "flows": ["blog_view", "search", "portal_login", "checkout"],
    "iterations": 10,
    "concurrent_users": 5
  }'

# Expected: All flows pass, latencies < 1s
```

### 5.4 2-Hour Monitoring Checklist

Track every 15 minutes:

```markdown
## 2026-10-27 14:00-16:00 Monitoring Log

| Time | P95 (ms) | Errors | Cache Hit | CPU | Notes |
|------|----------|--------|-----------|-----|-------|
| 14:00 | 347 | 0.1% | 82% | 35% | Deploy complete ✓ |
| 14:15 | 351 | 0.0% | 83% | 38% | Normal traffic ramping |
| 14:30 | 356 | 0.2% | 84% | 42% | **Alert: High latency spike** → investigated cache → OK |
| 14:45 | 349 | 0.1% | 85% | 40% | Back to normal |
| 15:00 | 348 | 0.0% | 86% | 39% | Stable |
| ... | ... | ... | ... | ... | ... |
| 16:00 | 352 | 0.1% | 85% | 38% | **Deployment successful ✓** |
```

---

## 🔄 Rollback Procedure (Emergency)

### If errors detected during canary or monitoring:

```bash
# Step 1: Immediate canary stop
CANARY_PERCENTAGE = 0
DEPLOYMENT_STABLE = false
wrangler publish

# Step 2: Route all traffic back to previous version
# Vercel automatically maintains previous deployment
git revert HEAD
git push origin main

# Step 3: Monitor recovery
# Wait 5 min for traffic to settle
curl -s http://localhost:3000/api/health-check

# Step 4: Investigate root cause
# Check logs: Sentry, Vercel, database
# Document findings in: .claude/decision-traces/deployment-rollback-<date>.md

# Step 5: DO NOT redeploy until root cause fixed
```

---

## 📋 Post-Deployment Checklist

After 2-hour monitoring window, verify:

```bash
# ✓ Error rate < 0.5% sustained
# ✓ P95 latency < 500ms sustained  
# ✓ Cache hit rate > 80% sustained
# ✓ No critical Sentry alerts
# ✓ Database replication lag < 5s
# ✓ All 3 regions healthy (health-check passing)
# ✓ User-facing features tested (portal, search, checkout)

# Sign off on deployment:
vercel deployments --prod | head -1
# Copy deployment ID and add to deployment log

echo "DEPLOYMENT VERIFIED: $(date)" >> /root/projetos/enem-pro/.claude/analytics/deployment-log.md
```

---

## 🆘 Troubleshooting

### Issue: Build fails with ESLint errors

**Solution:**
```bash
npm run lint -- --fix
git add .
git commit -m "fix: ESLint issues before deployment"
git push origin main
```

### Issue: Canary P95 latency spikes to 800ms

**Solution:**
```bash
# 1. Check if database is slow
curl -s http://localhost:3000/api/metrics/database | jq '.slow_queries'

# 2. Check if Redis cache is full
redis-cli INFO memory

# 3. Check if new code has N+1 queries
# Inspect ./app/api/<endpoint>/route.ts for loops + queries

# 4. If code issue: rollback immediately
git revert HEAD
git push origin main
```

### Issue: Error rate jumps to 5% during canary

**Solution:**
```bash
# 1. Get error details
curl -s https://sentry.io/api/0/projects/enem-pro/events/ \
  -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" | jq '.[] | {message, exception}'

# 2. Check if external service is down
# - Anthropic API: https://status.anthropic.com
# - Stripe: https://status.stripe.com
# - Supabase: https://status.supabase.com

# 3. If API key issue: verify env vars in Vercel
vercel env ls --prod

# 4. Rollback and investigate
```

---

## 📚 Related Runbooks

- [Incident Response](./INCIDENT.md)
- [Performance Debugging](./PERF_DEBUG.md)
- [On-Call Operations](./ON_CALL.md)

## 📞 Escalation

| Severity | Owner | Contact | Response Time |
|----------|-------|---------|---|
| Critical (error > 5%) | On-call SRE | Slack #alerts | 5 min |
| High (latency > 1s) | Backend Lead | Slack #ops | 15 min |
| Medium (degradation) | DevOps | Hermes task | 30 min |
| Low (warning) | Team | Slack thread | 24h |

---

**Last Tested:** 2026-10-27 (v0.1.1)  
**Approver:** Infrastructure Team  
**Version:** 1.0
