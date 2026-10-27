# K6 Load Testing & Capacity Planning - ENEM-PRO

## 📋 Quick Links

### 📊 View Results
- **Interactive Dashboard:** [`k6-results/RESULTS_DASHBOARD.html`](k6-results/RESULTS_DASHBOARD.html)
- **Executive Summary:** [`K6_LOAD_TEST_SUMMARY.md`](K6_LOAD_TEST_SUMMARY.md)
- **Detailed Report:** [`K6_LOAD_TEST_REPORT.md`](K6_LOAD_TEST_REPORT.md)
- **Completion Status:** [`K6_LOAD_TEST_COMPLETE.txt`](K6_LOAD_TEST_COMPLETE.txt)
- **Raw Results:** [`k6-results/results-20261026-233044.json`](k6-results/results-20261026-233044.json)

---

## 🚀 Running Tests

### Proof-of-Concept (2 minutes)
```bash
cd /root/projetos/enem-pro
./run-load-test.sh
```

### Full Test (30 minutes)
```bash
python3 k6-simulator.py k6-load-test.js --duration 30
```

### Against Production
```bash
python3 k6-simulator.py k6-load-test.js \
  --base-url https://enem-pro.vercel.app \
  --duration 30
```

---

## 🎯 Key Findings

### Critical Issues
- ✗ **Breaking Point:** 3 Virtual Users (too low)
- ✗ **P95 Latency:** 2,331ms (exceeds 1s SLA by 2.3x)
- ✗ **P99 Latency:** 2,909ms (exceeds 2s SLA)

### Bottleneck Analysis
| Endpoint | P95 Latency | Status | Root Cause |
|----------|-------------|--------|-----------|
| `/api/checkout` | 2,860ms | 🔴 CRITICAL | Stripe + DB |
| `/api/explicar` | 1,226ms | 🟡 DEGRADED | LLM inference |
| `/api/health` | 36ms | 🟢 HEALTHY | N/A |

### Positive Findings
- ✓ **Error Rate:** 1.08% (below 10% threshold)
- ✓ **Reliability:** No cascading failures
- ✓ **Health Checks:** Fast (36ms)

---

## 📈 Metrics Summary

```
Metric              Value       SLA Target  Status
────────────────────────────────────────────────
P50 Latency         616.31ms    No limit    ✓
P95 Latency         2,331.67ms  < 1,000ms   ✗ FAIL
P99 Latency         2,909.17ms  < 2,000ms   ✗ FAIL
Error Rate          1.08%       < 10%       ✓ PASS
Total Requests      93          -           ✓
Successful          92          -           ✓
Failed              1           -           ✓
Peak VUs Reached    3           10+         ✗ FAIL
```

---

## 🛠️ Immediate Actions (Week 1)

### Priority 1: Async Checkout Processing
**Status:** [ ] Not Started  
**Impact:** Expected 70% latency reduction (2,860ms → 500-800ms)

```bash
# Implement queue-based processing
POST /api/checkout → Bull/RabbitMQ → Worker → Webhook
```

**Checklist:**
- [ ] Set up Redis/Bull job queue
- [ ] Refactor checkout to async handler
- [ ] Implement webhook notifications
- [ ] Add retry logic + exponential backoff

### Priority 2: Caching Layer (Redis)
**Status:** [ ] Not Started  
**Impact:** Expected 50% reduction on `/api/explicar`

```bash
# Cache explanations and customer data
- Question explanations: 24h TTL (hash-based key)
- Stripe customer: 30min TTL (user_id-based)
- Query results: 1h TTL
```

### Priority 3: Database Optimization
**Status:** [ ] Not Started  
**Impact:** 10-15% improvement across all endpoints

```sql
CREATE INDEX idx_user_id ON orders(user_id);
CREATE INDEX idx_question_id ON explanations(question_id);
CREATE INDEX idx_created_at ON orders(created_at);
```

---

## 📋 Files Generated

### Scripts (Ready to Run)
- `k6-simulator.py` - Python-based K6 simulator
- `k6-load-test.js` - K6 test definition
- `mock-server.js` - Mock API server
- `run-load-test.sh` - Test orchestrator

### Reports
- `K6_LOAD_TEST_SUMMARY.md` - Quick overview
- `K6_LOAD_TEST_REPORT.md` - Detailed analysis (11.8 KB)
- `K6_LOAD_TEST_COMPLETE.txt` - Completion summary
- `k6-results/RESULTS_DASHBOARD.html` - Interactive charts

### Data
- `k6-results/results-*.json` - Test results (JSON)
- `.claude/notes/k6-load-test-results.md` - Project memory

---

## 🗓️ 30-Day Optimization Plan

### Week 1: Critical Fixes
- Async checkout processing
- Redis caching
- Database indexes
- **Goal:** Reduce P95 by 40%

### Week 2: Validation & Testing
- Full 30-min load test
- Staging vs production comparison
- Query optimization
- **Goal:** Achieve P95 < 1.5s

### Week 3: Scaling
- Deploy 3 instances + load balancer
- Monitoring setup (DataDog)
- Horizontal scaling rules
- **Goal:** Handle 50+ VUs

### Week 4: Production
- Full monitoring
- Weekly capacity reviews
- Monthly load testing
- **Goal:** Production-ready

---

## 📊 How to Interpret Dashboard

### Latency Chart
- **Green:** Good (< 500ms)
- **Orange:** Caution (500-1,000ms)
- **Red:** Critical (> 1,000ms)

### Endpoint Comparison
- Shows P95 latency for each API endpoint
- `/api/checkout` is the primary bottleneck
- `/api/health` is a baseline for comparison

### Request Status
- Doughnut chart shows success/failure ratio
- Current: 92/93 successful (98.9%)
- **Goal:** > 99.9% success rate

---

## 🔍 Deeper Analysis

For comprehensive findings, read:
1. **Executive Summary** → [`K6_LOAD_TEST_SUMMARY.md`](K6_LOAD_TEST_SUMMARY.md) (5 min read)
2. **Technical Details** → [`K6_LOAD_TEST_REPORT.md`](K6_LOAD_TEST_REPORT.md) (20 min read)
3. **Raw Data** → [`k6-results/results-*.json`](k6-results/)

---

## 🚨 Status

- **Current Status:** ⚠️ CRITICAL - Requires immediate attention
- **Priority:** HIGH
- **Estimated Fix Time:** 2-4 weeks
- **Business Impact:** Cannot handle production load without optimization

---

## 📞 Questions?

See complete documentation in:
- `K6_LOAD_TEST_REPORT.md` - Bottleneck analysis
- `K6_LOAD_TEST_SUMMARY.md` - Action items
- Project note: `.claude/notes/k6-load-test-results.md`

Last Updated: **2026-10-26**  
Next Review: **After optimizations (estimated 2 weeks)**
