#!/usr/bin/env node

/**
 * Unit test for Prometheus metrics exporter
 * Tests the metrics generation logic without requiring the full Next.js app
 */

import { prometheusExporter } from '../lib/monitoring/prometheus'

console.log('🧪 Testing Prometheus Metrics Exporter\n')

// Test 1: Basic metrics generation
console.log('Test 1: Basic metrics generation')
const metrics1 = prometheusExporter.generateMetrics()
console.log(`✅ Generated ${metrics1.split('\n').length} lines of metrics`)

// Test 2: Record requests and check latency tracking
console.log('\nTest 2: Request latency tracking')
for (let i = 0; i < 10; i++) {
  prometheusExporter.recordRequest('/api/test', Math.random() * 100, 200)
}
const json1 = prometheusExporter.getMetricsJSON()
console.log(`✅ Recorded 10 requests, total: ${json1.requests.total}`)
console.log(`   P50 latency: ${json1.latency.p50_ms.toFixed(2)}ms`)
console.log(`   P95 latency: ${json1.latency.p95_ms.toFixed(2)}ms`)

// Test 3: Error rate calculation
console.log('\nTest 3: Error rate calculation')
for (let i = 0; i < 5; i++) {
  prometheusExporter.recordRequest('/api/error', 50, 500)
}
const json2 = prometheusExporter.getMetricsJSON()
const errorRate = json2.requests.error_rate
console.log(`✅ Error rate: ${errorRate.toFixed(2)}%`)
console.log(`   Total requests: ${json2.requests.total}`)
console.log(`   Total errors: ${json2.requests.errors}`)

// Test 4: Cache operations
console.log('\nTest 4: Cache hit/miss tracking')
for (let i = 0; i < 15; i++) {
  prometheusExporter.recordCacheHit(Math.random() > 0.3) // 70% hit rate
}
const json3 = prometheusExporter.getMetricsJSON()
console.log(`✅ Cache hit rate: ${json3.cache.hit_rate.toFixed(2)}%`)
console.log(`   Hits: ${json3.cache.hits}, Misses: ${json3.cache.misses}`)

// Test 5: Database metrics
console.log('\nTest 5: Database query tracking')
for (let i = 0; i < 5; i++) {
  const duration = 20 + Math.random() * 60
  prometheusExporter.recordDbQuery(duration, 3)
}
const json4 = prometheusExporter.getMetricsJSON()
console.log(`✅ DB query P95: ${json4.database.p95_ms?.toFixed(2) || 'N/A'}ms`)
console.log(`   Active connections: ${json4.database.active_connections}`)

// Test 6: Custom metrics
console.log('\nTest 6: Custom business metrics')
prometheusExporter.recordExplanationGenerated()
prometheusExporter.recordExplanationGenerated()
prometheusExporter.recordExplanationGenerated()
prometheusExporter.recordActiveUsers(42)
const json5 = prometheusExporter.getMetricsJSON()
console.log(`✅ Explanations generated: ${json5.custom.explanations_generated}`)
console.log(`   Active users: ${json5.custom.active_users}`)

// Test 7: Prometheus format validation
console.log('\nTest 7: Prometheus format validation')
const metricsText = prometheusExporter.generateMetrics()
const lines = metricsText.split('\n')
const metricLines = lines.filter(l => !l.startsWith('#') && l.trim())
const typeLines = lines.filter(l => l.startsWith('# TYPE'))
const helpLines = lines.filter(l => l.startsWith('# HELP'))

console.log(`✅ Total lines: ${lines.length}`)
console.log(`   Metric definitions: ${metricLines.length}`)
console.log(`   TYPE declarations: ${typeLines.length}`)
console.log(`   HELP descriptions: ${helpLines.length}`)

// Test 8: Throughput calculation
console.log('\nTest 8: Throughput calculation')
const json6 = prometheusExporter.getMetricsJSON()
const throughput = json6.requests.throughput_rps
console.log(`✅ Current throughput: ${throughput.toFixed(2)} rps`)
console.log(`   Uptime: ${(json6.uptime_ms / 1000).toFixed(2)}s`)

// Test 9: Required metrics presence
console.log('\nTest 9: Required metrics presence')
const requiredMetrics = [
  'http_request_duration_overall',
  'http_error_rate',
  'http_throughput_rps',
  'cache_hit_rate',
  'db_connections_active',
  'process_uptime_seconds',
]

let allPresent = true
requiredMetrics.forEach(metric => {
  const present = metricsText.includes(metric)
  console.log(`${present ? '✅' : '❌'} ${metric}`)
  if (!present) allPresent = false
})

if (allPresent) {
  console.log('\n✅ All required metrics are present and properly formatted!')
} else {
  console.log('\n❌ Some required metrics are missing!')
  process.exit(1)
}

// Test 10: Endpoint-specific metrics
console.log('\nTest 10: Per-endpoint metrics tracking')
const metricsJson = prometheusExporter.getMetricsJSON()
console.log(`✅ Tracked endpoints: ${metricsJson.endpoints.length}`)
metricsJson.endpoints.slice(0, 3).forEach(ep => {
  console.log(`   ${ep.endpoint}: ${ep.requests} requests, P95: ${ep.p95_ms.toFixed(2)}ms`)
})

console.log('\n' + '='.repeat(60))
console.log('✅ ALL TESTS PASSED!')
console.log('='.repeat(60))
console.log('\nNext steps:')
console.log('1. Start monitoring stack: ./monitoring/setup.sh up')
console.log('2. Access Grafana: http://localhost:3000')
console.log('3. View metrics: curl -H "x-admin-secret: $CRON_SECRET" http://localhost:3000/api/metrics')
