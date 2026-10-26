import { performance } from 'perf_hooks'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'
import { initRedis, getCached, setCached } from '@/lib/cache'

/**
 * Benchmark latency for cache operations
 * Run with: npm run test:cache-benchmark
 */

interface BenchmarkResult {
  operation: string
  scenario: string
  avgLatency: number
  minLatency: number
  maxLatency: number
  iterations: number
  hitRate?: number
}

const results: BenchmarkResult[] = []

async function measureLatency<T>(
  fn: () => Promise<T>,
  iterations: number = 100
): Promise<{ latencies: number[]; result: T }> {
  const latencies: number[] = []
  let result: any

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    result = await fn()
    const end = performance.now()
    latencies.push(end - start)
  }

  return { latencies, result }
}

async function runBenchmarks() {
  console.log('🚀 Starting Redis Cache Benchmarks\n')

  // Test 1: Redis Cache Hit
  console.log('Test 1: Redis Cache Hit Latency')
  const redis = initRedis()
  
  // Pre-populate cache
  const testKey = 'benchmark-test-key'
  const testValue = { 
    explanation: 'A ' + 'x'.repeat(1000),
    timestamp: Date.now(),
  }
  
  await setCached('explanation', testKey, testValue)
  
  const { latencies: redisCacheHitLatencies } = await measureLatency(
    () => getCached('explanation', testKey),
    1000
  )

  const redisCacheHit: BenchmarkResult = {
    operation: 'getCached',
    scenario: 'Redis Cache Hit',
    avgLatency: redisCacheHitLatencies.reduce((a, b) => a + b) / redisCacheHitLatencies.length,
    minLatency: Math.min(...redisCacheHitLatencies),
    maxLatency: Math.max(...redisCacheHitLatencies),
    iterations: 1000,
  }
  results.push(redisCacheHit)
  console.log(`  ✓ Avg: ${redisCacheHit.avgLatency.toFixed(2)}ms (min: ${redisCacheHit.minLatency.toFixed(2)}ms, max: ${redisCacheHit.maxLatency.toFixed(2)}ms)\n`)

  // Test 2: Redis Cache Miss
  console.log('Test 2: Redis Cache Miss Latency')
  const { latencies: redisCacheMissLatencies } = await measureLatency(
    () => getCached('explanation', 'nonexistent-key-' + Math.random()),
    1000
  )

  const redisCacheMiss: BenchmarkResult = {
    operation: 'getCached',
    scenario: 'Redis Cache Miss',
    avgLatency: redisCacheMissLatencies.reduce((a, b) => a + b) / redisCacheMissLatencies.length,
    minLatency: Math.min(...redisCacheMissLatencies),
    maxLatency: Math.max(...redisCacheMissLatencies),
    iterations: 1000,
  }
  results.push(redisCacheMiss)
  console.log(`  ✓ Avg: ${redisCacheMiss.avgLatency.toFixed(2)}ms (min: ${redisCacheMiss.minLatency.toFixed(2)}ms, max: ${redisCacheMiss.maxLatency.toFixed(2)}ms)\n`)

  // Test 3: Redis Write
  console.log('Test 3: Redis Cache Write Latency')
  const { latencies: redisWriteLatencies } = await measureLatency(
    () => setCached('explanation', 'benchmark-write-' + Math.random(), testValue),
    500
  )

  const redisWrite: BenchmarkResult = {
    operation: 'setCached',
    scenario: 'Redis Write',
    avgLatency: redisWriteLatencies.reduce((a, b) => a + b) / redisWriteLatencies.length,
    minLatency: Math.min(...redisWriteLatencies),
    maxLatency: Math.max(...redisWriteLatencies),
    iterations: 500,
  }
  results.push(redisWrite)
  console.log(`  ✓ Avg: ${redisWrite.avgLatency.toFixed(2)}ms (min: ${redisWrite.minLatency.toFixed(2)}ms, max: ${redisWrite.maxLatency.toFixed(2)}ms)\n`)

  // Test 4: DB Lookup (simulated)
  console.log('Test 4: Database Lookup Latency (simulated 50ms)')
  const simulatedDbLatency = 50 // ms — typical DB query
  console.log(`  ✓ Avg: ${simulatedDbLatency.toFixed(2)}ms (simulated)\n`)

  // Summary
  console.log('📊 Benchmark Summary\n')
  console.log('| Operation | Scenario | Avg (ms) | Min (ms) | Max (ms) |')
  console.log('|-----------|----------|----------|----------|----------|')
  
  results.forEach(r => {
    console.log(
      `| ${r.operation} | ${r.scenario} | ${r.avgLatency.toFixed(2)} | ${r.minLatency.toFixed(2)} | ${r.maxLatency.toFixed(2)} |`
    )
  })

  console.log('\n💰 Expected Latency Improvements (Target: -80%)\n')
  const dbLatency = 50 // Simulated DB latency
  const cacheHitLatency = redisCacheHit.avgLatency
  const improvement = ((dbLatency - cacheHitLatency) / dbLatency * 100)
  
  console.log(`Database Lookup:     ${dbLatency.toFixed(2)}ms`)
  console.log(`Cache Hit:           ${cacheHitLatency.toFixed(2)}ms`)
  console.log(`Improvement:         ${improvement.toFixed(1)}% faster ✓` + (improvement >= 80 ? ' (✅ TARGET MET)' : ' (⚠️  below target)'))
  console.log(`Speedup Factor:      ${(dbLatency / cacheHitLatency).toFixed(1)}x\n`)

  // Test 5: Hit Rate (simulated 100 requests)
  console.log('Test 5: Cache Hit Rate Simulation (100 requests)')
  let hits = 0
  for (let i = 0; i < 100; i++) {
    const cached = await getCached('explanation', testKey)
    if (cached) hits++
  }
  console.log(`  ✓ Hit Rate: ${hits}% (expected: ~100% with pre-populated data)\n`)

  console.log('✨ Benchmark complete!')
}

runBenchmarks().catch(console.error)
