import { NextRequest, NextResponse } from 'next/server'
import { submitIndexNow } from '@/lib/indexnow'
import { cleanEnv } from '@/lib/utils'
import { withErrorHandling } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const secret = cleanEnv(process.env.CRON_SECRET)
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { submitted, results } = await submitIndexNow()
  return NextResponse.json({ submitted, results })
})
