import { NextRequest, NextResponse } from 'next/server'
import { fetchQuestionsByYear } from '@/lib/enem-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') || id.split('-')[0])
  const index = parseInt(id.split('-')[1]) - 1

  try {
    const questions = await fetchQuestionsByYear(year)
    const question = questions[index] || null
    return NextResponse.json({ question })
  } catch {
    return NextResponse.json({ question: null }, { status: 404 })
  }
}
