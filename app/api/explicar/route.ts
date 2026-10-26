import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { cleanEnv, isPro, FREE_DAILY_EXPLANATIONS } from '@/lib/utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { PROMPTS } from '@/lib/ai-prompts'
import { fetchSingleQuestionCached } from '@/lib/questions-cache'
import { initLogContext, createRequestLogger, logSuccess, logError, logEvent } from '@/lib/logger'
import { batchFetchUserContext, logBatchOperation } from '@/lib/db-helpers'
import { ExplicarRequestSchema, validateRequestBody } from '@/lib/validation'
import { getCached, setCached } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const logContext = initLogContext(request)
  const logger = createRequestLogger(logContext)
  const startTime = performance.now()
  
  const auth = await requireAuth(request)
  if (!auth.ok) {
    logError(logger, logContext, {
      status: 401,
      endpoint: '/api/explicar',
      error: 'Authentication failed',
    })
    return auth.response
  }
  const { userId } = auth
  logContext.userId = userId

  // INPUT VALIDATION
  const validation = await validateRequestBody(request, ExplicarRequestSchema)
  if (!validation.ok) {
    logError(logger, logContext, {
      status: 400,
      endpoint: '/api/explicar',
      error: 'Validation failed',
      metadata: { details: validation.error.details },
    })
    return NextResponse.json(validation.error, { status: 400 })
  }
  const { question_id, selected_alternative } = validation.data

  const supabase = createServerClient()

  // 1. L1 CACHE — Redis (fastest)
  if (question_id) {
    const cached = await getCached<{ explanation: string }>('explanation', question_id)
    if (cached) {
      const latency = Math.round(performance.now() - startTime)
      logEvent(logger, 'cache_hit_redis', { question_id, latency })
      return NextResponse.json({ 
        explanation: cached.explanation, 
        cached: true,
        cache_source: 'redis',
        latency_ms: latency,
      })
    }
  }

  // 2. L2 CACHE — Supabase DB
  if (question_id) {
    const { data: cached } = await supabase
      .from('question_explanations')
      .select('explanation')
      .eq('question_id', question_id)
      .maybeSingle()

    if (cached?.explanation) {
      // Promote from DB to Redis cache
      setCached('explanation', question_id, cached).catch(e => {
        logEvent(logger, 'redis_cache_promote_failed', { error: String(e) })
      })
      
      const latency = Math.round(performance.now() - startTime)
      logEvent(logger, 'cache_hit_db', { question_id, latency })
      return NextResponse.json({ 
        explanation: cached.explanation, 
        cached: true,
        cache_source: 'database',
        latency_ms: latency,
      })
    }
  }

  const { data: sub, error: subError } = await supabase.from('subscriptions').select('plan, expires_at').eq('user_id', userId).maybeSingle()

  if (subError) {
    logError(logger, logContext, {
      status: 500,
      endpoint: '/api/explicar',
      error: 'Subscription lookup error',
      metadata: { supabaseError: subError.message },
    })
    return NextResponse.json({ error: 'Erro ao verificar plano' }, { status: 500 })
  }

  const userIsPro = isPro(sub)

  const rl = await checkRateLimit(userId, supabase, userIsPro)
  if (!rl.ok) {
    logError(logger, logContext, {
      status: 429,
      endpoint: '/api/explicar',
      error: 'Rate limit exceeded',
      metadata: { retryAfterMs: rl.retryAfterMs },
    })
    return NextResponse.json(
      { error: 'Muitas requisições. Aguarde alguns segundos.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    )
  }

  if (!userIsPro) {
    const today = new Date().toISOString().split('T')[0]
    // OPTIMIZATION: batch query for daily_usage (already indexed in idx_daily_usage_user_date)
    const { data: usage, error: usageError } = await supabase
      .from('daily_usage')
      .select('explanation_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    if (usageError) {
      logError(logger, logContext, {
        status: 500,
        endpoint: '/api/explicar',
        error: 'Daily usage lookup error',
        metadata: { supabaseError: usageError.message },
      })
      return NextResponse.json({ error: 'Erro ao verificar limite diário' }, { status: 500 })
    }

    const usedToday = usage?.explanation_count || 0
    if (usedToday >= FREE_DAILY_EXPLANATIONS) {
      return NextResponse.json({ error: 'Plano Pro necessário', freeTrialUsed: true }, { status: 403 })
    }

    // Increment usage counter
    const { error: upsertError } = await supabase.from('daily_usage').upsert(
      { user_id: userId, date: today, explanation_count: usedToday + 1 },
      { onConflict: 'user_id,date' }
    )

    if (upsertError) {
      logError(logger, logContext, {
        status: 500,
        endpoint: '/api/explicar',
        error: 'Daily usage update error',
        metadata: { supabaseError: upsertError.message },
      })
      // Non-blocking error: continue even if usage tracking fails
    }
  }

  // 2. Cache miss — return empty + log for batch generation
  // All explanations should be pre-generated via bulk script
  // This is a safety fallback only
  logEvent(logger, 'cache_miss', { question_id })

  // Optional: generate on-demand as fallback for Pro users only
  if (userIsPro && question_id) {
    try {
      const [yearStr, indexStr] = question_id.split('-')
      const question = await fetchSingleQuestionCached(Number(yearStr), Number(indexStr))
      if (!question) {
        logError(logger, logContext, {
          status: 404,
          endpoint: '/api/explicar',
          error: 'Question not found',
          metadata: { question_id },
        })
        return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
      }

      const anthropic = new Anthropic({ apiKey: cleanEnv(process.env.ANTHROPIC_API_KEY) })

      const alternativesText = question.alternatives
        .map(a => `${a.letter}) ${a.text}`)
        .join('\n')

      const wrong = !!selected_alternative && selected_alternative !== question.correctAlternative
      const selectedText = wrong
        ? question.alternatives.find(a => a.letter === selected_alternative)?.text
        : null

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: wrong ? PROMPTS.EXPLAIN_WRONG : PROMPTS.EXPLAIN_ANSWER,
        messages: [
          {
            role: 'user',
            content: `${question.discipline} (ENEM ${question.year})\n\n${question.title}\n\nAlternativas:\n${alternativesText}\n\nCorreta: ${question.correctAlternative}${wrong && selectedText ? `\nAluno escolheu: ${selected_alternative}) ${selectedText}` : ''}`,
          },
        ],
      })

      const explanation = message.content[0].type === 'text' ? message.content[0].text : ''

      // Cache both to DB and Redis
      supabase.from('question_explanations').upsert({
        question_id,
        explanation,
        model: 'claude-haiku-4-5-20251001',
      }, { onConflict: 'question_id' }).then(({ error }) => {
        if (error) console.error('[explicar] db cache upsert failed:', error.message)
      })

      // Async Redis cache write
      setCached('explanation', question_id, { explanation }).catch(e => {
        console.error('[explicar] redis cache upsert failed:', String(e))
      })

      const latency = Math.round(performance.now() - startTime)
      logEvent(logger, 'generated_on_demand', { question_id, latency })

      return NextResponse.json({ 
        explanation, 
        fallback: true,
        latency_ms: latency,
      })
    } catch (e) {
      logError(logger, logContext, {
        status: 500,
        endpoint: '/api/explicar',
        error: e instanceof Error ? e : new Error(String(e)),
        metadata: { fallback: true },
      })
    }
  }

  return NextResponse.json(
    { error: 'Explicação não disponível. Use o script de geração em batch.' },
    { status: 202 } // 202 = Accepted but not yet generated
  )
}
