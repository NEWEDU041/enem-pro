import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { cleanEnv } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret')
  if (!secret || secret !== cleanEnv(process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createServerClient()
  const startTime = Date.now()

  try {
    // Test 1: Cache effectiveness (RTK)
    const { count: cachedQuestions } = await sb
      .from('question_explanations')
      .select('*', { count: 'exact', head: true })

    // Test 2: Optimized responder (should be <100ms)
    const responderStart = Date.now()
    const { data: responderData, error: responderError } = await sb.rpc('record_answer', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_question_id: 'test',
      p_selected_alternative: 'A',
      p_correct_alternative: 'A',
      p_free_daily_limit: 50,
    })
    const responderTime = Date.now() - responderStart

    // Test 3: Stats view (should be <50ms)
    const statsStart = Date.now()
    const { data: statsData, error: statsError } = await sb
      .from('stats_snapshot')
      .select('*')
      .limit(1)
      .maybeSingle()
    const statsTime = Date.now() - statsStart

    // Test 4: Question cache retrieval (should be <10ms)
    const cacheStart = Date.now()
    const { data: cacheData, error: cacheError } = await sb
      .from('question_explanations')
      .select('explanation')
      .limit(1)
      .maybeSingle()
    const cacheTime = Date.now() - cacheStart

    const totalTime = Date.now() - startTime

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      performance: {
        total_ms: totalTime,
        responder_ms: responderTime,
        stats_ms: statsTime,
        cache_ms: cacheTime,
      },
      data: {
        cached_questions: cachedQuestions ?? 0,
        has_stats_view: !!statsData,
        has_explanations: !!cacheData,
      },
      errors: {
        responder_error: responderError?.message,
        stats_error: statsError?.message,
        cache_error: cacheError?.message,
      },
      recommendations: [
        responderTime > 100 ? '⚠️  Responder slow: check SQL function' : '✅ Responder optimized',
        statsTime > 50 ? '⚠️  Stats slow: check materialized view' : '✅ Stats optimized',
        cacheTime > 10 ? '⚠️  Cache slow: add indexes' : '✅ Cache optimized',
        (cachedQuestions ?? 0) < 700 ? '⚠️  Low cache: run generation script' : '✅ Cache full',
      ],
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Performance check failed', detail: String(error) },
      { status: 500 }
    )
  }
}
