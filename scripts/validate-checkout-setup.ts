#!/usr/bin/env tsx
/**
 * Quick validation script for async checkout implementation
 * Tests core queue functions without requiring full app build
 *
 * Run:
 *   npx tsx scripts/validate-checkout-setup.ts
 */

import { enqueueCheckout, getJobStatus, closeQueue } from '../lib/checkout-queue'

async function main() {
  console.log('🔍 Validating Async Checkout Setup...\n')

  const checks = {
    queue_creation: false,
    enqueue_speed: false,
    status_retrieval: false,
    all_passed: false,
  }

  try {
    // Check 1: Queue Creation
    console.log('✅ Check 1: Queue Creation')
    console.log('   Initializing Bull queue with Redis...')

    const startTime = Date.now()

    // Check 2: Enqueue Performance
    console.log('✅ Check 2: Enqueue Performance')
    const { jobId, statusUrl } = await enqueueCheckout({
      userId: 'test-user-' + Date.now(),
      email: 'test@example.com',
      plan: 'monthly',
      priceId: 'price_test_monthly',
      origin: 'https://example.com',
    })

    const enqueueTime = Date.now() - startTime
    console.log(`   ✓ Job enqueued: ${jobId}`)
    console.log(`   ✓ Enqueue time: ${enqueueTime}ms (target: <100ms)`)

    if (enqueueTime < 100) {
      checks.enqueue_speed = true
      console.log('   ✅ PASS: Enqueue under 100ms')
    } else {
      console.log(`   ⚠️  WARNING: Enqueue took ${enqueueTime}ms`)
    }

    console.log(`   ✓ Status URL: ${statusUrl}`)

    checks.queue_creation = true

    // Check 3: Status Retrieval
    console.log('\n✅ Check 3: Status Retrieval')
    const statusStart = Date.now()
    const status = await getJobStatus(jobId)
    const statusTime = Date.now() - statusStart

    if (status) {
      console.log(`   ✓ Status retrieved in ${statusTime}ms`)
      console.log(`   ✓ Job status: ${status.status}`)
      console.log(`   ✓ Job ID matches: ${status.jobId === jobId}`)
      checks.status_retrieval = true
    } else {
      console.log('   ❌ FAIL: Could not retrieve status')
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 VALIDATION RESULTS')
    console.log('='.repeat(60))

    Object.entries(checks).forEach(([check, passed]) => {
      const status = passed ? '✅' : '❌'
      console.log(`${status} ${check.replace(/_/g, ' ')}: ${passed ? 'PASS' : 'FAIL'}`)
    })

    const allChecks = [
      checks.queue_creation,
      checks.enqueue_speed,
      checks.status_retrieval,
    ]
    checks.all_passed = allChecks.every((c) => c)

    console.log('='.repeat(60))

    if (checks.all_passed) {
      console.log('\n✅ All validation checks passed!')
      console.log('\n📝 Next steps:')
      console.log('   1. Configure STRIPE_MONTHLY_PRICE_ID in .env.local')
      console.log('   2. Configure STRIPE_ANNUAL_PRICE_ID in .env.local')
      console.log('   3. Run: npm run dev')
      console.log('   4. Test: curl -X POST http://localhost:3000/api/checkout')
      console.log('   5. Benchmark: npm run checkout:benchmark')
    } else {
      console.log('\n❌ Some checks failed. See above for details.')
      console.log('\n🔧 Troubleshooting:')
      console.log('   1. Ensure Redis is running: redis-cli ping')
      console.log('   2. Check Redis host/port in .env.local')
      console.log('   3. Verify Bull package is installed: npm ls bull')
    }

    process.exit(checks.all_passed ? 0 : 1)
  } catch (error) {
    console.error('\n❌ ERROR:', error instanceof Error ? error.message : String(error))
    console.error('\nMake sure Redis is running:')
    console.error('  docker run -d -p 6379:6379 redis:7-alpine')
    console.error('  or')
    console.error('  redis-server')

    process.exit(1)
  } finally {
    await closeQueue()
  }
}

main()
