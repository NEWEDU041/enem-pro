# Multi-Region Deployment: Environment Setup & Configuration Guide

## Required Environment Variables

### Vercel Environment Variables

Set these in Vercel Dashboard → Project Settings → Environment Variables

```bash
# Multi-Region Configuration
ENABLE_EDGE_CACHING=true
MULTI_REGION_ENABLED=true
PRIMARY_REGION=gru1
FALLBACK_REGION=iad1
EDGE_REGION=iad1-eu-west-1

# Supabase - Primary (SA-EAST-1)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_URL_EU=https://xxxxxxxxxxx-eu.supabase.co
NEXT_PUBLIC_SUPABASE_URL_US=https://xxxxxxxxxxx-us.supabase.co
SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxx...
SUPABASE_SERVICE_KEY=eyJxxxxxxxxxxxxxx...

# Regional Endpoints (for health checks)
NEXT_PUBLIC_SA_ENDPOINT=https://enem-pro-gru.vercel.app
NEXT_PUBLIC_EU_ENDPOINT=https://enem-pro-eu.vercel.app
NEXT_PUBLIC_US_ENDPOINT=https://enem-pro-us.vercel.app
NEXT_PUBLIC_BASE_URL=https://enem-pro.com

# Monitoring
SENTRY_DSN=https://xxxxxxx@sentry.io/xxxxxxx
DATADOG_API_KEY=xxxxxxxxxxxxxxx
```

### Local Development (.env.local)

```bash
# Same as above, plus:
NEXT_PUBLIC_DEBUG_REGIONS=true
FAILOVER_SIMULATION_ENABLED=true
```

## Supabase Setup

### 1. Create Regional Databases

**Via Supabase Dashboard:**

1. Create primary project in São Paulo (sa-east-1)
   - Project name: `enem-pro-sa`
   - Region: South America (São Paulo)

2. Create read replica in Frankfurt (eu-west-1)
   - Read replica of primary
   - Region: Europe (Frankfurt)

3. (Optional) Create failover replica in US-East
   - Read replica of primary
   - Region: US (N. Virginia)

### 2. Enable Connection Pooling

```sql
-- In Supabase SQL Editor (connected to primary)

-- Create pgbouncer pool
-- Supabase does this automatically, but verify:
SELECT * FROM information_schema.schemata WHERE schema_name = 'pgbouncer';

-- Configure pool size
-- Dashboard → Project Settings → Database → Connection Pooling
-- Mode: Transaction
-- Max Connections: 20
-- Min Connections: 3
```

### 3. Setup Replication Monitoring

```sql
-- Create monitoring view
CREATE VIEW IF NOT EXISTS replication_status AS
SELECT 
  slot_name,
  slot_type,
  restart_lsn,
  (pg_current_wal_lsn() - restart_lsn) / 1024 / 1024 AS lag_mb,
  (SELECT now() - pg_postmaster_start_time()) AS uptime
FROM pg_replication_slots;

-- Query replication metrics
SELECT * FROM replication_status;

-- Monitor transaction log usage
SELECT 
  setting,
  CASE 
    WHEN setting ~ '^\d+$' THEN setting || ' segments'
    ELSE setting
  END
FROM pg_settings
WHERE name IN ('wal_keep_segments', 'max_wal_senders', 'max_replication_slots');
```

## Vercel Configuration

### 1. Deploy Multi-Region Config

Update `vercel.json` in both projects:

```json
{
  "regions": ["iad1", "iad1-eu-west-1", "gru1"],
  "functions": {
    "api/**": {
      "memory": 1024,
      "maxDuration": 60
    },
    "api/health-check/**": {
      "memory": 512,
      "maxDuration": 10
    }
  },
  "env": {
    "ENABLE_EDGE_CACHING": "true",
    "MULTI_REGION_ENABLED": "true"
  }
}
```

### 2. Verify Deployment

```bash
# List deployments by region
vercel list --meta=region

# Check region distribution
vercel deployments | grep -E "(gru1|iad1-eu|iad1)"

# Tail logs from specific region
vercel logs --since=30m --tail
```

## Cloudflare Setup

### 1. Create Cloudflare Worker

```toml
# wrangler.toml
name = "enem-pro-failover"
main = "src/worker.ts"
compatibility_date = "2024-01-01"

[env.production]
routes = [
  { pattern = "enem-pro.com/*", zone_name = "enem-pro.com" },
  { pattern = "www.enem-pro.com/*", zone_name = "enem-pro.com" }
]
```

### 2. Deploy Worker

```bash
npm install -g wrangler
wrangler publish --env production
```

### 3. Configure Cache Rules

**In Cloudflare Dashboard:**

1. Navigate to domain → Caching → Rules
2. Add the following rules:

**Rule 1: Cache Static Assets**
```
Expression: (cf.cache_status = "MISS" or cf.cache_status = "EXPIRED") AND (ends_with(http.request.uri.path, ".js") OR ends_with(http.request.uri.path, ".css") OR ends_with(http.request.uri.path, ".png") OR ends_with(http.request.uri.path, ".jpg") OR ends_with(http.request.uri.path, ".svg") OR ends_with(http.request.uri.path, ".woff2"))
Cache Level: Cache Everything
Browser TTL: 30 days
Edge TTL: 30 days
```

**Rule 2: Cache Homepage**
```
Expression: http.request.uri.path = "/"
Cache Level: Cache Everything
Browser TTL: 1 hour
Edge TTL: 24 hours
```

**Rule 3: Bypass Cache for Health Checks**
```
Expression: starts_with(http.request.uri.path, "/api/health-check")
Cache Level: Bypass
```

**Rule 4: Cache Blog Posts**
```
Expression: starts_with(http.request.uri.path, "/blog/")
Cache Level: Cache Everything
Browser TTL: 24 hours
Edge TTL: 24 hours
```

### 4. Setup Rate Limiting

**In Cloudflare Dashboard → Security → Rate Limiting:**

```
Rule 1: API Protection
- Match: /api/*
- Rate: 100 requests per 10 seconds
- Action: Challenge
```

## Monitoring Setup

### 1. Sentry Configuration

```typescript
// lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 2. Custom Metrics Collection

```typescript
// lib/metrics.ts
export class MetricsCollector {
  static recordLatency(region: string, endpoint: string, latency: number) {
    // Send to Sentry, DataDog, or custom service
    if (typeof window !== 'undefined') {
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'latency',
          region,
          endpoint,
          latency,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  }
}
```

## Testing & Validation

### 1. Functional Tests

```bash
# Run multi-region health checks
npm run test:multi-region

# Test specific region
curl https://enem-pro-gru.vercel.app/api/health-check

# Test failover
curl -X POST https://enem-pro.vercel.app/api/failover-test \
  -H "Content-Type: application/json" \
  -d '{"action": "simulate-failure", "region": "sa-east-1"}'
```

### 2. Performance Tests

```bash
# Test latency from different regions (using VPN)
for region in "BR" "DE" "US"; do
  echo "Testing from $region"
  curl -w "\nTime: %{time_total}s\n" https://enem-pro.com/
done

# Run load test
npm install -g artillery
artillery run load-test.yml
```

### 3. Database Tests

```bash
# Verify replication
psql postgresql://user:pass@primary.supabase.co/postgres \
  -c "SELECT slot_name, (pg_current_wal_lsn() - restart_lsn) / 1024 / 1024 AS lag_mb FROM pg_replication_slots;"

# Verify read replica connectivity
curl https://eu-replica.supabase.co/rest/v1/health -H "apikey: $ANON_KEY"
```

## Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Supabase databases created (primary + replicas)
- [ ] Connection pooling enabled
- [ ] Replication monitoring configured
- [ ] Cloudflare Worker deployed
- [ ] Cache rules created
- [ ] Health check endpoints tested
- [ ] Failover logic verified
- [ ] Monitoring/alerting configured
- [ ] Documentation reviewed
- [ ] Team trained on runbook

## Rollback Plan

If issues arise:

1. **Immediate:** Route all traffic to primary region only
   ```bash
   # In vercel.json, change regions to just primary
   "regions": ["gru1"]
   git push && vercel deploy --prod
   ```

2. **Disable failover:** Update Cloudflare Worker to single region

3. **Investigate:** Check logs in Vercel Analytics + Cloudflare

4. **Recovery:** Fix issue, redeploy, verify, re-enable multi-region

---

**Document Version:** 1.0  
**Last Updated:** 2026-10-27
