#!/usr/bin/env tsx

/**
 * Cache pre-warming script
 * 
 * Pre-populates Redis with frequently accessed data on app startup
 * This improves cold-start performance and reduces initial DB load
 * 
 * Run with: npm run cache:warm
 * Or during Docker container initialization
 */

import { createServerClient } from '@/lib/supabase'
import { setCached } from '@/lib/cache'
import logger from '@/lib/logger'

async function warmCache() {
  console.log('🔥 Starting cache pre-warming...\n')
  
  const startTime = performance.now()
  const supabase = createServerClient()

  try {
    // 1. Pre-warm top 100 recent explanations
    console.log('1️⃣  Loading top 100 recent explanations...')
    const { data: explanations, error: expError } = await supabase
      .from('question_explanations')
      .select('question_id, explanation')
      .order('created_at', { ascending: false })
      .limit(100)

    if (expError) {
      console.warn(`⚠️  Failed to load explanations: ${expError.message}`)
    } else if (explanations && explanations.length > 0) {
      let cached = 0
      for (const exp of explanations) {
        const success = await setCached('explanation', exp.question_id, {
          explanation: exp.explanation,
        })
        if (success) cached++
      }
      console.log(`  ✓ Cached ${cached}/${explanations.length} explanations\n`)
    }

    // 2. Pre-warm stripe price IDs
    console.log('2️⃣  Caching Stripe price configuration...')
    const monthlyPrice = process.env.STRIPE_PRICE_ID_MONTHLY
    const annualPrice = process.env.STRIPE_PRICE_ID_ANNUAL

    if (monthlyPrice && annualPrice) {
      await setCached('stripe_price', 'monthly', { price_id: monthlyPrice })
      await setCached('stripe_price', 'annual', { price_id: annualPrice })
      console.log('  ✓ Stripe prices cached\n')
    } else {
      console.warn('  ⚠️  Stripe prices not configured\n')
    }

    // 3. Log summary
    const elapsed = (performance.now() - startTime).toFixed(0)
    console.log(`✨ Cache pre-warming complete (${elapsed}ms)\n`)

    logger.info({
      label: 'cache_pre_warming_complete',
      elapsed: parseInt(elapsed),
      explanations_cached: explanations?.length || 0,
    })

    process.exit(0)
  } catch (error) {
    console.error('❌ Cache pre-warming failed:', error)
    logger.error({
      err: error,
      label: 'cache_pre_warming_failed',
    })
    process.exit(1)
  }
}

warmCache()
