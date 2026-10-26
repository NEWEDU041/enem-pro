# Database Optimization Audit: enem-pro

**Date**: 2026-10-26  
**Scope**: Query N+1 detection, index analysis, batch query implementation, latency testing  
**Status**: IN_PROGRESS

## 1. N+1 Query Audit

### Endpoint: /api/explicar (POST)

**Code Flow:**
1. Line 48-52: Query explanation cache for single question
   ```ts
   await supabase.from('question_explanations')
     .select('explanation')
     .eq('question_id', question_id)
     .maybeSingle()
   ```
   - ✅ Single query, no N+1 issue
   - Good: Uses `maybeSingle()` instead of SELECT *

2. Line 59: Query user subscription
   ```ts
   await supabase.from('subscriptions')
     .select('plan, expires_at')
     .eq('user_id', userId)
     .maybeSingle()
   ```
   - ✅ Single query per endpoint call
   - **OPPORTUNITY**: Could batch with user profile query if needed later

3. Line 89-94: Query daily usage for rate limiting
   ```ts
   await supabase.from('daily_usage')
     .select('explanation_count')
     .eq('user_id', userId)
     .eq('date', today)
     .maybeSingle()
   ```
   - ✅ No N+1: Called once per request
   - **OPPORTUNITY**: Already indexed (20260628_database_indexes.sql line 18-19)

4. Line 116: `fetchSingleQuestionCached(year, index)` - needs verification
   - Will audit in next section

**Findings:**
- ❌ **MISSING INDEX**: `question_explanations.question_id` not in migration file
- ❌ **MISSING INDEX**: `subscriptions.user_id` not in migration file  
- ⚠️ **OPPORTUNITY**: Consolidate user queries (subscription + profile) into single batch call

---

### Endpoint: /api/checkout (POST)

**Code Flow:**
```ts
stripe.checkout.sessions.create({...})
```
- ✅ No Supabase queries at all
- No N+1 issues

---

### Endpoint: /api/search-console-index (POST/GET)

**Code Flow:**
1. Line 33: `getAllSlugs()` - needs verification
   ```ts
   urls = getAllSlugs().map(s => `${SITE_URL}/blog/${s}`)
   ```

2. Line 47: Batch Google notification
   ```ts
   const results = await notifyGoogleBatch(urls)
   ```

**Findings:**
- ✅ Uses batch API (`notifyGoogleBatch`) - good pattern
- Need to verify `getAllSlugs()` implementation for hidden N+1s

---

### Helper Function: checkRateLimit (lib/rate-limit.ts)

**Code Flow:**
```ts
// Line 13-18: Query daily_usage
const { data: usage } = await supabase
  .from('daily_usage')
  .select('explanation_count')
  .eq('user_id', userId)
  .eq('date', today)
  .maybeSingle()
```

- ✅ Called once per request
- ✅ Already indexed (idx_daily_usage_user_date)
- **OPPORTUNITY**: Pass `userId` + `date` as parameters; could be combined with subscription query

---

## 2. Index Recommendations

### Missing Indexes (CRITICAL)

```sql
-- question_explanations table
CREATE INDEX IF NOT EXISTS idx_question_explanations_question_id 
  ON question_explanations(question_id);

CREATE INDEX IF NOT EXISTS idx_question_explanations_question_year
  ON question_explanations(question_id, year);

-- subscriptions table  
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_plan_expires
  ON subscriptions(user_id, plan, expires_at);

-- daily_usage table (already has composite, but add single-column for upserts)
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_id
  ON daily_usage(user_id);
```

### Missing Composite Indexes (RECOMMENDED)

```sql
-- For the /api/explicar flow: combined user context lookup
CREATE INDEX IF NOT EXISTS idx_user_context_lookup
  ON subscriptions(user_id, plan, expires_at DESC);

-- For daily_usage + explanation flow
CREATE INDEX IF NOT EXISTS idx_daily_usage_explanation
  ON daily_usage(user_id, date DESC, explanation_count);
```

---

## 3. Batch Query Implementation Plan

### Current State
- ✅ No N+1 patterns detected (single user per request)
- ✅ Caching already in place (question_explanations cache)
- ⚠️ Each endpoint does 1-3 separate queries

### Optimization Strategy

**Before**: 3 separate queries in /api/explicar
```
Query 1: SELECT * FROM question_explanations WHERE question_id = ?
Query 2: SELECT plan, expires_at FROM subscriptions WHERE user_id = ?
Query 3: SELECT explanation_count FROM daily_usage WHERE user_id = ? AND date = ?
```

**After**: Consolidate to 2 queries with batch or parallel execution
```
// Batch 1: User context (parallel)
Promise.all([
  supabase.from('subscriptions').select(...).eq('user_id', userId),
  supabase.from('daily_usage').select(...).eq('user_id', userId).eq('date', today)
])

// Batch 2: Explanation cache (conditional, after user context)
supabase.from('question_explanations').select(...).eq('question_id', question_id)
```

---

## 4. Performance Test Plan

### Baseline (Before Optimization)
```bash
# Test /api/explicar with 100 concurrent requests
ab -n 100 -c 20 \
  -H "Authorization: Bearer $TOKEN" \
  -p payload.json \
  http://localhost:3000/api/explicar

# Test /api/search-console-index
ab -n 50 -c 10 \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/search-console-index
```

### Metrics to Track
- **Mean Response Time** (ms)
- **95th Percentile** (p95)
- **Failed Requests** (should be 0)
- **Requests/second**
- **Database Query Time** (from logs)

### Expected Improvement
- **Query Time**: -40% to -60% (fewer queries + better indexes)
- **API Latency**: -15% to -30% (parallelized requests)
- **Throughput**: +20% to +40% (better index usage)

---

## 5. Implementation Checklist

- [ ] Create migration with new indexes
- [ ] Implement batch query helpers in lib/db-helpers.ts
- [ ] Update /api/explicar to use batch queries
- [ ] Run baseline performance test
- [ ] Apply optimization changes
- [ ] Run post-optimization test
- [ ] Document results

---

## 6. Decision Log

**Decision 1**: Focus on enem-pro only (youtube-os uses localStorage, no DB)
- Rationale: youtube-os has no Supabase integration; optimization would be minimal
- Impact: Clearer scope, focused audit

**Decision 2**: Parallelized batch queries over consolidated single queries
- Rationale: Question cache is often hit, so subscription + daily_usage are cheap
- Trade-off: Slight code complexity for better cache hit scenarios

**Decision 3**: Implement batch helpers as generic lib/db-helpers.ts
- Rationale: Reusable for future endpoints, follows DRY principle
- Impact: Future-proofs optimization work

