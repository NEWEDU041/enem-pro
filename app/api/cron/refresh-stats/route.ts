import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { withErrorHandling } from '@/lib/api-helpers'
import { cleanEnv } from '@/lib/utils'
import { timingSafeEqual } from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

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

  const supabase = createServerClient()
  const { error } = await supabase.rpc('refresh_stats_snapshot')

  if (error) {
    console.error('[refresh-stats]', error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, refreshed_at: new Date().toISOString() })
})
