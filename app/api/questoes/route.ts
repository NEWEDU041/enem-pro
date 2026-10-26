import { NextRequest, NextResponse } from 'next/server'
import {
  fetchQuestionsByYearCached as fetchQuestionsByYear,
  filterAndPaginateQuestions,
  DEFAULT_QUESTIONS_YEAR,
} from '@/lib/questions-cache'
import { SentryClient } from '@/lib/sentry/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') || String(DEFAULT_QUESTIONS_YEAR))
  const discipline = searchParams.get('discipline') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  const startTime = Date.now()

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

    return NextResponse.json({ questions, total, page: safePage, limit })
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
