# 🚀 Quick Start: DB Pooling Implementation

## 5-Minute Setup

### Step 1: Environment Setup (1 min)

Get your Supabase PostgreSQL connection string:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → Settings → Database → Connection string
3. Copy the PostgreSQL (psql) connection string
4. Add to `.env.local`:

```bash
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
```

### Step 2: Deploy Database Migration (2 min)

**Option A: Supabase SQL Editor (Recommended)**
1. Go to SQL Editor
2. Click "New query"
3. Paste content from `supabase/migrations/20261027_add_optimized_indexes.sql`
4. Click "Run"

**Option B: Command Line**
```bash
psql $DATABASE_URL < supabase/migrations/20261027_add_optimized_indexes.sql
```

### Step 3: Verify Installation (2 min)

```bash
# Test connection pool and latency
npm run db:test-portal

# This should show:
# ✓ Sequential Queries: XXms
# ✓ Parallel Queries: XXms (should be faster)
# ✓ Connection Pool Status: healthy
```

### Step 4: Benchmark Current Performance (1 min)

```bash
npm run db:benchmark

# Output shows:
# - Top 10 slowest queries
# - N+1 pattern detection
# - Index usage statistics
```

---

## Integration Into Your API Routes

### Example: Update `/api/portal` (the critical N+1 endpoint)

**Current code** (Supabase client - N+1 problem):
```typescript
const { data: sub } = await supabase.from('subscriptions').select().eq('user_id', userId)
const { data: profile } = await supabase.from('user_profiles').select().eq('id', userId)
const { data: usage } = await supabase.from('daily_usage').select().eq('user_id', userId)
```

**New code** (db-pool - parallel execution):
```typescript
import * as dbHelpers from '@/lib/db-helpers-pool'

// All 3 queries execute in parallel (instead of sequential)
const context = await dbHelpers.getUserContext(userId)
// Returns: { profile, subscription, usage }
```

**See full example**: `docs/PORTAL_MIGRATION_EXAMPLE.ts`

---

## Common Queries Reference

```typescript
import * as dbHelpers from '@/lib/db-helpers-pool'

// Subscription lookup
const sub = await dbHelpers.getUserSubscription(userId)

// Daily usage (for rate limiting)
const usage = await dbHelpers.getDailyUsage(userId, dateString)

// User response history (paginated)
const responses = await dbHelpers.getUserResponses(userId, limit, offset)

// Payment logs
const logs = await dbHelpers.getCheckoutLogs(userId, status)

// Batch explanation fetch (instead of N individual queries)
const explanations = await dbHelpers.getExplanationBatch([
  'q-1', 'q-2', 'q-3', 'q-4', 'q-5'
])

// Parallel fetch multiple contexts
const context = await dbHelpers.getUserContext(userId)
// Returns: { profile, subscription, usage }

// Check rate limit
const count = await dbHelpers.checkRateLimit(userId, date)

// Increment daily usage
const newCount = await dbHelpers.incrementDailyUsage(userId, date, increment)
```

---

## Monitoring

### Live Pool Stats

```typescript
import * as dbPool from '@/lib/db-pool'

const stats = dbPool.getPoolStats()
console.log(stats)
// { size: 5, available: 3, inUse: 2, waiting: 0, max: 20 }
```

### Query Metrics

```typescript
const metrics = dbPool.getMetrics()
console.log(metrics.recentQueries)  // Last 10 queries
console.log(metrics.avgDurationMs)  // Average query time
```

### Health Check

```typescript
import * as dbHelpers from '@/lib/db-helpers-pool'

const health = await dbHelpers.healthCheckTables()
if (!health.healthy) {
  console.error('Database issue:', health.tables)
}
```

---

## Expected Results

### Before (Sequential queries - N+1)
```
/api/portal: 4 sequential queries × 45ms = ~180ms response time
```

### After (Parallel queries - Pool + Indexes)
```
/api/portal: 1 parallel fetch (3 queries at once) = ~30ms response time
Improvement: 83% faster ✨
```

---

## Troubleshooting

**Error: "DATABASE_URL not set"**
```bash
# Check environment
echo $DATABASE_URL
# If empty, add to .env.local
```

**Error: "Connection timeout"**
```bash
# Test direct connection
psql $DATABASE_URL -c "SELECT 1"

# Check indexes exist
psql $DATABASE_URL -c "SELECT * FROM pg_indexes WHERE indexname LIKE 'idx_%'"
```

**Slow queries still detected**
```bash
# Run analysis
npm run db:benchmark

# Check if indexes are being used
psql $DATABASE_URL -c "SELECT * FROM pg_stat_user_indexes WHERE idx_scan > 0"
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `lib/db-pool.ts` | Connection pool manager |
| `lib/db-helpers-pool.ts` | Pre-built query helpers |
| `scripts/db-performance-benchmark.ts` | Performance analyzer |
| `scripts/test-portal-latency.ts` | Latency testing |
| `supabase/migrations/20261027_add_optimized_indexes.sql` | Database migration |
| `docs/DATABASE_POOLING.md` | Full documentation |
| `docs/PORTAL_MIGRATION_EXAMPLE.ts` | Migration example |

---

## Full Documentation

For complete setup, troubleshooting, and advanced usage:
→ Read `docs/DATABASE_POOLING.md`

For deployment checklist:
→ Read `.claude/notes/db-pooling-deployment.md`

---

## Next Steps

1. ✅ Complete steps 1-4 above
2. ✅ Review `docs/PORTAL_MIGRATION_EXAMPLE.ts`
3. ✅ Update `/api/portal` endpoint (highest impact)
4. ✅ Test with `npm run db:test-portal`
5. ✅ Monitor with `npm run db:benchmark`
6. ✅ Update other endpoints:
   - `/api/explicar`
   - `/api/checkout`
   - `/api/questoes`

---

**Questions?** Check `docs/DATABASE_POOLING.md` for detailed answers.
