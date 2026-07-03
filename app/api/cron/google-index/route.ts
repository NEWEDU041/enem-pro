import { NextRequest, NextResponse } from 'next/server'
import { dripDailyGoogleIndex } from '@/lib/google-indexing'
import { cleanEnv } from '@/lib/utils'
import { withErrorHandling } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Drip diário de indexação no Google (10 posts/dia em rotação).
export const GET = withErrorHandling(async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization')
  const secret = cleanEnv(process.env.CRON_SECRET)

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await dripDailyGoogleIndex()
  return NextResponse.json({ ok: true, ...result })
})
