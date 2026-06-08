import { NextRequest, NextResponse } from 'next/server'
import { fetchQuestionsByYearCached } from '@/lib/questions-cache'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const YEARS = [2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009]

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, string> = {}

  for (const year of YEARS) {
    try {
      const questions = await fetchQuestionsByYearCached(year)
      results[year] = `ok (${questions.length} questões)`
    } catch (err) {
      results[year] = `erro: ${err instanceof Error ? err.message : 'desconhecido'}`
    }
  }

  return NextResponse.json({ warmed: results })
}
