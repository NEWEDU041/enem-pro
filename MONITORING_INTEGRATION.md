# Monitoring Integration Guide - Logs, Metrics & Traces

## Three Pillars of Observability

```
┌──────────────────────────────────────────────────────────────┐
│                  enem-pro Observability Stack                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  LOGS          METRICS         TRACES                        │
│  ├─ Pino       ├─ Prometheus   ├─ Jaeger                     │
│  ├─ Structured ├─ prom-client  ├─ OpenTelemetry             │
│  └─ JSON       ├─ Grafana      └─ OTLP HTTP                 │
│                └─ Dashboards                                  │
│                                                               │
│              Connected via Trace ID & Request ID              │
└──────────────────────────────────────────────────────────────┘
```

## 1. Logs → Traces Correlation

### Setup: Add Trace ID to Log Context

Every request includes a trace ID. Logs should reference it:

```typescript
// lib/logger.ts (already implemented)
export function initLogContext(request: NextRequest) {
  const traceId = request.headers.get('x-trace-id') || generateTraceId();
  
  return {
    traceId,
    requestId: generateRequestId(),
    timestamp: new Date().toISOString(),
  };
}

export function createRequestLogger(context: LogContext) {
  return pino.child({
    trace_id: context.traceId,      // ← Includes trace ID
    request_id: context.requestId,
  });
}
```

### Usage: Log entries automatically include trace ID

```
{"trace_id":"abc123","request_id":"req456","level":"info","message":"Cache hit","question_id":"2023-45"}
```

### Query Pattern: Find logs for a trace

In your logging system (Loki, ELK, etc.):

```
# Find all logs for a specific trace
trace_id="abc123def456"

# Cross-reference with Jaeger
→ Open Jaeger: http://localhost:16686?traceID=abc123def456
```

## 2. Traces → Metrics

### Automatic Metrics from Traces

OpenTelemetry automatically exports these metrics:

```
Name: http_server_request_duration
Type: Histogram
Buckets: [10ms, 30ms, 100ms, 300ms, 1000ms, 3000ms]
Labels: method, route, status_code
```

Example Prometheus query:
```promql
# Average latency per endpoint
rate(http_server_request_duration_sum[5m]) / rate(http_server_request_duration_count[5m])

# Error rate (status >= 400)
rate(http_server_request_duration_total{status_code=~"[45].."}[5m])

# Cache hit ratio (from trace tags)
# Note: Custom metric, see below
```

### Custom Metrics from Trace Data

For metrics not auto-generated, derive from traces:

```typescript
// lib/metrics/from-traces.ts
export async function recordTraceMetrics(trace: Trace) {
  const rootSpan = trace.spans[0];
  const duration = rootSpan.duration / 1000;
  
  // Record HTTP metric
  httpRequestDuration
    .labels(
      rootSpan.tags?.find(t => t.key === 'http.method')?.value || 'UNKNOWN',
      rootSpan.tags?.find(t => t.key === 'http.target')?.value || 'UNKNOWN',
      rootSpan.tags?.find(t => t.key === 'http.status_code')?.value || '0'
    )
    .observe(duration);
  
  // Record cache metric (if available in tags)
  const cacheHit = rootSpan.tags?.find(t => t.key === 'cache.hit')?.value;
  if (cacheHit !== undefined) {
    cacheHitCounter.labels(cacheHit ? 'hit' : 'miss').inc();
  }
}
```

### Querying Metrics Based on Traces

**Query 1: Cache hit ratio over time**
```
hit_rate = increase(cache_hit_total{status="hit"}[5m]) / (increase(cache_hit_total[5m]))
```

**Query 2: Latency by endpoint**
```
histogram_quantile(0.95, rate(http_request_duration_bucket[5m])) by (endpoint)
```

**Query 3: Error rate**
```
increase(http_request_errors_total[5m]) / increase(http_requests_total[5m])
```

## 3. Metrics → Alerts → Traces

### Alert Definition Example

```yaml
# prometheus/alerts.yml
groups:
  - name: api_alerts
    rules:
      # Alert on high checkout latency
      - alert: HighCheckoutLatency
        expr: >
          histogram_quantile(0.95, rate(http_request_duration_bucket{endpoint="/api/checkout"}[5m]))
          > 2000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency on /api/checkout"
          runbook: "See JAEGER_DASHBOARDS.md - Find slow checkout requests"
          
      # Alert on cache miss spike
      - alert: LowCacheHitRatio
        expr: >
          (increase(cache_hit_total{status="hit"}[5m]) /
           increase(cache_hit_total[5m])) < 0.7
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Cache hit ratio below 70%"
          query: "Jaeger: tag:cache.hit=true"
```

### When Alert Fires: Incident Response Workflow

```
1. Alert: "HighCheckoutLatency"
   ↓
2. Grafana shows: checkout latency > 2000ms
   ↓
3. Click "Explore" → Link to Jaeger
   ↓
4. Jaeger shows:
   - POST /api/checkout taking 3500ms
   - Root cause: stripe.billingPortal.sessions.create (3300ms)
   ↓
5. Action: Contact Stripe support / increase timeout / add retry
   ↓
6. Verify: Re-run load test, check trace waterfall
```

## 4. Complete Example: Checkout Latency Issue

### Scenario

A production alert fires:
```
HighCheckoutLatency - /api/checkout P95 latency > 2000ms
```

### Investigation Steps

#### Step 1: Check Metrics (Grafana)

Dashboard: "API Performance"
- Panel: "Checkout Latency"
- Shows: 500ms (5min ago) → 2500ms (now)
- Clearly spiked

#### Step 2: Query Jaeger for Root Cause

In Jaeger UI:
```
Service: enem-pro
Operation: POST /api/checkout
Min Duration: 2000ms
Limit: 20
```

#### Step 3: Examine Trace Waterfall

Click first slow trace → View waterfall

```
POST /api/checkout (3500ms) ⚠
├─ auth.verify (8ms)
├─ rate_limit.check (4ms)
├─ stripe.price.cache (2ms) → HIT
├─ checkout.queue (32ms)
├─ stripe.billingPortal.sessions.create (3300ms) ← BOTTLENECK
└─ response.format (1ms)

Status: ERROR
Exception: Stripe API timeout (ETIMEDOUT)
```

#### Step 4: Correlate with Logs

Search logs by trace ID:
```
trace_id = "abc123def456"
```

Log entries show:
```
{"trace_id":"abc123","endpoint":"/api/checkout","event":"stripe_timeout","duration_ms":3300}
```

#### Step 5: Root Cause Analysis

- **What:** Stripe API taking 3300ms
- **Why:** Stripe experienced outage (check Stripe status page)
- **Impact:** 10% of requests affected (1 in 10 sampled → 10 affected total)
- **Duration:** 5 minutes before recovery
- **Users affected:** ~5 failed checkouts

#### Step 6: Resolution

Options:
1. **Short-term:** Increase Stripe timeout from 10s to 30s (retry logic)
2. **Medium-term:** Cache Stripe responses for 1 hour
3. **Long-term:** Use Stripe webhook for async billing portal creation

#### Step 7: Verify Fix

After deploying:
1. Run load test: `npm run checkout:benchmark`
2. Monitor Jaeger traces
3. Confirm P95 latency < 1000ms
4. Wait for alert to auto-resolve

## 5. Trace Data Retention & Aggregation

### Query Jaeger via API for Metrics

```bash
# Get all checkout traces in last 1 hour
curl 'http://localhost:16686/api/traces?service=enem-pro&operation=POST%20/api/checkout&lookback=1h&limit=100'

# Parse and aggregate:
# - Count by status_code
# - Calculate P50, P95, P99 latency
# - Average span duration per operation
```

### Aggregate Traces → Create Long-term Metrics

```typescript
// scripts/jaeger-metrics-aggregator.ts
async function aggregateTracesForMetrics() {
  const traces = await queryJaegerAPI({
    service: 'enem-pro',
    lookback: '1h',
  });
  
  // Aggregate by operation
  const byOperation = new Map<string, Latencies[]>();
  for (const trace of traces) {
    const op = trace.spans[0].operationName;
    if (!byOperation.has(op)) {
      byOperation.set(op, []);
    }
    byOperation.get(op)!.push(trace.spans[0].duration / 1000);
  }
  
  // Export to Prometheus push gateway
  for (const [op, latencies] of byOperation) {
    const p50 = percentile(latencies, 0.5);
    const p95 = percentile(latencies, 0.95);
    
    // Push to Prometheus
    pushMetric('trace_p50_latency', { operation: op }, p50);
    pushMetric('trace_p95_latency', { operation: op }, p95);
  }
}
```

## 6. Dashboard: Unified Observability View

### Ideal Grafana Dashboard Layout

```
┌────────────────────────────────────────────────────────────────┐
│ enem-pro - Unified Observability Dashboard                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [API Latency (from traces)]         [Cache Hit Ratio (traces)] │
│ ├─ /api/explicar    45ms            ├─ Redis: 85%            │
│ ├─ /api/checkout   1200ms           ├─ DB: 14%               │
│ └─ /api/portal      180ms            └─ Total: 99%            │
│                                                                 │
│ [Error Rate (metrics)]              [Recent Errors (logs)]    │
│ ├─ 401 Unauthorized: 0.1%           ├─ Stripe timeout: 5     │
│ ├─ 429 Rate Limited: 0.2%           ├─ Auth failure: 2       │
│ └─ 500 Server Error: 0.05%          └─ DB timeout: 1         │
│                                                                 │
│ [Link to Jaeger: View Traces by Service]                       │
│ └─ enem-pro → postgres, redis, stripe                          │
│                                                                 │
│ [Trace Timeline: Last 10 Traces]                               │
│ ├─ [████] POST /api/explicar (15ms, 200)                       │
│ ├─ [██████████] POST /api/checkout (2500ms, 502)               │
│ └─ [██] POST /api/portal (180ms, 200)                          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## 7. Actionable Runbooks

### Runbook 1: High API Latency

```
Symptom: Alert "HighAPILatency" fires

Step 1: Check which endpoint is slow
  → Grafana: API Latency dashboard
  → Identify endpoint

Step 2: Check if it's external dependency
  → Jaeger: Query endpoint with min duration
  → Look for long-running child spans (Stripe, DB, Redis)

Step 3: Deep dive on specific dependency
  → If Stripe: Check Stripe status page
  → If DB: Check connection pool, query slow log
  → If Redis: Check memory usage, eviction rate

Step 4: Check trace cache hit ratio
  → Jaeger: Query with tags cache.hit=true
  → If low: Cache invalidation issue
  → If high: Not a cache problem

Step 5: Check error rate
  → Logs: Search for exceptions in timeframe
  → Traces: Look for ERROR status spans
  → Identify if timeouts vs. failures

Resolution:
  → Increase timeout if dependency slow
  → Add circuit breaker if failing
  → Increase cache TTL if evicting
  → Scale DB/Redis if resource constrained
```

### Runbook 2: Low Cache Hit Ratio

```
Symptom: Alert "LowCacheHitRatio" fires (< 70%)

Step 1: Confirm issue in Jaeger
  → Service: enem-pro
  → Operation: POST /api/explicar
  → Tags: cache.hit=false
  → Should be < 30% normally

Step 2: Check recent cache invalidations
  → Logs: Search for "cache_invalidate" events
  → Check if bulk invalidation happened

Step 3: Check for hot key eviction
  → Redis: MEMORY STATS
  → Check if max memory exceeded
  → Check eviction policy

Step 4: Analyze trace pattern
  → Jaeger: Group traces by question_id
  → If many different question_ids: Cache size too small
  → If same question_ids repeatedly missing: TTL too short

Resolution:
  → Increase Redis max memory
  → Increase cache TTL (TRACING_SETUP.md)
  → Pre-warm cache with popular questions
  → Check cache invalidation logic
```

## Summary

**Integration Flow:**

```
User Request
    ↓
Trace generated (OpenTelemetry) → Jaeger
    ↓
Metrics exported (Prometheus) → Grafana dashboard
    ↓
Logs written (Pino) → ELK/Loki (with trace ID)
    ↓
Alert fires (Prometheus rules) → PagerDuty
    ↓
On-call engineer:
  1. Sees metric spike in Grafana
  2. Clicks "Explore" → Links to Jaeger
  3. Views trace waterfall → Identifies bottleneck
  4. Searches logs by trace ID → Finds error
  5. Takes corrective action → Verifies fix
```

**Tools & URLs:**

| Tool | URL | Purpose |
|------|-----|---------|
| Jaeger | http://localhost:16686 | Trace visualization & analysis |
| Prometheus | http://localhost:9090 | Metrics storage & queries |
| Grafana | http://localhost:3000 | Dashboard & visualization |
| Logs | (configured separately) | Structured log search |

All three systems are connected via:
- Trace ID (from OpenTelemetry context)
- Timestamps (correlation window ±5 seconds)
- Request ID (custom header)

This enables instant pivot from metrics → traces → logs for root cause analysis.
