import { NextRequest, NextResponse } from 'next/server'
import { fetchSingleQuestionCached } from '@/lib/questions-cache'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const parts = id.split('-')
  const year = parseInt(searchParams.get('year') || parts[0])
  const index = parseInt(parts[1])

  try {
    const question = await fetchSingleQuestionCached(year, index)
    return NextResponse.json({ question })
  } catch {
    return NextResponse.json({ question: null }, { status: 404 })
  }
}
