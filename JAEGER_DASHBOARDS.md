# Jaeger Dashboards & Trace Examples - enem-pro

## Dashboard Overview

Access the Jaeger UI at **http://localhost:16686**

The UI provides multiple views for analyzing distributed traces.

## Available Views

### 1. Search Page (Main Dashboard)

**Location:** http://localhost:16686

**Features:**
- Service selector dropdown
- Operation filter
- Latency range filters (min/max duration)
- Tag-based search
- Trace results with timeline view

**Key Searches:**

#### Search 1: All explicar requests
```
Service: enem-pro
Operation: POST /api/explicar
Min Duration: (empty)
Max Duration: (empty)
Limit: 20
```

**Expected Results:**
- Timeline showing cache hit patterns
- Latencies 5-150ms range
- Most traces should be under 50ms (cached)

#### Search 2: Slow checkout requests
```
Service: enem-pro
Operation: POST /api/checkout
Min Duration: 500ms
Max Duration: (empty)
Limit: 20
```

**Expected Results:**
- Traces over 500ms duration
- Identify Stripe API latency
- Show queue processing time

#### Search 3: Error traces
```
Service: enem-pro
Operation: (any)
Tags: http.status_code=500
Min Duration: (empty)
Limit: 20
```

**Expected Results:**
- Only error traces (5xx status codes)
- Exception details visible
- Root cause visible in span chain

### 2. Trace Details Page

**Location:** Click any trace in search results → `http://localhost:16686/trace/<TRACE_ID>`

**Displays:**
- Trace ID
- Service map (dependencies)
- Waterfall/timeline view
- Span details panel
- Logs and tags per span

**Example trace structure:**

```
Trace: abc123def456 (Duration: 145ms, Spans: 5)

┌─ POST /api/explicar (145ms) ────────────────────────────────────┐
│ Tags: user_id=user789, http.status_code=200                      │
│                                                                    │
│ ├─ redis.get (5ms) ──────────────────────────┐                  │
│ │ Tags: cache.hit=true, redis.command=GET    │                  │
│ │                                             │                  │
│ ├─ validate_request (2ms) ────────────┐      │                  │
│ │ Tags: request.size_bytes=256       │      │                  │
│ │                                    │      │                  │
│ ├─ authenticate (8ms) ───────────────┤      │                  │
│ │ Tags: auth.provider=supabase       │      │                  │
│ │                                    │      │                  │
│ ├─ rate_limit_check (3ms) ──────────┤      │                  │
│ │ Tags: rate_limit.tier=free, remaining=47  │                  │
│ │                                    │      │                  │
│ └─ format_response (1ms) ───────────┘      │                  │
│   Tags: response.size_bytes=2048            │                  │
│                                            │                  │
└────────────────────────────────────────────┘
```

### 3. Service Dependencies Graph

**Location:** Click "Dependencies" tab in Jaeger UI

**Shows:**
- Service interconnections
- Error rates between services
- Request volume

**For enem-pro:**
```
enem-pro
├─→ postgres (db queries)
├─→ redis (cache operations)
├─→ supabase (auth, billing)
└─→ stripe (payments)
```

## Example Trace Scenarios

### Scenario 1: Cache Hit (Explicar Request)

**Trace Waterfall:**

```
POST /api/explicar (15ms)
├─ auth.verify (5ms) ──────────────┐
│  Status: OK                       │
│  Tags: {user_id: user123}        │
├─ cache.get (4ms) ────┐           │
│  Status: OK          │           │
│  Cache Hit: true     │           │
│  Source: redis       │           │
├─ response.format (1ms)           │
│  Status: OK                       │
└─ HTTP 200 OK (15ms) ────────────┘
```

**Attributes visible in Jaeger:**
- `cache.hit: true`
- `cache.source: redis`
- `http.status_code: 200`
- `latency_ms: 15`

**Analysis:**
- ✓ Cache working effectively
- ✓ Sub-20ms response time
- ✓ No database queries needed

---

### Scenario 2: Cache Miss (Database Fallback)

**Trace Waterfall:**

```
POST /api/explicar (95ms)
├─ auth.verify (5ms) ────────────────┐
│  Status: OK                        │
├─ cache.get (2ms) ─────┐            │
│  Status: OK           │            │
│  Cache Hit: false     │            │
├─ db.query (75ms) ─────┤            │
│  Status: OK           │            │
│  Query: SELECT ... FROM question... │
│  Rows: 1              │            │
├─ cache.set (8ms) ─────┤            │
│  Status: OK           │            │
└─ response.format (1ms)             │
   Status: OK                         │
   HTTP 200 OK (95ms) ───────────────┘
```

**Attributes:**
- `cache.hit: false`
- `cache.source: database`
- `db.row_count: 1`
- `db.operation: select`

**Analysis:**
- Cache miss detected
- DB promotion happening (cache.set follows query)
- ~95ms is expected for DB hit

---

### Scenario 3: Checkout with Async Queue

**Trace Waterfall:**

```
POST /api/checkout (850ms)
├─ auth.verify (8ms) ────────────┐
│  Status: OK                     │
├─ validate.request (3ms) ───────┤
│  Status: OK                     │
├─ rate_limit.check (4ms) ───────┤
│  Status: OK                     │
│  Tier: free                     │
├─ stripe.price.cache (2ms) ─┐   │
│  Status: OK                │   │
│  Cache Hit: true          │   │
├─ checkout.queue (32ms) ────┤   │
│  Status: OK                │   │
│  Job ID: checkout-xyz789  │   │
├─ queue.subscribe (800ms) ──┤   │
│  Status: OK                │   │
│  (waiting for async job)   │   │
└─ response.format (1ms)     │   │
   Status: OK                │   │
   HTTP 202 Accepted (850ms) ┘   │
```

**Key attributes:**
- `http.status_code: 202`
- `job_id: checkout-xyz789`
- `queue.latency_ms: 32`
- `async.wait_ms: 800`

**Analysis:**
- Queue enqueue is fast (32ms)
- Client waits for job status (800ms is polling)
- Async processing successful

---

### Scenario 4: Error - Rate Limit Exceeded

**Trace Waterfall:**

```
POST /api/explicar (8ms)  ✗ ERROR
├─ auth.verify (5ms) ─────────┐
│  Status: OK                  │
├─ rate_limit.check (3ms) ────┤
│  Status: ERROR               │
│  Rate Limit Exceeded: true   │
│  Remaining: 0               │
│  Retry After: 60s           │
└─ HTTP 429 Too Many Requests  │
   Status: ERROR               │
   Exception: RateLimitError    │
```

**Attributes:**
- `http.status_code: 429`
- `error.type: RateLimitError`
- `rate_limit.remaining: 0`
- `rate_limit.retry_after_seconds: 60`

**Root cause diagnosis:**
- Rate limit check is catching the error early
- Fast failure (8ms total)
- Client gets clear 429 response

---

### Scenario 5: Slow Checkout - Stripe Timeout

**Trace Waterfall:**

```
POST /api/checkout (3500ms)  ⚠ SLOW
├─ auth.verify (8ms) ────────────────┐
│  Status: OK                         │
├─ rate_limit.check (4ms) ───────────┤
│  Status: OK                         │
├─ stripe.price.cache (2ms) ─┐       │
│  Status: OK                │       │
│  Cache Hit: true          │       │
├─ checkout.queue (32ms) ────┤       │
│  Status: OK                │       │
│  Job ID: checkout-abc123   │       │
├─ stripe.billingPortal.sessions.create (3300ms) ┤
│  Status: ERROR             │       │
│  Exception: Timeout        │       │
│  Stripe Latency: 3300ms    │       │
└─ retry.enqueue (50ms)      │       │
   Status: OK                │       │
   HTTP 202 (3500ms) ────────┘
```

**Attributes:**
- `stripe.latency_ms: 3300`
- `error.type: TimeoutError`
- `retry.scheduled: true`

**Analysis:**
- Bottleneck is Stripe API (3300ms of 3500ms)
- Not our application issue
- Retry mechanism engaged

---

## Creating Custom Queries

### Filter by User ID

In Jaeger Search:
```
Tags: user_id=user12345
```

Shows all traces for that user across all operations.

### Filter by Cache Hit Ratio

```
Operation: POST /api/explicar
Tags: cache.hit=true
```

Count results and divide by total traces.

### Find P95 Latency

In Jaeger UI:
1. Search for operation (e.g., `POST /api/checkout`)
2. Results are sorted by latency
3. Scroll to ~95th percentile position
4. Note the latency of that trace

### Search by Error Type

```
Tags: error.type=TimeoutError
```

Or by status code:
```
Tags: http.status_code=500
```

## Metrics Derived from Traces

### 1. Cache Hit Ratio

```
Cache Hits = count(traces WHERE cache.hit=true)
Total      = count(all traces FOR operation)
Hit Ratio  = Hits / Total
Goal:      > 80%
```

### 2. Error Rate

```
Error Count    = count(traces WHERE http.status_code>=400)
Total Count    = count(all traces)
Error Rate %   = (Errors / Total) × 100
Goal:          < 0.1%
```

### 3. P95 Latency

```
Sort traces by duration
Select: 95th percentile position
P95 Latency = duration of that trace
Goal:       < 500ms for explicar
Goal:       < 2000ms for checkout
```

### 4. Queue Processing Time

```
For checkout endpoint:
Identify: queue.latency_ms + async.wait_ms
Average:  sum(all timings) / count
Goal:     < 100ms queue, < 1000ms total wait
```

## Integration with Prometheus/Grafana

Traces feed into metrics:

| Metric | Source Span | Grafana Panel |
|--------|------------|---------------|
| `http_request_duration_ms` | HTTP spans | Dashboard: API Latency |
| `cache_hit_ratio` | cache.hit tags | Dashboard: Cache Performance |
| `error_rate` | ERROR status | Dashboard: Error Rate Alerts |
| `db_query_duration_ms` | db.query spans | Dashboard: Database Performance |

## Performance Analysis Workflow

### Step 1: Identify Slow Endpoint

In Prometheus/Grafana:
- Alert fires: `http_request_duration_ms{endpoint="/api/checkout"} > 2000`

### Step 2: Query Jaeger for Traces

In Jaeger UI:
```
Service: enem-pro
Operation: POST /api/checkout
Min Duration: 2000ms
```

### Step 3: Examine Trace Waterfall

Click trace → View waterfall
- Identify span with longest duration
- Check tags for error information

### Step 4: Take Action

- **Stripe timeout?** → Increase timeout, add retry logic
- **Database slow?** → Check indexes, optimize query
- **Cache miss spike?** → Check invalidation logic

## Summary

**View Jaeger at:** http://localhost:16686

**Key searches:**
1. `Service: enem-pro, Operation: POST /api/explicar` - Cache hit patterns
2. `Service: enem-pro, Min Duration: 500ms` - Slow requests
3. Dependencies tab - Service interaction graph

**Expected improvements with tracing:**
- MTTR reduced from 30min to 5min
- Root cause identification instant
- Dependency visibility complete
