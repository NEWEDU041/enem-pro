# Runbook: Performance Debugging — enem-pro

**Status:** Production-Ready  
**Last Updated:** 2026-10-27  
**Audience:** Backend Engineer, SRE, DevOps

---

## 🔍 Debug Workflow

### Step 1: Identify Slow Operation (2 min)

```bash
# Check recent performance metrics
curl -s http://localhost:3000/api/metrics/performance | jq '
  .endpoints[] | 
  select(.p95 > 300) | 
  {endpoint, p95, p99, samples}' | head -20

# Identify top 3 slowest
curl -s http://localhost:3000/api/metrics/performance?sort=p95_desc | jq '.[0:3]'

# Output example:
# {
#   "endpoint": "GET /api/portal",
#   "p95": 1200,  ← Too slow (target: < 500ms)
#   "p99": 1800,
#   "samples": 542
# }
```

### Step 2: Database or Code? (3 min)

```bash
# Check database contribution to latency
curl -s http://localhost:3000/api/metrics/database | jq '.slow_queries | length'

# If slow_queries > 0:
# → Problem: Database. Go to DATABASE DEBUGGING
curl -s http://localhost:3000/api/metrics/database | jq '.slow[0:3]'

# If slow_queries = 0:
# → Problem: Code/External API. Go to CODE DEBUGGING
```

---

## 🗄️ DATABASE DEBUGGING

### 1. Find Slow Query

```bash
# Enable query logging (Supabase)
psql $DATABASE_URL -c "
  SET log_min_duration_statement = 500;  -- Log queries > 500ms
"

# Run slow operation again
curl -X GET http://localhost:3000/api/portal?user_id=123

# Check slow query log
psql $DATABASE_URL -c "
  SELECT query, duration, timestamp 
  FROM pg_stat_statements 
  WHERE query LIKE '%FROM%' 
  ORDER BY mean_time DESC 
  LIMIT 3;"

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE id = $1;
# ↓ Output shows execution plan
```

### 2. Identify Issue

**Common patterns:**

```bash
# ❌ PROBLEM: Sequential Scan (O(n) complexity)
# EXPLAIN shows: "Seq Scan on users"
# ✅ FIX: Add index on WHERE clause column

# ❌ PROBLEM: Join without index
# EXPLAIN shows: "Hash Join" with high cost
# ✅ FIX: Add composite index on join keys

# ❌ PROBLEM: N+1 query pattern
# Query called 50 times with different $1 values
# ✅ FIX: Batch query: WHERE id = ANY($1::uuid[])

# ❌ PROBLEM: Missing column in SELECT
# SELECT * fetches all 50 columns when only 3 needed
# ✅ FIX: SELECT id, name, email instead
```

### 3. Apply Fix

```bash
# Add index (non-blocking)
psql $DATABASE_URL -c "CREATE INDEX CONCURRENTLY idx_users_email ON users(email);"

# Or add composite index for joins
psql $DATABASE_URL -c "CREATE INDEX CONCURRENTLY idx_orders_user_date ON orders(user_id, created_at);"

# Or refactor N+1 in code (app/api/portal/route.ts):
# ❌ Before:
for (const userId of userIds) {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId])
}

# ✅ After:
const users = await db.query('SELECT * FROM users WHERE id = ANY($1::uuid[])', [userIds])
```

### 4. Verify Fix

```bash
# Rerun EXPLAIN ANALYZE
EXPLAIN ANALYZE SELECT * FROM users WHERE id = $1;
# ✓ Should now show: "Index Scan" instead of "Seq Scan"

# Benchmark before/after
npm run db:benchmark

# Expected: 50%+ latency reduction for slow query
```

---

## 💻 CODE DEBUGGING

### 1. Find Bottleneck

```bash
# Add request tracing
curl -s http://localhost:3000/api/portal?user_id=123&trace=true | jq '._trace'

# Output:
# {
#   "_trace": {
#     "total": 1200,
#     "db_time": 100,        ← DB is fast
#     "api_calls": 950,      ← API calls are slow ← Problem!
#     "rendering": 150
#   }
# }

# Profile CPU usage
npm run debug -- app/api/portal/route.ts

# Or use Node Inspector for heap profiling
node --inspect --expose-gc app/api/portal/route.ts
# Open: chrome://inspect
```

### 2. Identify Issue

```bash
# If api_calls > 500ms:
# ❌ External API (Anthropic) is slow
# ✅ Add timeout, circuit breaker, caching

# If rendering > 200ms:
# ❌ JSON serialization is slow
# ✅ Stream response OR reduce data size

# If memory spike:
# ❌ Memory leak in loop
# ✅ Add garbage collection points OR refactor

# Check specific code path
grep -r "await anthropic" app/api/portal/
# ↓ Found: lib/ai-prompts.ts line 42

cat lib/ai-prompts.ts | sed -n '35,50p'
# See the slow call
```

### 3. Apply Fix

```bash
# Add timeout to API call
import { withTimeout } from '@/lib/timeout-wrapper'

const response = await withTimeout(
  anthropic.messages.create(...),
  5000  // 5 second timeout
)

# Or add caching
const cachedResponse = await cache.get(`portal_${userId}`)
if (!cachedResponse) {
  const response = await anthropic.messages.create(...)
  await cache.set(`portal_${userId}`, response, 3600)  // 1h TTL
}

# Or batch requests
const prompts = [prompt1, prompt2, prompt3]
const results = await Promise.all(prompts.map(p => 
  anthropic.messages.create(p)
))
```

### 4. Verify Fix

```bash
# Test locally with profiling
npm run dev &
curl -s http://localhost:3000/api/portal?trace=true

# Monitor latency improvement
watch -n 2 'curl -s http://localhost:3000/api/metrics/performance | jq ".endpoints[] | select(.endpoint == \"GET /api/portal\") | .p95"'

# Expected: 1200ms → 400ms (67% improvement)
```

---

## 🔄 CACHE OPTIMIZATION

### 1. Check Cache Hit Rate

```bash
redis-cli INFO stats | grep -E "keyspace_hits|keyspace_misses"

# Calculate hit rate
redis-cli EVAL "
  local hits = redis.call('INFO', 'stats')
  -- Parse hits and misses and return ratio
" 0

# Or use monitoring endpoint
curl -s http://localhost:3000/api/metrics/cache | jq '.hit_rate'

# Target: > 80% hit rate
# If < 60%: Cache is not effective
```

### 2. Identify Keys to Cache

```bash
# Check slow queries that can be cached
curl -s http://localhost:3000/api/metrics/database | jq '.slow[] | {query: .query[0:60], duration, frequency}'

# For high-frequency, cacheable queries:
# ✓ SELECT * FROM blog_posts (stable, read-heavy)
# ✓ SELECT * FROM users WHERE id = (user-specific, stable)
# ✗ SELECT * FROM real_time_metrics (changes constantly)
```

### 3. Add Caching

```bash
# Cache database query result
import { cache } from '@/lib/cache'

async function getBlogPosts() {
  const cacheKey = 'blog_posts:all'
  const cached = await cache.get(cacheKey)
  if (cached) return cached
  
  const posts = await db.query('SELECT * FROM blog_posts ORDER BY created_at DESC')
  await cache.set(cacheKey, posts, 3600)  // Cache 1 hour
  return posts
}

# Or cache API response
app.get('/api/blog', async (req, res) => {
  const cacheKey = 'api:blog'
  const cached = await cache.get(cacheKey)
  if (cached) return res.json(cached)
  
  const data = await fetchBlogData()
  await cache.set(cacheKey, data, 1800)
  return res.json(data)
})

# Invalidate cache on data change
// After INSERT/UPDATE/DELETE:
await cache.delete('blog_posts:all')
```

### 4. Monitor Cache Health

```bash
# Monitor in real-time
watch -n 3 'curl -s http://localhost:3000/api/metrics/cache | jq "{hit_rate, memory_mb, entries}"'

# Check for memory bloat
redis-cli INFO memory | grep used_memory_human
# If > 500MB: Reduce TTL or remove stale keys

# Remove stale keys
redis-cli EVAL "
  local keys = redis.call('KEYS', '*')
  for _,key in ipairs(keys) do
    local ttl = redis.call('TTL', key)
    if ttl < 0 then
      redis.call('DEL', key)
    end
  end
  return 'Cleanup complete'
" 0
```

---

## 🌍 MULTI-REGION PERFORMANCE

### 1. Check Region Latencies

```bash
# Test latency to each region
for region in gru1 iad1 iad1-eu-west-1; do
  echo "=== $region ==="
  time curl -s http://localhost:3000/api/health-check?region=$region > /dev/null
done

# Expected: All < 200ms (varies by user location)
```

### 2. Database Replication Lag

```bash
# Check replication status
curl -s http://localhost:3000/api/health-check | jq '.latency'
# {
#   "database": 45,
#   "cache": 12,
#   "external": 85
# }

# If database latency > 100ms:
# Problem: Replication lag or connection issues

# Check Supabase replication status
psql $DATABASE_URL -c "
  SELECT slot_name, restart_lsn, confirmed_flush_lsn 
  FROM pg_replication_slots;"

# If lag growing: Contact Supabase support
```

### 3. Route to Nearest Region

```bash
# Verify geolocation-based routing
curl -v https://enem-pro.com/api/portal \
  -H "CF-IPCountry: BR" | grep x-served-by
# Expected: x-served-by: gru1 (São Paulo, nearest to Brazil)

curl -v https://enem-pro.com/api/portal \
  -H "CF-IPCountry: DE" | grep x-served-by
# Expected: x-served-by: iad1-eu-west-1 (nearest to Germany)
```

---

## 📊 Performance Benchmarking

### Run Full Benchmark Suite

```bash
# Database benchmark
npm run db:benchmark
# Measures: Query latency, index efficiency, connection pool

# Portal latency benchmark  
npm run db:test-portal
# Simulates: Real user portal loads

# Checkout benchmark
npm run checkout:benchmark
# Simulates: Real checkout flows

# Review results
cat .report-benchmark.json | jq '.summary'
```

---

## 🆘 Still Slow After All This?

```bash
# 1. Check if it's client-side rendering slow
# Open DevTools → Performance tab → Record → Reload → Analyze

# 2. Check if it's external API genuinely slow
# Test API directly: curl -v https://api.anthropic.com/

# 3. Check if it's under load (legitimate slowness under high traffic)
# Run load test to validate capacity
# npm run load-test

# 4. Escalate to backend architecture review
# File issue: https://github.com/...
# Tag: performance, architecture-review
```

---

**Last Tested:** 2026-10-27  
**Related:** [DEPLOY.md](./DEPLOY.md), [INCIDENT.md](./INCIDENT.md)  
**Version:** 1.0
