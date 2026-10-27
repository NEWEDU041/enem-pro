# Database Connection Pooling & Index Optimization

## Overview

This document covers the implementation of database connection pooling and query optimization for enem-pro. The goal is to reduce query latency and improve throughput by:

1. **Connection Pooling**: Reuse PostgreSQL connections via pg-pool (max 20 connections, 30s idle timeout)
2. **Query Optimization**: Add strategic indexes on frequently filtered columns
3. **Batch Operations**: Parallelize independent queries using Promise.all()
4. **Monitoring**: Track query performance with pg_stat_statements

## Implementation Status

### ✅ Completed

- [x] `lib/db-pool.ts` - Connection pool implementation with metrics tracking
- [x] `lib/db-helpers-pool.ts` - Optimized query wrappers for critical operations
- [x] `supabase/migrations/20261027_add_optimized_indexes.sql` - Index creation script
- [x] `scripts/db-performance-benchmark.ts` - Performance analysis tool
- [x] `scripts/test-portal-latency.ts` - Latency testing suite
- [x] `package.json` - Added `db:benchmark` and `db:test-portal` scripts

### 🔄 Next Steps

- [ ] Migrate `/api/portal` to use db-pool (critical N+1 pattern)
- [ ] Migrate `/api/explicar` to use db-pool
- [ ] Migrate `/api/checkout` to use db-pool
- [ ] Run pg_stat_statements analysis
- [ ] Deploy migration to Supabase production
- [ ] Monitor query times in production

## Database Configuration

### Environment Variables

Ensure your `.env.local` includes:

```env
# Required for db-pool
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require

# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

For Supabase, get DATABASE_URL from:
1. Go to Supabase Dashboard → Project Settings → Database
2. Copy the connection string under "PostgreSQL (psql)"
3. Append `?sslmode=require` for security

## Using Connection Pool

### Basic Query

```typescript
import * as dbPool from '@/lib/db-pool'

// Single row
const user = await dbPool.queryOne(
  'SELECT * FROM user_profiles WHERE id = $1',
  [userId]
)

// Multiple rows
const responses = await dbPool.queryAll(
  'SELECT * FROM usuario_respostas WHERE user_id = $1 ORDER BY created_at DESC',
  [userId]
)
```

### Using Helper Functions

```typescript
import * as dbHelpers from '@/lib/db-helpers-pool'

// Predefined query wrappers
const subscription = await dbHelpers.getUserSubscription(userId)
const usage = await dbHelpers.getDailyUsage(userId, dateString)

// Parallel batch fetch
const context = await dbHelpers.getUserContext(userId)
// Returns: { profile, subscription, usage }
```

### Transactions

```typescript
import * as dbPool from '@/lib/db-pool'

const result = await dbPool.transaction(async (client) => {
  await client.query('UPDATE subscriptions SET plan = $1 WHERE user_id = $2', [plan, userId])
  await client.query('INSERT INTO audit_logs (...) VALUES (...)')
  return result
})
```

## Query Optimization Patterns

### ❌ Don't: N+1 Queries

```typescript
// BAD: 4+ separate queries
const sub = await supabase.from('subscriptions').select().eq('user_id', userId)
const usage = await supabase.from('daily_usage').select().eq('user_id', userId)
const profile = await supabase.from('user_profiles').select().eq('id', userId)
const responses = await supabase.from('usuario_respostas').select().eq('user_id', userId)
```

### ✅ Do: Parallel Queries

```typescript
// GOOD: Execute in parallel
const [sub, usage, profile, responses] = await Promise.all([
  dbHelpers.getUserSubscription(userId),
  dbHelpers.getDailyUsage(userId, date),
  dbHelpers.getUserProfile(userId),
  dbHelpers.getUserResponses(userId),
])

// OR use batch helper
const context = await dbHelpers.getUserContext(userId)
```

### ✅ Do: Batch Operations

```typescript
// Instead of N individual lookups
const explanations = await dbHelpers.getExplanationBatch([
  'q-1',
  'q-2',
  'q-3',
  'q-4',
  'q-5',
])
```

## Indexes Created

### Critical Indexes for Query Performance

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `idx_explanations_question_id` | question_explanations | question_id | Fast explanation lookups by question |
| `idx_usuario_respostas_user_created` | usuario_respostas | (user_id, created_at DESC) | User response history pagination |
| `idx_checkout_logs_user_status` | checkout_logs | (user_id, status) | Payment processing & status filtering |
| `idx_subscriptions_user_id` | subscriptions | user_id | Subscription lookups by user |
| `idx_daily_usage_user_date` | daily_usage | (user_id, date DESC) | Rate limit tracking |
| `idx_audit_logs_user_created` | audit_logs | (user_id, created_at DESC) | Audit trail queries |
| `idx_newsletter_subscribers_email_status` | newsletter_subscribers | (email, status) | Newsletter targeting |

### Deploying Indexes

1. **To Supabase (Recommended)**:
   ```bash
   # Execute the migration in Supabase SQL Editor
   # Go to SQL Editor → New Query → Copy from supabase/migrations/20261027_add_optimized_indexes.sql
   ```

2. **From Command Line**:
   ```bash
   # Using psql
   psql $DATABASE_URL < supabase/migrations/20261027_add_optimized_indexes.sql
   ```

3. **Safety Note**:
   - All indexes use `CONCURRENTLY` flag to avoid table locks
   - Safe to run during production traffic
   - Creates indexes in background without blocking reads/writes

## Performance Testing

### Run Benchmark

```bash
# Analyze query performance
npm run db:benchmark

# Output shows:
# - Top 10 slowest queries
# - N+1 pattern detection
# - Index usage statistics
# - Connection pool metrics
```

### Run Portal Latency Test

```bash
# Test /api/portal query patterns
npm run db:test-portal

# Output shows:
# - Sequential vs Parallel execution times
# - Batch operation performance
# - Concurrent load handling
# - Connection pool status
```

## Migration Guide: Updating Endpoints

### Example: /api/portal

**Before (Supabase client, N+1 pattern)**:
```typescript
export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = createServerClient()
  
  // Query 1
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  // Query 2
  const { data: usage } = await supabase
    .from('daily_usage')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  // Query 3
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  // Takes N round trips...
})
```

**After (db-pool with parallel execution)**:
```typescript
import * as dbHelpers from '@/lib/db-helpers-pool'

export const POST = withErrorHandling(async (request: NextRequest) => {
  // All 3 queries execute in parallel
  const context = await dbHelpers.getUserContext(userId)
  const responses = await dbHelpers.getUserResponses(userId)
  
  return NextResponse.json({
    profile: context.profile,
    subscription: context.subscription,
    usage: context.usage,
    recent_responses: responses,
  })
})
```

## Monitoring & Metrics

### Pool Metrics

```typescript
import * as dbPool from '@/lib/db-pool'

const stats = dbPool.getPoolStats()
console.log(stats)
// Output:
// {
//   size: 5,           // Current connections
//   available: 3,      // Idle connections
//   inUse: 2,          // Active queries
//   waiting: 0,        // Pending requests
//   max: 20            // Max pool size
// }
```

### Query Metrics

```typescript
const metrics = dbPool.getMetrics()
console.log(metrics)
// Output:
// {
//   totalQueries: 142,
//   totalDuration: 1250,
//   avgDurationMs: 8.8,
//   recentQueries: [...]
// }
```

### Health Check

```typescript
import * as dbHelpers from '@/lib/db-helpers-pool'

const health = await dbHelpers.healthCheckTables()
if (!health.healthy) {
  console.error('Database connectivity issue:', health.tables)
}
```

## pg_stat_statements Setup (Supabase)

To analyze query performance over time:

1. **Enable Extension**:
   - Supabase Dashboard → Database → Extensions
   - Search for `pg_stat_statements` → Enable

2. **Query Statistics**:
   ```sql
   SELECT 
     query,
     calls,
     mean_time,
     max_time,
     total_time
   FROM pg_stat_statements
   WHERE query NOT LIKE '%pg_stat_statements%'
   ORDER BY mean_time DESC
   LIMIT 20;
   ```

3. **Reset Statistics** (when needed):
   ```sql
   SELECT pg_stat_statements_reset();
   ```

4. **Track Specific Query**:
   ```sql
   SELECT 
     query,
     calls,
     mean_time::numeric(10,2) as avg_ms,
     max_time::numeric(10,2) as max_ms
   FROM pg_stat_statements
   WHERE query LIKE '%usuario_respostas%'
   ORDER BY calls DESC;
   ```

## Expected Performance Improvements

Based on typical OLTP workloads:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Avg query time | 45ms | 15ms | 67% faster |
| P95 latency | 150ms | 45ms | 70% faster |
| Connection overhead | 50ms per req | 5ms reuse | 90% reduction |
| N+1 impact | 4x queries | 1x parallel | 75% fewer queries |
| Concurrent users | 50 | 200+ | 4x capacity |

## Troubleshooting

### "DATABASE_URL not set"

```bash
# Verify environment variable
echo $DATABASE_URL
# Should show: postgresql://user:pass@host:port/db?sslmode=require

# Or add to .env.local
echo "DATABASE_URL=..." >> .env.local
```

### Connection timeout (5s)

```typescript
// Connection pool couldn't acquire a connection
// Check:
// 1. Is DATABASE_URL correct?
// 2. Is Supabase database running?
// 3. Are there connection limit issues?
// 4. Check pool stats: dbPool.getPoolStats()
```

### Index not being used

```sql
-- Force reanalysis of query plan
ANALYZE [table_name];

-- Check index usage
SELECT * FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;
```

### Memory growing in pool

```typescript
// Reset metrics periodically in production
dbPool.resetMetrics()

// Check for query accumulation
const metrics = dbPool.getMetrics()
console.log(metrics.recentQueries.length) // Should stay bounded
```

## Best Practices

1. **Always use helpers** from `db-helpers-pool.ts` instead of raw SQL when possible
2. **Parallelize independent queries** with `Promise.all()`
3. **Use batch operations** for bulk fetches
4. **Monitor pool stats** in production dashboards
5. **Run benchmarks** after major schema changes
6. **ANALYZE tables** after index creation
7. **Enable pg_stat_statements** in production for ongoing analysis
8. **Set up alerts** for slow queries (> 1s)

## References

- [pg-pool Documentation](https://node-postgres.com/api/pool)
- [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes.html)
- [pg_stat_statements](https://www.postgresql.org/docs/current/pgstatstatements.html)
- [Supabase Database Optimization](https://supabase.com/docs/guides/database/performance)

## Support

For questions or issues:
1. Check pool metrics: `dbPool.getPoolStats()`
2. Run latency test: `npm run db:test-portal`
3. Review benchmark: `npm run db:benchmark`
4. Check logs for `[db-pool]` messages
