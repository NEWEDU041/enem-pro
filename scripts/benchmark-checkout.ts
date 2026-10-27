#!/usr/bin/env tsx
/**
 * Checkout Performance Benchmark
 *
 * Tests the latency improvement from synchronous to asynchronous checkout
 * Requires: STRIPE_MONTHLY_PRICE_ID, STRIPE_ANNUAL_PRICE_ID, Redis, Bull configured
 *
 * Run:
 *   npx tsx scripts/benchmark-checkout.ts
 */

import { enqueueCheckout, getJobStatus } from '../lib/checkout-queue'

interface BenchmarkResult {
  sample: number
  enqueueTimeMs: number
  totalProcessingTimeMs: number
  isProcessed: boolean
}

const SAMPLES = 10
const RESULTS: BenchmarkResult[] = []

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runBenchmark(): Promise<void> {
  console.log('🚀 Checkout Async Benchmark Starting...\n')
  console.log(`Configuration:`)
  console.log(`  Samples: ${SAMPLES}`)
  console.log(`  Expected max latency per checkout: <500ms (old: 2,860ms)`)
  console.log(`  Improvement target: 86% reduction\n`)

  for (let i = 1; i <= SAMPLES; i++) {
    console.log(`[${i}/${SAMPLES}] Running benchmark sample...`)

    // Measure enqueue time
    const enqueueStart = Date.now()

    try {
      const { jobId } = await enqueueCheckout({
        userId: `bench-user-${i}-${Date.now()}`,
        email: `bench${i}@example.com`,
        plan: i % 2 === 0 ? 'annual' : 'monthly',
        priceId: i % 2 === 0 ? 'price_annual_test' : 'price_monthly_test',
        origin: 'https://questoesenem.pro',
      })

      const enqueueTimeMs = Date.now() - enqueueStart

      // Check status immediately (should be "processing")
      let isProcessed = false
      const statusStart = Date.now()

      // Wait up to 15 seconds for processing
      for (let pollAttempt = 0; pollAttempt < 15; pollAttempt++) {
        await sleep(1000)

        const status = await getJobStatus(jobId)

        if (status?.status === 'completed') {
          isProcessed = true
          break
        } else if (status?.status === 'failed') {
          console.error(`    ❌ Job failed: ${status.error}`)
          isProcessed = false
          break
        }
      }

      const totalProcessingTimeMs = Date.now() - statusStart

      RESULTS.push({
        sample: i,
        enqueueTimeMs,
        totalProcessingTimeMs,
        isProcessed,
      })

      console.log(`    ✅ Enqueue: ${enqueueTimeMs}ms | Processing: ${totalProcessingTimeMs}ms | Status: ${isProcessed ? 'completed' : 'timeout'}`)
    } catch (error) {
      console.error(`    ❌ Error: ${error instanceof Error ? error.message : String(error)}`)
      RESULTS.push({
        sample: i,
        enqueueTimeMs: -1,
        totalProcessingTimeMs: -1,
        isProcessed: false,
      })
    }

    await sleep(500) // Brief delay between samples
  }

  // Calculate statistics
  const validResults = RESULTS.filter((r) => r.enqueueTimeMs > 0)

  if (validResults.length === 0) {
    console.error('\n❌ No successful benchmark samples. Check Redis and Bull configuration.')
    process.exit(1)
  }

  const enqueueTimes = validResults.map((r) => r.enqueueTimeMs)
  const processingTimes = validResults.map((r) => r.totalProcessingTimeMs)

  const enqueueAvg = enqueueTimes.reduce((a, b) => a + b, 0) / enqueueTimes.length
  const enqueueMin = Math.min(...enqueueTimes)
  const enqueueMax = Math.max(...enqueueTimes)
  const enqueueP95 = enqueueTimes.sort((a, b) => a - b)[Math.floor(enqueueTimes.length * 0.95)]

  const processingAvg = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
  const processedCount = RESULTS.filter((r) => r.isProcessed).length

  console.log('\n' + '='.repeat(70))
  console.log('📊 BENCHMARK RESULTS')
  console.log('='.repeat(70))

  console.log('\n⏱️  Enqueue Time (HTTP 202 Response):')
  console.log(`    Average:  ${enqueueAvg.toFixed(2)}ms`)
  console.log(`    Min:      ${enqueueMin}ms`)
  console.log(`    Max:      ${enqueueMax}ms`)
  console.log(`    P95:      ${enqueueP95}ms`)

  const targetMet = enqueueAvg < 500 && enqueueP95 < 500
  console.log(`    Target:   <500ms ${targetMet ? '✅ MET' : '❌ NOT MET'}`)

  console.log('\n⏳ Processing Time (Time to completion):')
  console.log(`    Average:  ${processingAvg.toFixed(2)}ms`)
  console.log(`    Success:  ${processedCount}/${RESULTS.length}`)

  console.log('\n📈 Improvement:')
  const oldLatency = 2860
  const improvement = ((oldLatency - enqueueAvg) / oldLatency) * 100
  console.log(`    Old API latency:  ${oldLatency}ms`)
  console.log(`    New API latency:  ${enqueueAvg.toFixed(2)}ms`)
  console.log(`    Improvement:      ${improvement.toFixed(1)}%`)

  console.log('\n' + '='.repeat(70))

  if (targetMet) {
    console.log('✅ BENCHMARK PASSED: Async checkout meets latency targets')
  } else {
    console.log('⚠️  BENCHMARK WARNING: Some latency targets not met')
  }

  console.log('='.repeat(70))

  process.exit(targetMet ? 0 : 1)
}

// Run benchmark
runBenchmark().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
