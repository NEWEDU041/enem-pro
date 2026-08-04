import { NextRequest, NextResponse } from 'next/server'
import {
  fetchQuestionsByYearCached as fetchQuestionsByYear,
  filterAndPaginateQuestions,
  DEFAULT_QUESTIONS_YEAR,
} from '@/lib/questions-cache'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') || String(DEFAULT_QUESTIONS_YEAR))
  const discipline = searchParams.get('discipline') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  try {
    const all = await fetchQuestionsByYear(year)
    const { questions, total, page: safePage } = filterAndPaginateQuestions(all, discipline, page, limit)

    return NextResponse.json({ questions, total, page: safePage, limit })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar questões' }, { status: 500 })
  }
}
