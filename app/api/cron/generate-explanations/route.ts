import { NextRequest, NextResponse } from 'next/server'
import { YEARS } from '@/lib/enem-api'
import { generateExplanationBatch } from '@/lib/generate-explanations'
import { cleanEnv } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = cleanEnv(process.env.CRON_SECRET)
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const year = parseInt(req.nextUrl.searchParams.get('year') || '2023')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

  if (!YEARS.includes(year)) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  }

  const result = await generateExplanationBatch(year, offset, limit, Date.now() + 270_000)

  return NextResponse.json({
    ...result,
    next: result.stoppedEarly
      ? `Retomar: year=${year}&limit=${limit}&offset=${offset + result.processed}`
      : `Próximas: year=${year}&limit=${limit}&offset=${offset + limit}`,
  })
}
