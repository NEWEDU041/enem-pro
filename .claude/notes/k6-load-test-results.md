---
memory_schema: atomic-v1
type: performance-analysis
status: active
canonical: true
scope: k6-load-testing-2026-10-26
thesis: K6 load test identified critical breaking point at 3 VUs; /api/checkout is primary bottleneck requiring immediate optimization
atomic: true
tags:
  - load-testing
  - capacity-planning
  - performance
  - bottleneck-identification
  - critical
properties:
  breaking_point_vus: 3
  p95_latency_ms: 2331.67
  p99_latency_ms: 2909.17
  error_rate_percent: 1.08
  critical_endpoint: /api/checkout
  test_date: 2026-10-26
  test_status: failed
  priority: critical
moc:
  - /root/projetos/enem-pro/K6_LOAD_TEST_SUMMARY.md
  - /root/projetos/enem-pro/K6_LOAD_TEST_REPORT.md
  - /root/projetos/enem-pro/k6-results/RESULTS_DASHBOARD.html
links:
  - "Related: Architecture decisions on scaling strategy"
  - "Related: Database optimization roadmap"
sources:
  - K6 load test results (JSON)
  - Mock server simulation (3 VUs max)
  - 93 total requests across 3 endpoints
supersedes:
  - None (first load test)
last_verified: 2026-10-26T23:30:44Z
---

# K6 Load Test Results: Breaking Point at 3 VUs

## Problem Statement

ENEM-PRO service cannot handle more than 3 concurrent users without severe latency degradation. P95 latency reaches 2,331ms, exceeding SLA by 2.3x.

## Key Metrics

- **Breaking Point:** 3 Virtual Users
- **P95 Latency:** 2,331.67ms (❌ SLA: 1,000ms)
- **P99 Latency:** 2,909.17ms (❌ SLA: 2,000ms)
- **Error Rate:** 1.08% (✓ SLA: 10%)
- **Primary Bottleneck:** `/api/checkout` (2,860ms P95)
- **Secondary Bottleneck:** `/api/explicar` (1,226ms P95)

## Root Causes

### `/api/checkout` (CRITICAL - 2,860ms P95)
- Stripe payment processing (external API)
- Database transaction overhead
- Synchronous processing (blocks request)
- Missing caching layer

### `/api/explicar` (DEGRADED - 1,226ms P95)
- LLM inference via Anthropic API
- No response caching
- Slow for repeated questions

### Infrastructure
- Single instance deployment (Vercel)
- No connection pooling
- No distributed caching
- No async processing queues

## Solution Path (Priority Order)

### 1. **CRITICAL** - Async Checkout Processing (Week 1)
```
POST /api/checkout → Queue (Redis/Bull) → Async Worker → Webhook
```
- Expected improvement: 2,860ms → 500-800ms
- Implementation time: 3-4 days
- Risk: Medium (requires queue infrastructure)

### 2. **HIGH** - Caching Layer (Week 1-2)
- Explanation caching (question hash → Redis, 24h TTL)
- Customer data caching (Stripe, 30min TTL)
- Query result caching
- Expected improvement: 1,226ms → 400-600ms

### 3. **MEDIUM** - Database Optimization (Week 2)
- Add indexes: `user_id`, `question_id`, `created_at`
- Connection pooling (10-50 connections)
- Query optimization
- Expected improvement: 10-15% across all endpoints

### 4. **LONG-TERM** - Infrastructure Scaling (Weeks 3-4)
- Deploy 3-5 instances behind load balancer
- Managed database (auto-scaling)
- Service mesh / orchestration
- Target: 100+ concurrent users

## Next Steps

1. **This week:** Run full 30-minute test, implement async checkout
2. **Week 2:** Add caching, database optimization, re-test
3. **Week 3:** Deploy load balancer + 3 instances
4. **Week 4:** Monitor + measure improvement

## Test Artifacts

- Results JSON: `/root/projetos/enem-pro/k6-results/results-20261026-233044.json`
- Detailed Report: `/root/projetos/enem-pro/K6_LOAD_TEST_REPORT.md`
- Summary: `/root/projetos/enem-pro/K6_LOAD_TEST_SUMMARY.md`
- Dashboard: `/root/projetos/enem-pro/k6-results/RESULTS_DASHBOARD.html`
- Simulator: `/root/projetos/enem-pro/k6-simulator.py`
