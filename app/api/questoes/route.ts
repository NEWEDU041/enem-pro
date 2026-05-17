import { NextRequest, NextResponse } from 'next/server'
import { fetchQuestionsByYear } from '@/lib/enem-api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') || '2023')
  const discipline = searchParams.get('discipline') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20

  try {
    let questions = await fetchQuestionsByYear(year)

    if (discipline) {
      questions = questions.filter((q) =>
        q.discipline.toLowerCase().includes(discipline.toLowerCase())
      )
    }

    const start = (page - 1) * limit
    const paginated = questions.slice(start, start + limit)
    const total = questions.length

    return NextResponse.json({ questions: paginated, total, page, limit })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar questões' }, { status: 500 })
  }
}
