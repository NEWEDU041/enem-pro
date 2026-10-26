# Prometheus + Grafana Monitoring for ENEM Pro

Complete monitoring stack with Prometheus, Grafana, and AlertManager for enem-pro application.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- `CRON_SECRET` environment variable set

### 1. Start Monitoring Stack

```bash
cd monitoring
docker-compose up -d
```

This starts:
- **Prometheus**: http://localhost:9090 (metrics collection & querying)
- **Grafana**: http://localhost:3000 (dashboards, default: admin/admin)
- **AlertManager**: http://localhost:9093 (alert routing)

### 2. Verify Metrics Collection

```bash
# In project root
npm run test:metrics
```

Or manually:
```bash
curl -H "x-admin-secret: $CRON_SECRET" http://localhost:3000/api/metrics
```

Expected response: Prometheus text format with metrics like:
```
http_request_duration_overall{quantile="0.95"} 45
http_error_rate 0.5
cache_hit_rate 92.3
db_connections_active 3
```

### 3. Access Dashboards

1. **Grafana**: http://localhost:3000
   - Login: admin / admin
   - Dashboard: "ENEM Pro - Application Monitoring"
   - 4 panels: Latency (P50/P95), Error Rate, Throughput, Cache Performance

2. **Prometheus**: http://localhost:9090
   - Query metrics directly
   - View scrape targets & alerts

3. **AlertManager**: http://localhost:9093
   - View active alerts
   - Alert silence management

## Exported Metrics

All metrics exposed at `/api/metrics` endpoint (Prometheus text format):

### HTTP Request Metrics
- `http_request_duration_overall{quantile="0.5"|"0.95"|"0.99"}` - Latency percentiles (ms)
- `http_request_duration_p50{endpoint="..."}` - P50 latency per endpoint
- `http_request_duration_p95{endpoint="..."}` - P95 latency per endpoint
- `http_request_duration_p99{endpoint="..."}` - P99 latency per endpoint
- `http_request_duration_avg{endpoint="..."}` - Average latency per endpoint
- `http_requests_total` - Total requests counter
- `http_errors_total` - Total error requests
- `http_error_rate` - Error rate (%)
- `http_throughput_rps` - Requests per second

### Cache Metrics
- `cache_hits_total` - Total cache hits (counter)
- `cache_misses_total` - Total cache misses (counter)
- `cache_hit_rate` - Cache hit rate (%)

### Database Metrics
- `db_connections_active` - Active connections (gauge)
- `db_connections_max` - Max connections (gauge)
- `db_query_duration_avg` - Average query duration (ms)
- `db_query_duration_p95` - P95 query duration (ms)

### Custom Metrics
- `explanations_generated_total` - Total explanations generated
- `users_active` - Active users count
- `process_uptime_seconds` - Application uptime

## Alerts Configured

All alerts sent to AlertManager (configurable routing):

| Alert | Threshold | Duration | Severity |
|-------|-----------|----------|----------|
| HighErrorRate | > 5% | 5m | critical |
| HighLatencyP95 | > 1000ms | 5m | warning |
| HighMemoryUsage | > 80% | 5m | warning |
| LowCacheHitRate | < 70% | 10m | warning |
| HighDbConnectionUsage | > 80% | 5m | warning |
| SlowDatabaseQueries | P95 > 500ms | 5m | warning |
| LowThroughput | < 1 rps | 10m | info |
| ServiceDown | no metrics for 5m | 5m | critical |

## Dashboard Panels

### 1. HTTP Latency (P50/P95/P99)
- Time series graph
- Three lines: P50, P95, P99
- Red threshold at 1s
- Useful for SLA monitoring (typical: P95 < 500ms)

### 2. HTTP Error Rate
- Single line graph
- Thresholds: yellow @ 2%, red @ 5%
- Percentage scale (0-100%)
- Key for reliability monitoring

### 3. HTTP Throughput
- Requests per second
- Shows load patterns
- Useful for capacity planning

### 4. Cache Performance
- Cache hit rate percentage
- Thresholds: green > 70%, yellow 50-70%, red < 50%
- Critical for performance (target: > 85%)

## Integration Points

### Recording Metrics in Application Code

#### HTTP Request Metrics (Automatic)
Middleware automatically tracks all requests:
```typescript
import { metricsMiddleware } from '@/lib/monitoring/middleware'
// In middleware/next.ts or request handler
metricsMiddleware(response, request, durationMs)
```

#### Cache Operations
```typescript
import { recordCacheOperation } from '@/lib/monitoring/middleware'

// Cache hit
recordCacheOperation(true)

// Cache miss
recordCacheOperation(false)
```

#### Database Operations
```typescript
import { recordDbOperation } from '@/lib/monitoring/middleware'

const start = Date.now()
// ... DB query ...
recordDbOperation(Date.now() - start, activeConnections)
```

#### Custom Business Metrics
```typescript
import {
  recordExplanationGenerated,
  recordActiveUsers
} from '@/lib/monitoring/middleware'

recordExplanationGenerated()
recordActiveUsers(currentUserCount)
```

## Configuration

### Environment Variables
- `CRON_SECRET`: Required for metrics endpoint access (security)
- `SLACK_WEBHOOK_URL`: Optional, for Slack alerts
- `PAGERDUTY_SERVICE_KEY`: Optional, for PagerDuty critical alerts

### Prometheus Configuration
`monitoring/prometheus.yml`:
- Scrape interval: 15s
- Evaluation interval: 15s
- Data retention: 30 days
- Targets: localhost:3000/api/metrics (enem-pro application)

### Grafana Configuration
`monitoring/grafana-datasources.yml`:
- Data source: Prometheus @ http://prometheus:9090
- Auto-provisioned with dashboard

### Alert Manager Configuration
`monitoring/alertmanager.yml`:
- Default receiver: logs only
- Critical alerts: PagerDuty
- Warning alerts: Slack #enem-pro-warnings
- Info alerts: Slack #enem-pro-info

## Troubleshooting

### Metrics Not Appearing
1. Verify application is running: `curl http://localhost:3000/health`
2. Check metrics endpoint: `curl -H "x-admin-secret: $CRON_SECRET" http://localhost:3000/api/metrics`
3. Verify CRON_SECRET is set: `echo $CRON_SECRET`

### Prometheus Not Scraping
1. Check Prometheus targets: http://localhost:9090/targets
2. Verify prometheus.yml syntax: `docker exec enem-pro-prometheus promtool check config /etc/prometheus/prometheus.yml`
3. Check logs: `docker logs enem-pro-prometheus`

### Alerts Not Triggering
1. Verify alert rules syntax: `docker exec enem-pro-prometheus promtool check rules /etc/prometheus/alerts.yml`
2. Check Prometheus > Alerts tab: http://localhost:9090/alerts
3. Verify metric thresholds are being crossed

### Grafana Dashboard Empty
1. Verify datasource: Grafana > Configuration > Data Sources > Prometheus
2. Test datasource: click "Save & Test"
3. Check queries: Dashboard > Panel > Edit > Query

## Testing

Run comprehensive metrics tests:
```bash
npm run test:metrics
```

This validates:
- Metrics endpoint accessibility
- Prometheus format compliance
- Metric value ranges
- Alert rules configuration
- Required metrics presence

## Performance Impact

Metrics collection adds minimal overhead:
- ~1-2ms per request for tracking
- ~100KB/day data generation
- Memory: ~10MB for metrics store (configurable)

## Maintenance

### Cleanup Old Data
```bash
# Prometheus: automatic (30 day retention configured)
# Manual cleanup if needed:
docker exec enem-pro-prometheus rm -rf /prometheus/wal
docker restart enem-pro-prometheus
```

### Update Dashboards
1. Edit in Grafana UI
2. Export JSON
3. Save to `monitoring/grafana-dashboards/`
4. Commit to git

### Update Alert Rules
1. Edit `monitoring/alerts.yml`
2. Run: `docker restart enem-pro-prometheus`
3. Verify rules: http://localhost:9090/alerts

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)
- [Alerting Rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)
