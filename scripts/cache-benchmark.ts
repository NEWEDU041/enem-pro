#!/usr/bin/env tsx

/**
 * Cache Performance Benchmark Test
 * 
 * Tests cache hit/miss latency patterns on /api/explicar:
 * 1. Measures first call latency (cache miss): expect ~200ms with DB fetch
 * 2. Measures second call latency (cache hit): expect <5ms from Redis
 * 3. Reports hit rate percentage
 * 4. Reports before/after latency comparison
 * 
 * Run with: npm run test:cache-benchmark
 * Environment: Requires REDIS_URL and valid JWT token
 */

import { performance } from 'perf_hooks'

interface BenchmarkResult {
  questionId: string
  firstCall: {
    latency: number
    cached: boolean
    source?: string
  }
  secondCall: {
    latency: number
    cached: boolean
    source?: string
  }
}

async function benchmarkCache() {
  console.log('📊 Cache Performance Benchmark\n')
  console.log('=' .repeat(60))
  
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000'
  const testUserId = process.env.TEST_USER_ID || 'test-user-123'
  const jwtToken = process.env.JWT_TOKEN || ''

  if (!jwtToken) {
    console.error('❌ Missing JWT_TOKEN environment variable')
    process.exit(1)
  }

  // Test with a few representative questions
  const testQuestions = [
    '2023-1',
    '2023-2', 
    '2023-3',
    '2022-50',
    '2022-51',
  ]

  const results: BenchmarkResult[] = []
  let totalHits = 0
  let totalRequests = 0

  for (const questionId of testQuestions) {
    console.log(`\n📝 Testing question: ${questionId}`)
    console.log('-'.repeat(60))

    // First call (cache miss expected)
    const start1 = performance.now()
    const res1 = await fetch(`${apiBaseUrl}/api/explicar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        question_id: questionId,
        selected_alternative: 'B',
      }),
    })
    const latency1 = performance.now() - start1
    const data1 = await res1.json()

    const firstCallCached = data1.cached || false
    const source1 = data1.cache_source || 'generated'

    console.log(`  1st call: ${latency1.toFixed(2)}ms`)
    console.log(`    └─ Cached: ${firstCallCached}`)
    console.log(`    └─ Source: ${source1}`)

    if (!firstCallCached) {
      console.log(`    └─ ✓ Expected cache miss`)
    }

    // Small delay to allow Redis to settle
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Second call (cache hit expected)
    const start2 = performance.now()
    const res2 = await fetch(`${apiBaseUrl}/api/explicar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        question_id: questionId,
        selected_alternative: 'B',
      }),
    })
    const latency2 = performance.now() - start2
    const data2 = await res2.json()

    const secondCallCached = data2.cached || false
    const source2 = data2.cache_source || 'generated'

    console.log(`\n  2nd call: ${latency2.toFixed(2)}ms`)
    console.log(`    └─ Cached: ${secondCallCached}`)
    console.log(`    └─ Source: ${source2}`)

    if (secondCallCached && latency2 < 5) {
      console.log(`    └─ ✓ Excellent hit from cache (<5ms)`)
      totalHits++
    } else if (secondCallCached) {
      console.log(`    └─ ⚠️  Cache hit but slower than expected`)
      totalHits++
    } else {
      console.log(`    └─ ⚠️  Expected cache hit but got miss`)
    }

    totalRequests += 2
    results.push({
      questionId,
      firstCall: { latency: latency1, cached: firstCallCached, source: source1 },
      secondCall: { latency: latency2, cached: secondCallCached, source: source2 },
    })

    // Prevent rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📈 SUMMARY\n')

  const avgFirstCall = results.reduce((sum, r) => sum + r.firstCall.latency, 0) / results.length
  const avgSecondCall = results.reduce((sum, r) => sum + r.secondCall.latency, 0) / results.length
  const hitRate = (totalHits / totalRequests) * 100

  console.log(`Total Test Requests: ${totalRequests}`)
  console.log(`Cache Hits: ${totalHits}/${totalRequests}`)
  console.log(`Hit Rate: ${hitRate.toFixed(2)}%\n`)

  console.log(`Average Latency:`)
  console.log(`  • 1st call (miss): ${avgFirstCall.toFixed(2)}ms`)
  console.log(`  • 2nd call (hit): ${avgSecondCall.toFixed(2)}ms`)
  console.log(`  • Improvement: ${((avgFirstCall - avgSecondCall) / avgFirstCall * 100).toFixed(2)}%\n`)

  console.log(`Target Metrics:`)
  console.log(`  ✓ 1st call should be ~200ms: ${avgFirstCall < 300 ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  ✓ 2nd call should be <5ms: ${avgSecondCall < 5 ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  ✓ Hit rate should be >80%: ${hitRate > 80 ? '✅ PASS' : '❌ FAIL'}\n`)

  // Detailed results
  console.log('Detailed Results:')
  console.log('-'.repeat(60))
  results.forEach((r) => {
    console.log(`${r.questionId}:`)
    console.log(`  Miss (${r.firstCall.latency.toFixed(2)}ms) → Hit (${r.secondCall.latency.toFixed(2)}ms)`)
  })

  console.log('\n✨ Benchmark complete!\n')

  process.exit(hitRate > 80 && avgSecondCall < 5 ? 0 : 1)
}

benchmarkCache()
