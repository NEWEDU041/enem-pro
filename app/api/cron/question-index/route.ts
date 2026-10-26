import { NextRequest, NextResponse } from 'next/server'
import { dripDailyQuestionIndex } from '@/lib/google-indexing'
import { cleanEnv } from '@/lib/utils'
import { withErrorHandling } from '@/lib/api-helpers'
import { timingSafeEqual } from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Drip diário de indexação no Google para páginas de questões
// (listagens por disciplina/ano, gabaritos, e questões individuais em rotação).
export const GET = withErrorHandling(async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization')
  const secret = cleanEnv(process.env.CRON_SECRET)

  if (!secret || !authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const expectedHeader = `Bearer ${secret}`
  const expectedBuf = Buffer.from(expectedHeader)
  const actualBuf = Buffer.from(authHeader)

  const isValid = expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf)
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await dripDailyQuestionIndex()
  return NextResponse.json({ ok: true, ...result })
})
