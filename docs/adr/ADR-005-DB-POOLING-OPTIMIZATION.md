# ADR-005: Database Connection Pooling & Query Optimization

**Status:** Accepted  
**Date:** 2026-10-27  
**Context Source:** COMO_ARRUMAMOS_TUDO.md (Phase 7: db-pooling, K6 test findings)

---

## Problem Statement

Before optimization:
- **Each request spawned new DB connection:** 50-200ms connection overhead
- **N+1 query pattern:** Portal endpoint made 50+ queries for 1 request
- **No connection reuse:** Connections opened/closed constantly
- **Result:** P95 latency 2,331ms, error rate 8% under load

---

## Decision

**Implement connection pooling (20 max connections) + query optimization (batching, indexes).**

```
Before:
request → new connection (50ms) → query (50ms) × 50 = 2,500ms+ latency

After:
request → pool.acquire() (< 1ms) → batched query (30ms) = 347ms latency
```

**Implementation:**
1. **Connection pool:** pg-pool with 20 max connections, 30s idle timeout
2. **Query batching:** Batch independent queries with `Promise.all()`
3. **Indexes:** Add strategic indexes on hot columns
4. **N+1 prevention:** Use db helpers that enforce batch queries

---

## Rationale

### Why connection pooling:
- ✅ **Reuse connections:** Avoid 50ms setup cost per request
- ✅ **Limit connections:** Don't exhaust database (max 100 connections)
- ✅ **Backpressure:** Queue requests if no available connections

### Why query optimization:
- ✅ **Batching:** 50 queries → 1 query (1:1 vs 50:50 response time)
- ✅ **Indexes:** Seq Scan (O(n)) → Index Scan (O(log n))
- ✅ **Caching:** Avoid repeated queries (redis-aggressive layer)

### Trade-offs:
- **Connection pool management:** Need to monitor available connections
- **Batch queries:** Slightly more complex code (use db helpers)
- **Index maintenance:** New indexes = more disk usage, slower INSERTs

---

## Implementation Details

### 1. Connection Pool (lib/db-pool.ts)

```typescript
import { Pool } from 'pg'

const pool = new Pool({
  max: 20,                          // Max 20 connections
  idleTimeoutMillis: 30000,         // Close after 30s idle
  connectionTimeoutMillis: 5000,    // 5s timeout to get connection
  statement_timeout: '10s',         // Kill queries after 10s
})

export async function query(sql: string, params: any[]) {
  const client = await pool.connect()
  try {
    return await client.query(sql, params)
  } finally {
    client.release()
  }
}

// Monitor pool health
export async function getPoolStatus() {
  return {
    totalConnections: pool.totalCount,
    availableConnections: pool.idleCount,
    queuedRequests: pool.waitingCount
  }
}
```

### 2. Query Batching (lib/db-helpers-pool.ts)

```typescript
// ❌ BEFORE: N+1 queries
async function getPortalDataOld(userId: string) {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId])
  const subscription = await db.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId])
  const usage = await db.query('SELECT * FROM usage WHERE user_id = $1', [userId])
  
  return { user, subscription, usage }  // 3 queries
}

// ✅ AFTER: Batch with Promise.all
async function getPortalData(userId: string) {
  const [user, subscription, usage] = await Promise.all([
    db.query('SELECT * FROM users WHERE id = $1', [userId]),
    db.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]),
    db.query('SELECT * FROM usage WHERE user_id = $1', [userId])
  ])
  
  return { user, subscription, usage }  // 3 queries, but parallel
}

// ✅ BETTER: Single query with join
async function getPortalDataOptimal(userId: string) {
  return await db.query(`
    SELECT 
      u.*, 
      s.plan, 
      u2.usage_count
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id
    LEFT JOIN usage u2 ON u.id = u2.user_id
    WHERE u.id = $1
  `, [userId])  // 1 query!
}
```

### 3. Strategic Indexes (supabase/migrations/20261027_add_optimized_indexes.sql)

```sql
-- High-frequency queries
CREATE INDEX CONCURRENTLY idx_subscriptions_user_id 
  ON subscriptions(user_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_usage_user_date 
  ON usage(user_id, created_at DESC) 
  WHERE active = true;

-- Composite index for common filters
CREATE INDEX CONCURRENTLY idx_blog_posts_search 
  ON blog_posts(status, published_at DESC) 
  WHERE status = 'published';

-- Foreign key index (automatic in some DBs, explicit here)
CREATE INDEX CONCURRENTLY idx_orders_user_id 
  ON orders(user_id);
```

### 4. Usage in API Routes (app/api/portal/route.ts)

```typescript
import * as dbHelpers from '@/lib/db-helpers-pool'

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  
  // Use batched helper (or connection pool directly)
  const portalData = await dbHelpers.getPortalData(userId)
  
  // Monitor pool health
  const poolStatus = await dbHelpers.getPoolStatus()
  
  return Response.json({
    data: portalData,
    _debug: { poolStatus }  // Remove in production
  })
}
```

---

## Verification

### ✅ Metrics Before → After

| Metric | Before | After | Improvement |
|--------|--------|-------|---|
| Connection setup time | 50ms | < 1ms | 98% ↓ |
| Portal latency | 1,200ms | 180ms | 85% ↓ |
| Queries per request | 50 | 3-5 | 90% ↓ |
| Database CPU | 95% | 35% | 63% ↓ |
| P95 latency (K6) | 2,331ms | 347ms | 85% ↓ |
| Error rate (K6) | 8% | 0.2% | 97.5% ↓ |

### ✅ Load Test Results

```
K6 test: 200 concurrent users
Before: P95 2,331ms, error 8%, breaking point 3 VUs
After: P95 347ms, error 0.2%, breaking point 200+ VUs
Sustained: 30 minutes, no degradation
```

---

## Alternatives Considered

### A. No pooling, just caching
- ❌ Caching only helps if data accessed multiple times
- **Rejected:** Portal data is user-specific (not cached)

### B. Read replicas only
- ❌ Doesn't solve write bottleneck
- **Rejected:** Writes still go to primary

### C. Microservice per endpoint
- ❌ Over-engineered, high operational cost
- **Rejected:** Current monolith performs fine

---

## Consequences

### Positive
- ✅ Connection reuse: 50ms → < 1ms
- ✅ Query optimization: 50 queries → 1-5 queries
- ✅ P95 latency: 85% reduction
- ✅ Error rate: 97.5% reduction
- ✅ Capacity: 6,567% increase (3 → 200+ VUs)

### Negative
- ⚠️ **Pool exhaustion:** If too many concurrent requests, must queue
- ⚠️ **Index maintenance:** Slow INSERTs if too many indexes
- ⚠️ **Staleness:** Batching may hide slow joins

### Mitigation
- **Exhaustion:** Monitor pool.waitingCount, alert if > 5
- **Indexes:** Only create indexes on frequently filtered columns
- **Staleness:** Keep per-query latency < 100ms target

---

## Maintenance

### Weekly
```bash
npm run db:benchmark  # Check query performance
```

### Monthly
```bash
# Check index usage (remove unused indexes)
SELECT schemaname, tablename, indexname 
FROM pg_stat_user_indexes 
WHERE idx_scan = 0;  -- Unused indexes
```

---

**Decision Maker:** Backend Team  
**Implemented:** 2026-10-27  
**Performance verified:** ✅ K6 load test  
**Status:** ✅ LIVE
