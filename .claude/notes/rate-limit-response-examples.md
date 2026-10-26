# Rate Limit API Response Examples

## 1. Success Response (200 OK)

### Request
```bash
curl -X POST https://questoesenem.pro/api/explicar \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"question_id": "2023-1", "selected_alternative": "A"}'
```

### Response (200 OK)
```json
{
  "explanation": "A alternativa correta é A porque...",
  "cached": true,
  "cache_source": "redis",
  "latency_ms": 45
}
```

### Headers
```
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 2026-10-27T00:00:00.000Z
X-RateLimit-Tier: free
Content-Type: application/json
```

---

## 2. Rate Limit Exceeded (429 Too Many Requests)

### Request (after 100 requests in one day)
```bash
curl -X POST https://questoesenem.pro/api/explicar \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"question_id": "2023-1", "selected_alternative": "A"}'
```

### Response (429)
```json
{
  "error": "Limite de requisições atingido",
  "tier": "free",
  "reset_at": "2026-10-27T00:00:00.000Z"
}
```

### Headers
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2026-10-27T00:00:00.000Z
X-RateLimit-Tier: free
Retry-After: 86400
Content-Type: application/json
```

**Client should:** Wait 86400 seconds (24 hours) until `X-RateLimit-Reset`

---

## 3. Pro Tier Comparison

### Free Tier (100 req/day)
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 2026-10-27T00:00:00.000Z
X-RateLimit-Tier: free
```

### Pro Tier (10,000 req/day)
```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9873
X-RateLimit-Reset: 2026-10-27T00:00:00.000Z
X-RateLimit-Tier: pro
```

---

## 4. Hourly Limit Exceeded

### Request (after 20 requests in one hour for Free user)
```bash
for i in {1..21}; do
  curl -X POST https://questoesenem.pro/api/explicar \
    -H "Authorization: Bearer ..." \
    -H "Content-Type: application/json" \
    -d '{"question_id": "2023-1"}'
done
# 21st request gets 429
```

### Response (429)
```json
{
  "error": "Limite de requisições atingido",
  "tier": "free",
  "reset_at": "2026-10-26T21:00:00.000Z"
}
```

### Headers
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2026-10-26T21:00:00.000Z
X-RateLimit-Tier: free
Retry-After: 1800
```

**Reset time:** Top of the next hour (~30 min from now)

---

## 5. Burst Limit Exceeded (1-minute window)

### Request (rapid-fire within 1 minute for Free user)
```bash
for i in {1..6}; do
  curl -X GET 'https://questoesenem.pro/api/questoes?year=2023&limit=10' \
    -H "Authorization: Bearer ..."
done
# 6th request (within same minute) gets 429
```

### Response (429)
```json
{
  "error": "Limite de requisições atingido",
  "tier": "free",
  "reset_at": "2026-10-26T20:29:00.000Z"
}
```

### Headers
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2026-10-26T20:29:00.000Z
X-RateLimit-Tier: free
Retry-After: 60
```

**Note:** Burst limit resets every 1 minute

---

## 6. Admin Dashboard Response

### Request
```bash
curl -X GET https://questoesenem.pro/api/admin/rate-limit-analytics \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Admin: true"
```

### Response (200 OK)
```json
{
  "timestamp": "2026-10-26T20:30:45.000Z",
  "period": {
    "date": "2026-10-26",
    "last7Days": "2026-10-19"
  },
  "summary": {
    "totalTiers": 1250,
    "freetierUsers": 1000,
    "proTierUsers": 250,
    "proPercentage": "20.0"
  },
  "topUsers": [
    {
      "user_id": "user_abc123def456",
      "daily_requests": 98,
      "percentage_used": "98.0"
    },
    {
      "user_id": "user_xyz789uvw012",
      "daily_requests": 92,
      "percentage_used": "92.0"
    },
    {
      "user_id": "user_pqr345stu678",
      "daily_requests": 87,
      "percentage_used": "87.0"
    }
  ],
  "dailyTrends": [
    {
      "date": "2026-10-19",
      "totalRequests": 15420,
      "userCount": 432
    },
    {
      "date": "2026-10-20",
      "totalRequests": 18750,
      "userCount": 521
    },
    {
      "date": "2026-10-21",
      "totalRequests": 21340,
      "userCount": 612
    },
    {
      "date": "2026-10-22",
      "totalRequests": 19680,
      "userCount": 548
    },
    {
      "date": "2026-10-23",
      "totalRequests": 22100,
      "userCount": 625
    },
    {
      "date": "2026-10-24",
      "totalRequests": 20540,
      "userCount": 580
    },
    {
      "date": "2026-10-25",
      "totalRequests": 23780,
      "userCount": 672
    },
    {
      "date": "2026-10-26",
      "totalRequests": 18920,
      "userCount": 435
    }
  ],
  "rateLimitViolations": {
    "count": 5,
    "recent": [
      {
        "user_id": "user_abc123def456",
        "date": "2026-10-26",
        "requests": 100,
        "percent_of_limit": "100.0"
      },
      {
        "user_id": "user_xyz789uvw012",
        "date": "2026-10-26",
        "requests": 100,
        "percent_of_limit": "100.0"
      },
      {
        "user_id": "user_mno234pqr567",
        "date": "2026-10-25",
        "requests": 99,
        "percent_of_limit": "99.0"
      }
    ]
  },
  "tierConfig": {
    "free": {
      "daily_limit": 100,
      "hourly_limit": 20,
      "burst_limit": 5
    },
    "pro": {
      "daily_limit": 10000,
      "hourly_limit": 2000,
      "burst_limit": 100
    }
  }
}
```

---

## 7. Authentication Error (401 Unauthorized)

### Request (missing or invalid token)
```bash
curl -X POST https://questoesenem.pro/api/explicar \
  -H "Content-Type: application/json" \
  -d '{"question_id": "2023-1"}'
```

### Response (401)
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### Headers
```
HTTP/1.1 401 Unauthorized
X-RateLimit-Tier: anonymous
Content-Type: application/json
```

**Note:** Rate limiting is applied AFTER authentication

---

## 8. Admin Access Denied (403 Forbidden)

### Request (non-admin user accessing analytics)
```bash
curl -X GET https://questoesenem.pro/api/admin/rate-limit-analytics \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  # user_metadata.role != 'admin'
```

### Response (403)
```json
{
  "error": "Admin access required"
}
```

### Headers
```
HTTP/1.1 403 Forbidden
Content-Type: application/json
```

---

## 9. Multiple Requests (Monitoring Remaining Count)

### Request 1 (first request of the day)
```bash
curl -v -X POST https://questoesenem.pro/api/explicar \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{"question_id": "2023-1"}'
```

**Response headers:**
```
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 2026-10-27T00:00:00.000Z
```

### Request 2 (second request)
```
X-RateLimit-Remaining: 98
X-RateLimit-Reset: 2026-10-27T00:00:00.000Z
```

### Request 100 (last allowed)
```
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2026-10-27T00:00:00.000Z
```

### Request 101 (exceeds limit)
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Remaining: 0
Retry-After: 86400
```

---

## 10. Upgrade Pro Scenario

### Free user makes request (98/100 used)
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 2
X-RateLimit-Tier: free
```

### User upgrades to Pro
```
(subscription table updated: plan='pro', expires_at = future date)
```

### Next request after upgrade
```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9998  # Reset for Pro
X-RateLimit-Tier: pro
```

**Note:** Tier cache (Redis, 1h TTL) takes up to 1h to update. After upgrade, next request will check Supabase and update cache.

---

## Debugging Checklist

- [ ] Verify `X-RateLimit-*` headers present in all 429 responses
- [ ] Confirm `X-RateLimit-Reset` is ISO 8601 format
- [ ] Check `Retry-After` matches `X-RateLimit-Reset` timestamp diff
- [ ] Validate `X-RateLimit-Tier` matches user's subscription
- [ ] Monitor `/api/admin/rate-limit-analytics` for violations
- [ ] Test tier upgrade flow (Free → Pro)
- [ ] Verify dashboard at `/admin/rate-limit-dashboard`
