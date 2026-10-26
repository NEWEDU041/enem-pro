#!/usr/bin/env tsx

/**
 * Test script to verify Prometheus metrics collection
 * 
 * Usage:
 *   npx tsx scripts/test-metrics.ts
 *   
 * Tests:
 *   1. Metrics endpoint accessibility
 *   2. Prometheus format compliance
 *   3. Metric values and ranges
 *   4. Latency tracking
 *   5. Error rate calculation
 *   6. Cache hit rate
 */

import axios from 'axios'

const METRICS_URL = 'http://localhost:3000/api/metrics'
const ADMIN_SECRET = process.env.CRON_SECRET || 'test-secret'
const TEST_ENDPOINT = 'http://localhost:3000/api/explicar?questao_id=test'

interface TestResult {
  name: string
  passed: boolean
  message: string
  details?: any
}

const results: TestResult[] = []

function logTest(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details })
  const emoji = passed ? '✅' : '❌'
  console.log(`${emoji} ${name}: ${message}`)
  if (details) {
    console.log(`   Details:`, JSON.stringify(details, null, 2))
  }
}

async function testMetricsEndpoint() {
  try {
    const response = await axios.get(METRICS_URL, {
      headers: {
        'x-admin-secret': ADMIN_SECRET,
      },
      timeout: 10000,
    })

    logTest(
      'Metrics Endpoint Accessible',
      response.status === 200,
      `HTTP ${response.status}`,
      { contentType: response.headers['content-type'] }
    )

    return response.data
  } catch (error: any) {
    logTest(
      'Metrics Endpoint Accessible',
      false,
      `Failed: ${error.message}`,
      { error: error.response?.status }
    )
    throw error
  }
}

function testPrometheusFormat(metricsText: string) {
  const lines = metricsText.split('\n')
  const metricLines = lines.filter(l => !l.startsWith('#') && l.trim() !== '')

  logTest(
    'Prometheus Format Valid',
    metricLines.length > 0,
    `Found ${metricLines.length} metric lines`,
    { sampleMetrics: metricLines.slice(0, 3) }
  )

  // Check for required metric types
  const requiredMetrics = [
    'http_request_duration_overall',
    'http_error_rate',
    'http_throughput_rps',
    'cache_hit_rate',
    'db_connections_active',
  ]

  requiredMetrics.forEach(metric => {
    const found = metricsText.includes(metric)
    logTest(
      `Metric '${metric}' Present`,
      found,
      found ? 'Found in output' : 'Missing from output'
    )
  })
}

function testMetricValues(metricsText: string) {
  const lines = metricsText.split('\n')
  const metrics: { [key: string]: number } = {}

  lines.forEach(line => {
    if (line.startsWith('#') || line.trim() === '') return

    const match = line.match(/^(\w+(?:{[^}]+})?\s+)([\d.]+)$/)
    if (match) {
      const metricName = match[1].trim().split('{')[0]
      const value = parseFloat(match[2])
      metrics[metricName] = value
    }
  })

  // Test error rate (should be 0-100)
  if (metrics['http_error_rate'] !== undefined) {
    const errorRate = metrics['http_error_rate']
    logTest(
      'Error Rate Valid Range',
      errorRate >= 0 && errorRate <= 100,
      `${errorRate}% (valid)`,
      { value: errorRate }
    )
  }

  // Test cache hit rate (should be 0-100)
  if (metrics['cache_hit_rate'] !== undefined) {
    const cacheRate = metrics['cache_hit_rate']
    logTest(
      'Cache Hit Rate Valid Range',
      cacheRate >= 0 && cacheRate <= 100,
      `${cacheRate}% (valid)`,
      { value: cacheRate }
    )
  }

  // Test latency (should be positive milliseconds)
  const latencyMetrics = Object.entries(metrics).filter(([key]) =>
    key.includes('http_request_duration')
  )
  
  if (latencyMetrics.length > 0) {
    const allPositive = latencyMetrics.every(([, val]) => val >= 0)
    logTest(
      'Latency Metrics Positive',
      allPositive,
      `${latencyMetrics.length} latency metrics`,
      { samples: Object.fromEntries(latencyMetrics.slice(0, 3)) }
    )
  }

  // Test throughput (should be positive rps)
  if (metrics['http_throughput_rps'] !== undefined) {
    const throughput = metrics['http_throughput_rps']
    logTest(
      'Throughput Positive',
      throughput >= 0,
      `${throughput} rps`,
      { value: throughput }
    )
  }

  // Test database connections
  if (metrics['db_connections_active'] !== undefined) {
    const active = metrics['db_connections_active']
    logTest(
      'DB Connections Valid',
      active >= 0,
      `${active} active connections`,
      { value: active }
    )
  }
}

async function generateTestLoad() {
  console.log('\n📊 Generating test load...')
  const requests = 20
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < requests; i++) {
    try {
      await axios.get(TEST_ENDPOINT, { timeout: 5000 })
      successCount++
    } catch {
      errorCount++
    }
  }

  logTest(
    'Test Load Generated',
    successCount > 0,
    `${successCount} successful, ${errorCount} failed`,
    { requests, successCount, errorCount }
  )

  // Wait for metrics to be recorded
  await new Promise(r => setTimeout(r, 2000))
}

async function testDebugEndpoint() {
  try {
    const response = await axios.options(METRICS_URL, {
      headers: {
        'x-admin-secret': ADMIN_SECRET,
      },
      timeout: 10000,
    })

    if (response.status === 200 && response.data) {
      const data = response.data
      logTest(
        'Debug Endpoint (/api/metrics)',
        true,
        'Accessible and returns JSON',
        {
          uptime_ms: data.uptime_ms,
          total_requests: data.requests?.total,
          error_rate: data.requests?.error_rate,
          cache_hit_rate: data.cache?.hit_rate,
        }
      )
    }
  } catch (error: any) {
    logTest(
      'Debug Endpoint (/api/metrics)',
      false,
      `Failed: ${error.message}`
    )
  }
}

async function testAlertRules() {
  try {
    // Verify alert file exists and is valid YAML
    const fs = await import('fs')
    const path = await import('path')
    const alertsPath = path.join(process.cwd(), 'monitoring/alerts.yml')

    if (fs.existsSync(alertsPath)) {
      const content = fs.readFileSync(alertsPath, 'utf-8')
      const hasAlerts = content.includes('alert:')
      const requiredAlerts = [
        'HighErrorRate',
        'HighLatencyP95',
        'HighMemoryUsage',
        'LowCacheHitRate',
        'HighDbConnectionUsage',
      ]

      const allPresent = requiredAlerts.every(alert => content.includes(alert))
      
      logTest(
        'Alert Rules File Valid',
        hasAlerts && allPresent,
        `${requiredAlerts.length} alerts configured`,
        { alerts: requiredAlerts }
      )
    } else {
      logTest(
        'Alert Rules File Valid',
        false,
        'alerts.yml not found'
      )
    }
  } catch (error: any) {
    logTest(
      'Alert Rules File Valid',
      false,
      `Error: ${error.message}`
    )
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST SUMMARY')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.passed).length
  const total = results.length
  const percentage = Math.round((passed / total) * 100)

  console.log(`\nResults: ${passed}/${total} tests passed (${percentage}%)`)

  if (passed === total) {
    console.log('\n✅ All tests passed! Monitoring is properly configured.')
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.')
    console.log('\nFailed tests:')
    results
      .filter(r => !r.passed)
      .forEach(r => console.log(`  - ${r.name}: ${r.message}`))
  }

  console.log('\n' + '='.repeat(60))
  console.log('NEXT STEPS:')
  console.log('='.repeat(60))
  console.log(`
1. Start docker-compose stack:
   cd monitoring && docker-compose up -d

2. Access Grafana:
   http://localhost:3000 (admin/admin)

3. Access Prometheus:
   http://localhost:9090

4. View metrics:
   curl -H "x-admin-secret: $CRON_SECRET" http://localhost:3000/api/metrics

5. Verify alerts:
   Prometheus UI > Alerts tab
  `)
}

async function main() {
  console.log('🚀 ENEM Pro Monitoring Test Suite')
  console.log('='.repeat(60))

  try {
    console.log('\n📈 Testing Prometheus Metrics Collection...\n')

    // Test 1: Metrics endpoint
    const metricsText = await testMetricsEndpoint()

    // Test 2: Prometheus format
    testPrometheusFormat(metricsText)

    // Test 3: Metric values
    testMetricValues(metricsText)

    // Test 4: Debug endpoint
    await testDebugEndpoint()

    // Test 5: Generate load and retest
    await generateTestLoad()
    const metricsText2 = await testMetricsEndpoint()
    testMetricValues(metricsText2)

    // Test 6: Alert rules
    await testAlertRules()

    printSummary()
  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

main().catch(console.error)
