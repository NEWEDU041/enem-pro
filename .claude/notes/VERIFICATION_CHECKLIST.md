# ✅ Rate Limiting Implementation — Verification Checklist

## Pre-Deployment (Local Testing)

- [ ] **Code Review**
  - [ ] `lib/user-rate-limit.ts` — 442 lines, all functions exported
  - [ ] Tier config: Free 100/day, Pro 10k/day
  - [ ] `checkUserRateLimit()` returns correct headers
  - [ ] Caching logic (L1 Redis → L2 Supabase)
  - [ ] RPC increment is atomic

- [ ] **Endpoint Integration**
  - [ ] `/api/explicar` — imports `checkUserRateLimit`
  - [ ] `/api/portal` — imports `checkUserRateLimit`
  - [ ] `/api/checkout` — imports `checkUserRateLimit`
  - [ ] `/api/questoes` — optional rate limit (if auth)
  - [ ] `/api/simulado/salvar` — imports `checkUserRateLimit`
  - [ ] All endpoints return 429 on limit

- [ ] **TypeScript Compilation**
  - [ ] `npm run build` succeeds
  - [ ] No `any` types in user-rate-limit.ts
  - [ ] All imports resolved

- [ ] **Unit Tests**
  - [ ] `npm run test:rate-limit` passes
  - [ ] Tier config validated
  - [ ] Headers structure valid
  - [ ] Schema requirements confirmed

---

## Database Setup (Supabase)

- [ ] **Migration Execution**
  - [ ] Copy SQL from `.claude/migrations/002-rate-limit-counters.sql`
  - [ ] Execute in Supabase SQL Editor
  - [ ] No errors in console

- [ ] **Table Verification**
  ```sql
  SELECT * FROM user_rate_limit_counters LIMIT 1;
  -- Should return: (0 rows) ← Normal
  ```

- [ ] **Indexes Created**
  ```sql
  SELECT indexname FROM pg_indexes 
  WHERE tablename = 'user_rate_limit_counters';
  -- Should return 3 indexes: idx_rate_limit_user_date, idx_rate_limit_date, idx_rate_limit_created
  ```

- [ ] **RPC Function Available**
  ```sql
  SELECT pg_get_functiondef('increment_rate_limit_counters(text, date, text)'::regprocedure);
  -- Should return function definition (not empty)
  ```

- [ ] **Table Permissions (RLS)**
  - [ ] RLS enabled on `user_rate_limit_counters`
  - [ ] Policy: Users can view own data
  - [ ] Policy: System can update counters

---

## Staging Deployment

- [ ] **Build Verification**
  ```bash
  npm run build
  npm start
  # Server starts without errors on port 3000
  ```

- [ ] **Environment Variables**
  - [ ] `SUPABASE_URL` set
  - [ ] `SUPABASE_ANON_KEY` set
  - [ ] `REDIS_URL` set (if using external Redis)

---

## Live Testing (Endpoints)

### Test 1: Single Request (Should Succeed)
```bash
curl -v -X POST https://staging.questoesenem.pro/api/explicar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question_id": "2023-1"}' \
  2>&1 | grep -E "X-RateLimit-|200 OK"

# Expected:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: [tomorrow ISO date]
# X-RateLimit-Tier: free
# 200 OK
```

- [ ] Status: 200 ✅
- [ ] Headers present: X-RateLimit-Limit ✅
- [ ] Remaining > 0 ✅
- [ ] Tier shown ✅

### Test 2: Rate Limit Breach (Should Return 429)
```bash
# For free tier user: make 100+ requests in quick succession
for i in {1..110}; do
  curl -s -X POST https://staging.questoesenem.pro/api/explicar \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"question_id": "2023-1"}' \
    | grep -q "error" && echo "Request $i: 429" || echo "Request $i: OK"
done

# Expected: Requests 1-100 "OK", Request 101+ "429"
```

- [ ] Requests 1-100: HTTP 200 ✅
- [ ] Request 101: HTTP 429 ✅
- [ ] 429 has X-RateLimit-* headers ✅
- [ ] Remaining: 0 ✅
- [ ] Retry-After present ✅

### Test 3: Pro Tier Comparison
```bash
# Test with Pro user (create subscription: plan='pro', expires_at=future)

curl -v -X POST https://staging.questoesenem.pro/api/explicar \
  -H "Authorization: Bearer $PRO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question_id": "2023-1"}' \
  2>&1 | grep -E "X-RateLimit-"

# Expected:
# X-RateLimit-Limit: 10000
# X-RateLimit-Tier: pro
# X-RateLimit-Remaining: 9999
```

- [ ] Limit: 10000 (not 100) ✅
- [ ] Tier: pro (not free) ✅
- [ ] Remaining: ~10000 ✅

### Test 4: Hourly Limit
```bash
# Make 20+ requests within same hour (Free tier)

for i in {1..25}; do
  curl -s -X POST https://staging.questoesenem.pro/api/explicar \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"question_id": "2023-1"}' \
    | jq '.error' 2>/dev/null || echo "Request $i: OK"
  sleep 1
done

# Expected: 20-21 succeed, rest get "Limite de requisições atingido"
```

- [ ] First 20: 200 OK ✅
- [ ] 21st: 429 ✅
- [ ] Error message in Portuguese ✅

### Test 5: Database Counter Increment
```sql
-- After making 5 requests in one day:
SELECT daily_count, hourly_count, burst_count 
FROM user_rate_limit_counters 
WHERE user_id = 'test_user_id'
AND date = TODAY();

-- Expected: daily_count=5, hourly_count=5, burst_count=5 (approximately)
```

- [ ] daily_count incremented ✅
- [ ] hourly_count incremented ✅
- [ ] burst_count incremented ✅

---

## Admin Dashboard Verification

- [ ] **Dashboard Access**
  ```bash
  curl -v https://staging.questoesenem.pro/admin/rate-limit-dashboard \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  
  # Expected: 200 OK (HTML page loads)
  ```

- [ ] **Dashboard Render**
  - [ ] Summary cards visible (total users, Free/Pro count, violations)
  - [ ] Pie chart rendered (tier distribution)
  - [ ] Line chart rendered (7-day trends)
  - [ ] Top users table populated
  - [ ] Violations table populated
  - [ ] Config reference section visible

- [ ] **Analytics Endpoint**
  ```bash
  curl -s https://staging.questoesenem.pro/api/admin/rate-limit-analytics \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    | jq '.summary'
  
  # Expected:
  # {
  #   "totalTiers": number,
  #   "freetierUsers": number,
  #   "proTierUsers": number,
  #   "proPercentage": "X.X"
  # }
  ```

- [ ] Data populated ✅
- [ ] Timestamps valid ✅
- [ ] Numbers > 0 ✅

---

## Logging & Monitoring

- [ ] **Sentry Integration**
  - [ ] Make 429 request
  - [ ] Check Sentry dashboard
  - [ ] Issue tagged with `status:429` ✅
  - [ ] Metadata includes tier, remaining, retryAfter ✅

- [ ] **Response Logging**
  - [ ] Enable debug logs: `DEBUG=enem-pro:* npm start`
  - [ ] Check logs for rate limit checks
  - [ ] Should see: `[checkUserRateLimit] tier=free remaining=X`

---

## Performance Validation

- [ ] **Redis Cache Hit**
  ```bash
  # First request (cache miss → Redis set)
  time curl -s https://.../api/explicar -H "Authorization: ..." > /dev/null
  # ~150-200ms
  
  # Second request (cache hit)
  time curl -s https://.../api/explicar -H "Authorization: ..." > /dev/null
  # ~50-80ms (faster)
  ```

- [ ] Cache hit is faster ✅
- [ ] Latency acceptable (<100ms) ✅

- [ ] **Database Query Performance**
  ```sql
  EXPLAIN ANALYZE SELECT * FROM user_rate_limit_counters 
  WHERE user_id = 'xyz' AND date = '2026-10-26';
  
  -- Should use index: idx_rate_limit_user_date
  -- Execution time: <5ms
  ```

- [ ] Uses correct index ✅
- [ ] Query time <5ms ✅

---

## Production Readiness

- [ ] **Fail-Safe Behavior**
  - [ ] Simulate Redis down: See if system falls back to Supabase ✅
  - [ ] Simulate Supabase error: Defaults to Free tier ✅
  - [ ] Request still allowed even on DB failure ✅

- [ ] **Security**
  - [ ] Tier lookup requires auth ✅
  - [ ] Admin endpoint requires role='admin' ✅
  - [ ] Headers don't leak sensitive data ✅

- [ ] **Documentation**
  - [ ] `.claude/notes/rate-limit-implementation.md` complete ✅
  - [ ] `.claude/notes/rate-limit-response-examples.md` complete ✅
  - [ ] Code comments in `lib/user-rate-limit.ts` ✅

---

## Final Sign-Off

- [ ] All tests passing
- [ ] Dashboard working
- [ ] 429 responses correct
- [ ] No critical bugs found
- [ ] Documentation complete
- [ ] Ready for production

**Status:** ✅ READY TO DEPLOY

**Deployed by:** [Name]  
**Date:** [YYYY-MM-DD]  
**Version:** [Git commit hash]

