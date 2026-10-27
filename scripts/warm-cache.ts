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
import { setCached, initRedis } from '@/lib/cache'
import logger from '@/lib/logger'

async function warmCache() {
  console.log('🔥 Starting cache pre-warming...\n')
  
  const startTime = performance.now()
  
  // Initialize Redis before starting
  try {
    initRedis()
  } catch (e) {
    console.error('❌ Failed to initialize Redis:', e)
    process.exit(1)
  }
  
  const supabase = createServerClient()

  try {
    // 1. Pre-warm top 100 most-accessed explanations
    console.log('1️⃣  Loading top 100 most-accessed explanations...')
    const { data: explanations, error: expError } = await supabase
      .from('question_explanations')
      .select('question_id, explanation')
      .order('accessed_at', { ascending: false })
      .limit(100)

    if (expError) {
      console.warn(`⚠️  Failed to load explanations: ${expError.message}`)
    } else if (explanations && explanations.length > 0) {
      let cached = 0
      const cachingStart = performance.now()
      
      for (const exp of explanations) {
        const success = await setCached('explanation', exp.question_id, {
          explanation: exp.explanation,
        })
        if (success) cached++
      }
      
      const cachingTime = (performance.now() - cachingStart).toFixed(0)
      console.log(`  ✓ Cached ${cached}/${explanations.length} explanations (${cachingTime}ms)\n`)
    }

    // 2. Pre-warm top 100 most-accessed questions
    console.log('2️⃣  Loading top 100 most-accessed questions...')
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('*')
      .order('accessed_at', { ascending: false })
      .limit(100)

    if (qError) {
      console.warn(`⚠️  Failed to load questions: ${qError.message}`)
    } else if (questions && questions.length > 0) {
      let cached = 0
      const cachingStart = performance.now()
      
      for (const q of questions) {
        const success = await setCached('question', q.id, q)
        if (success) cached++
      }
      
      const cachingTime = (performance.now() - cachingStart).toFixed(0)
      console.log(`  ✓ Cached ${cached}/${questions.length} questions (${cachingTime}ms)\n`)
    }

    // 3. Pre-warm stripe price IDs
    console.log('3️⃣  Caching Stripe price configuration...')
    const monthlyPrice = process.env.STRIPE_PRICE_ID_MONTHLY
    const annualPrice = process.env.STRIPE_PRICE_ID_ANNUAL

    if (monthlyPrice && annualPrice) {
      await setCached('stripe_price', 'monthly', { price_id: monthlyPrice })
      await setCached('stripe_price', 'annual', { price_id: annualPrice })
      console.log('  ✓ Stripe prices cached\n')
    } else {
      console.warn('  ⚠️  Stripe prices not configured\n')
    }

    // 4. Log summary
    const elapsed = (performance.now() - startTime).toFixed(0)
    console.log(`✨ Cache pre-warming complete (${elapsed}ms)`)
    console.log(`   • Explanations: ${explanations?.length || 0}`)
    console.log(`   • Questions: ${questions?.length || 0}`)
    console.log(`   • Total: ${(explanations?.length || 0) + (questions?.length || 0)}\n`)

    logger.info({
      label: 'cache_pre_warming_complete',
      elapsed: parseInt(elapsed),
      explanations_cached: explanations?.length || 0,
      questions_cached: questions?.length || 0,
      total_cached: (explanations?.length || 0) + (questions?.length || 0),
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
