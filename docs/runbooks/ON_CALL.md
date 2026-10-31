# Runbook: On-Call Operations — enem-pro

**Status:** Production-Ready  
**Last Updated:** 2026-10-27  
**Audience:** On-call SRE, Shift Rotation, Backup Engineering

---

## 📞 On-Call Shift Checklist

### Start of Shift (5 min)

```bash
# 1. Acknowledge Slack on-call channel
@oncall I'm taking over shift from <previous name>. All systems green? 
# Expected: Previous on-call confirms handoff

# 2. Review incident log from past 24h
cat /root/projetos/enem-pro/.claude/analytics/alerts-log.md | tail -20

# 3. Check for any ongoing issues
curl -s http://localhost:3000/api/metrics/current-status | jq '{
  incidents: .incidents,
  alerts_active: .alerts.active | length,
  critical: .alerts | map(select(.severity == "critical")) | length
}'

# 4. Verify monitoring dashboards are loaded
# http://localhost:3000/grafana/d/enem-pro-dashboard (keep open in tab)
# http://sentry.io/projects/enem-pro/ (keep open in tab)
# Vercel logs: https://vercel.com/projects/enem-pro/logs

# 5. Update on-call status in Slack profile
/me enem-pro on-call (until <end-time> UTC)

# 6. Test alert channels work
# Send test alert to yourself:
curl -X POST http://localhost:3000/api/admin/test-alert \
  -d '{"channel": "slack"}' \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Expected: Test alert arrives in Slack
```

---

## 🔔 Alert Triage Guide

### Alert: "High Error Rate"

**Severity:** 🔴 Critical if > 5%  
**Action:** See [INCIDENT.md](./INCIDENT.md) Section 2

```bash
curl -s https://sentry.io/api/0/projects/enem-pro/stats/ \
  -H "Authorization: Bearer $SENTRY_TOKEN" | jq '.stats | {rate, total}'
```

### Alert: "High Latency"

**Severity:** 🟠 High if P95 > 1000ms  
**Action:** See [PERF_DEBUG.md](./PERF_DEBUG.md)

```bash
curl -s http://localhost:3000/api/metrics/performance | jq '.latency.p95'
```

### Alert: "Database Replication Lag"

**Severity:** 🟡 Medium if > 30s  
**Action:**

```bash
# Check lag
curl -s http://localhost:3000/api/health-check | jq '.latency.database'

# If > 100ms:
# 1. Check Supabase status: https://status.supabase.com
# 2. If status green: Contact Supabase support
# 3. Route traffic to read replica temporarily
curl -X POST http://localhost:3000/api/admin/failover \
  -d '{"target": "eu-west-1"}' \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Alert: "Memory Usage High"

**Severity:** 🟡 Medium if > 85%  
**Action:**

```bash
# Check current memory
ps aux | grep "node.*next" | grep -v grep | awk '{print $6}'  # Memory in KB

# If process > 800MB:
# Option A: Restart process (5-10 min downtime)
npm run stop && npm run start

# Option B: Enable garbage collection aggressively (no downtime)
curl -X POST http://localhost:3000/api/admin/gc \
  -d '{"aggressive": true}' \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Monitor recovery
watch -n 5 'curl -s http://localhost:3000/api/metrics/memory | jq ".process_mb"'
```

### Alert: "Low Cache Hit Rate"

**Severity:** ⚪ Low (information only)  
**Action:**

```bash
# Check hit rate
redis-cli INFO stats | grep keyspace_hits

# If < 60%:
# 1. Warm cache with high-traffic keys
npm run cache:warm

# 2. Or increase cache TTL (only if keys are stable)
# Edit: lib/cache.ts
# Change: DEFAULT_TTL = 1800  → 3600 (30 min to 1 hour)
```

---

## 📊 Daily On-Call Tasks

### Every Hour: Check System Health

```bash
# 1. Error rate
curl -s http://localhost:3000/api/metrics/errors | jq '.rate'
# Expected: < 1%

# 2. P95 latency
curl -s http://localhost:3000/api/metrics/performance | jq '.latency.p95'
# Expected: < 500ms

# 3. Database connections
curl -s http://localhost:3000/api/metrics/database | jq '.pool | {available, in_use, total}'
# Expected: in_use < 15 (of 20 max)

# 4. Cache hit rate
redis-cli INFO stats | grep -E "hits|misses"
# Expected: > 80% hit rate

# 5. Region health (multi-region)
for region in gru1 iad1 iad1-eu-west-1; do
  status=$(curl -s http://localhost:3000/api/health-check?region=$region | jq '.status')
  echo "$region: $status"
done
# Expected: All "healthy"
```

### Every 4 Hours: Review Logs

```bash
# 1. Sentry errors
curl -s https://sentry.io/api/0/projects/enem-pro/issues/ \
  -H "Authorization: Bearer $SENTRY_TOKEN" | jq '.[] | select(.isUnresolved) | {title, count}'

# 2. Slow queries (top 5)
curl -s http://localhost:3000/api/metrics/database | jq '.slow[0:5] | map({query: .query[0:60], duration})'

# 3. Log alerts triggered
curl -s http://localhost:3000/api/alerts?status=triggered | jq '.[] | {name, severity, timestamp}'

# 4. Deployment history
git log --oneline -10 | head -5
vercel deployments --prod | head -3
```

### End of Shift: Handoff

```bash
# 1. Summarize incident log
cat > /tmp/shift-summary.md << EOF
## On-Call Shift Summary: $(date +%Y-%m-%d)

**On-call:** $(whoami)  
**Duration:** <start> - $(date -u)

### Incidents Handled
- None / 1 / <count>

### Alerts Triggered
- <alert name>: <resolution>

### Metrics Summary
- Error rate: < 0.5% ✓
- P95 latency: < 400ms ✓
- Cache hit rate: > 85% ✓

### Action Items for Next Shift
- None / [ ] <action>

### Notes for Successor
<Any context the next on-call should know>
EOF

# 2. Post handoff in Slack
cat /tmp/shift-summary.md | \
  post-to-slack --channel #on-call-handoff

# 3. Acknowledge next on-call
@next-on-call-name Ready for handoff when you are
```

---

## 🚨 Emergency Contact Tree

If alerts not responding, escalate:

```
Level 1 (You): On-call SRE
  └─ Try: Verify it's real issue (not flaky monitoring)
  └─ Try: Apply runbook fix
  └─ Timeout: 15 min → go to Level 2

Level 2: Backend Team Lead
  └─ Contact: Slack @backend-lead
  └─ Contact: Phone (from on-call contact sheet)
  └─ Timeout: 20 min → go to Level 3

Level 3: Engineering Manager
  └─ Contact: @eng-manager
  └─ Contact: Emergency number
  └─ Timeout: 30 min → go to Level 4

Level 4: VP Engineering
  └─ Full escalation (likely production outage)
```

---

## 📱 On-Call Communication

### For non-critical alerts:

```
Slack post in #eng-status:
"⚠️ Warning: <alert name> detected
  Severity: Medium
  Action taken: <what you did>
  Status: Resolved / Investigating
  Updates: See Slack thread for details"
```

### For critical incidents:

```
1. Immediately post in #incidents:
   "@channel 🚨 INCIDENT: <name>
    Status: Investigating
    Impact: <% users or which feature>
    ETA to fix: <estimate>"

2. Every 5 min, update thread with status:
   "Update 5 min: Found root cause. Applying fix now..."
   "Update 10 min: Fix applied, monitoring recovery..."
   "Update 15 min: Incident resolved ✓"
```

---

## 🛡️ Incident Prevention

While on-call, proactively watch for:

```bash
# 1. Gradual latency increase (canary sign of issues)
watch -n 60 'curl -s http://localhost:3000/api/metrics/performance | jq ".latency.p95"'
# If trending upward: Apply PERF_DEBUG runbook

# 2. Error rate at 0.5-1% (early warning)
# Don't wait for it to spike to 5%
# Apply INCIDENT runbook preventively

# 3. Deployment about to rollout
# Ask: Has it been tested on staging?
# Ask: Do we have rollback plan?
# Be ready to rollback at first sign of issues

# 4. External service degradation
# Check: https://status.anthropic.com, https://status.stripe.com
# If degraded: Enable circuit breaker proactively
curl -X POST http://localhost:3000/api/admin/circuit-breaker \
  -d '{"service": "anthropic", "state": "open"}' \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 📋 On-Call Contact Card

**Print and keep at desk:**

```
╔════════════════════════════════════════╗
║  ENEM-PRO ON-CALL EMERGENCY CARD      ║
║  Shift: <date> <time-range> UTC      ║
║  On-call: <name>                     ║
║  Backup: <backup-name>               ║
╠════════════════════════════════════════╣
║  CRITICAL CONTACTS                    ║
║ Backend Lead: <name> <phone>          ║
║ Manager: <name> <phone>               ║
║ Supabase Support: support@supabase... ║
║ Stripe Status: status.stripe.com      ║
╠════════════════════════════════════════╣
║  KEY RUNBOOKS                         ║
║ 1. Incident: See INCIDENT.md          ║
║ 2. Performance: See PERF_DEBUG.md     ║
║ 3. Deployment: See DEPLOY.md          ║
║ 4. Migration: See MIGRATION.md        ║
╠════════════════════════════════════════╣
║  MONITORING DASHBOARDS                ║
║ Grafana: http://localhost:3000/grafana ║
║ Sentry: https://sentry.io/...        ║
║ Vercel: https://vercel.com/...       ║
╠════════════════════════════════════════╣
║  COMMON COMMANDS                      ║
║ Health check: curl http://localhost:30║
║              00/api/health-check      ║
║ Error rate: curl http://localhost:300║
║            0/api/metrics/errors       ║
║ Latency: curl http://localhost:3000/ ║
║         api/metrics/performance       ║
╚════════════════════════════════════════╝
```

---

## ✅ End-of-Week On-Call Review

Every Friday, review the week's on-call data:

```bash
# Aggregate incident stats
for date in $(seq -d " " -f "%Y-%m-$(printf '%02d' %g)" 21 25); do
  incidents=$(grep -c "INCIDENT" /root/projetos/enem-pro/.claude/analytics/alerts-log.md 2>/dev/null || echo 0)
  echo "$date: $incidents incidents"
done

# Calculate MTTR (mean time to resolution)
# From alerts-log.md: "Started 14:00 → Resolved 14:15" = 15 min MTTR

# Trend analysis
# Are incidents increasing or decreasing?
# What are the top 3 incident types?
# Any preventable incidents?

# Create retrospective issue
gh issue create \
  --title "On-call retrospective: Week of Oct 21" \
  --label "retrospective" \
  --body "
## Summary
- Total incidents: X
- Mean MTTR: Y min
- Critical issues: Z

## Prevention for Next Week
- [ ] Action item 1
- [ ] Action item 2
"
```

---

**Last Tested:** 2026-10-27  
**Related:** [INCIDENT.md](./INCIDENT.md), [DEPLOY.md](./DEPLOY.md), [PERF_DEBUG.md](./PERF_DEBUG.md)  
**Version:** 1.0
