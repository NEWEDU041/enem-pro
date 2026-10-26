import { NextRequest, NextResponse } from 'next/server'
import {
  fetchQuestionsByYearCached as fetchQuestionsByYear,
  filterAndPaginateQuestions,
  DEFAULT_QUESTIONS_YEAR,
} from '@/lib/questions-cache'
import { requireAuth } from '@/lib/auth'
import { checkUserRateLimit } from '@/lib/user-rate-limit'
import { createServerClient } from '@/lib/supabase'
import { SentryClient } from '@/lib/sentry/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') || String(DEFAULT_QUESTIONS_YEAR))
  const discipline = searchParams.get('discipline') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  const startTime = Date.now()

  // USER-BASED RATE LIMITING (optional for authenticated users)
  const auth = await requireAuth(request)
  if (auth.ok) {
    const supabase = createServerClient()
    const rl = await checkUserRateLimit(auth.userId, supabase, '/api/questoes')
    if (!rl.ok) {
      const headers: Record<string, string> = rl.headers || {}
      return NextResponse.json(
        { 
          error: 'Limite de requisições atingido',
          tier: rl.tier,
          reset_at: rl.resetAt.toISOString(),
        },
        { status: 429, headers }
      )
    }
  }

  try {
    const all = await fetchQuestionsByYear(year)
    const { questions, total, page: safePage } = filterAndPaginateQuestions(all, discipline, page, limit)

    const duration = Date.now() - startTime
    
    // Track slow queries
    if (duration > 1000) {
      SentryClient.captureWarning(`Slow query in GET /api/questoes: ${duration}ms`, {
        endpoint: '/api/questoes',
        status: 200,
        method: 'GET',
        duration: duration,
        year,
        discipline,
      })
    }

    return NextResponse.json({ 
      questions, 
      total, 
      page: safePage, 
      limit,
      ...(auth.ok && { tier_applied: true })
    })
  } catch (error) {
    const duration = Date.now() - startTime
    
    SentryClient.captureException(error as Error, {
      endpoint: '/api/questoes',
      status: 500,
      method: 'GET',
      duration: duration,
      year,
      discipline,
      path: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
    })
    
    return NextResponse.json({ error: 'Erro ao buscar questões' }, { status: 500 })
  }
}
