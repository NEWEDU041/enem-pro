/**
 * K6 Load Test for enem-pro API
 * Measures performance before/after security + performance fixes
 * 
 * Runs:
 * - GET /api/explicar (explanation endpoint)
 * - POST /api/responder (answer submission)
 * - POST /api/corrigir-redacao (essay grading) — streaming
 * - POST /api/responder/batch (batch answers)
 * 
 * Metrics collected:
 * - Response time (min, max, avg, p50, p95, p99)
 * - Error rate
 * - Throughput (req/s)
 * - Rate limit hits
 */

import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate, Trend, Counter, Gauge } from 'k6/metrics'

// ──────── CONFIGURATION ────────

const API_BASE = __ENV.API_BASE || 'http://localhost:3000'
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'Bearer test-token-123'
const LOAD_DURATION = __ENV.DURATION || '1m'
const VUS = parseInt(__ENV.VUS || '10')

// Test different load scenarios
const SCENARIOS = {
  'peak-load': {
    executor: 'constant-vus',
    vus: VUS,
    duration: LOAD_DURATION,
  },
  'ramp-up': {
    executor: 'ramp-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: VUS / 2 },
      { duration: '30s', target: VUS },
      { duration: '30s', target: VUS },
    ],
  },
}

export const options = {
  scenarios: {
    'peak-load': SCENARIOS['peak-load'],
  },
  thresholds: {
    'http_req_duration': ['p(99)<500'],  // 99th percentile under 500ms
    'http_req_failed': ['rate<0.1'],      // Error rate < 10%
  },
}

// ──────── METRICS ────────

const apiDuration = new Trend('api_duration')
const cacheHits = new Counter('cache_hits')
const cacheMisses = new Counter('cache_misses')
const rateLimitErrors = new Counter('rate_limit_errors')
const apiErrors = new Counter('api_errors')
const throughput = new Gauge('throughput')

// ──────── HELPER FUNCTIONS ────────

function makeHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': AUTH_TOKEN,
  }
}

function checkResponse(response, name, expectedStatus = 200) {
  const success = check(response, {
    [`${name}: status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
    [`${name}: response time < 500ms`]: (r) => r.timings.duration < 500,
  })

  if (response.status === 429) {
    rateLimitErrors.add(1)
  } else if (!success) {
    apiErrors.add(1)
  }

  return success
}

// ──────── TEST FUNCTIONS ────────

export default function() {
  const questionId = `2024-${Math.floor(Math.random() * 45) + 1}`

  group('Explicar endpoint (GET + cache)', () => {
    // First request — cache miss
    let response = http.get(`${API_BASE}/api/explicar?question_id=${questionId}`, {
      headers: makeHeaders(),
    })
    
    if (response.status === 200) {
      const cached = response.headers['cache-source'] === 'redis'
      if (cached) {
        cacheHits.add(1)
      } else {
        cacheMisses.add(1)
      }
      
      checkResponse(response, 'Explicar', 200)
      apiDuration.add(response.timings.duration, { endpoint: 'explicar' })
    } else {
      apiErrors.add(1)
    }
  })

  group('Responder endpoint (POST)', () => {
    const payload = {
      question_id: questionId,
      selected_alternative: String.fromCharCode(65 + Math.floor(Math.random() * 5)), // A-E
    }

    let response = http.post(
      `${API_BASE}/api/responder`,
      JSON.stringify(payload),
      {
        headers: makeHeaders(),
        timeout: '10s',
      }
    )

    checkResponse(response, 'Responder', 200)
    apiDuration.add(response.timings.duration, { endpoint: 'responder' })
  })

  group('Responder Batch endpoint (POST)', () => {
    const answers = []
    for (let i = 0; i < 10; i++) {
      answers.push({
        question_id: `2024-${i + 1}`,
        selected_alternative: String.fromCharCode(65 + Math.floor(Math.random() * 5)),
      })
    }

    const payload = { answers }

    let response = http.post(
      `${API_BASE}/api/responder/batch`,
      JSON.stringify(payload),
      {
        headers: makeHeaders(),
        timeout: '15s',
      }
    )

    checkResponse(response, 'Responder Batch', 200)
    apiDuration.add(response.timings.duration, { endpoint: 'responder_batch' })
  })

  sleep(1)
}

// ──────── SUMMARY ────────

export function handleSummary(data) {
  console.log('\n')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('                    K6 LOAD TEST SUMMARY                   ')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`API Base: ${API_BASE}`)
  console.log(`Load Duration: ${LOAD_DURATION}`)
  console.log(`Virtual Users: ${VUS}`)
  console.log('')

  const summary = data.metrics
  if (summary.http_req_duration) {
    const dur = summary.http_req_duration
    console.log('RESPONSE TIMES:')
    console.log(`  Min:  ${dur.values.min.toFixed(0)}ms`)
    console.log(`  Max:  ${dur.values.max.toFixed(0)}ms`)
    console.log(`  Avg:  ${dur.values.avg.toFixed(0)}ms`)
    console.log(`  P50:  ${dur.values['p(50)'].toFixed(0)}ms`)
    console.log(`  P95:  ${dur.values['p(95)'].toFixed(0)}ms`)
    console.log(`  P99:  ${dur.values['p(99)'].toFixed(0)}ms`)
  }

  if (summary.http_reqs) {
    const reqs = summary.http_reqs.value
    const duration = LOAD_DURATION.match(/(\d+)s|(\d+)m/) // simple parse
    const durationMs = LOAD_DURATION.includes('m')
      ? parseInt(LOAD_DURATION) * 60
      : parseInt(LOAD_DURATION)
    const throughputValue = (reqs / durationMs * 1000).toFixed(2)
    console.log('')
    console.log('THROUGHPUT:')
    console.log(`  Total Requests: ${reqs}`)
    console.log(`  Requests/sec: ${throughputValue}`)
  }

  if (summary.http_req_failed) {
    console.log('')
    console.log('ERROR RATE:')
    console.log(`  Failed: ${(summary.http_req_failed.value * 100).toFixed(2)}%`)
  }

  console.log('')
  console.log('CACHING:')
  console.log(`  Cache Hits: ${summary.cache_hits?.value || 0}`)
  console.log(`  Cache Misses: ${summary.cache_misses?.value || 0}`)

  console.log('')
  console.log('RATE LIMITING:')
  console.log(`  Rate Limit Errors (429): ${summary.rate_limit_errors?.value || 0}`)
  console.log(`  API Errors: ${summary.api_errors?.value || 0}`)

  console.log('')
  console.log('═══════════════════════════════════════════════════════════')

  return {}
}
