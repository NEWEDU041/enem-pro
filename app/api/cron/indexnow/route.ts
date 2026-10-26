import { NextRequest, NextResponse } from 'next/server'
import { submitIndexNow } from '@/lib/indexnow'
import { cleanEnv } from '@/lib/utils'
import { withErrorHandling } from '@/lib/api-helpers'
import { timingSafeEqual } from 'crypto'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
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

  const { submitted, results } = await submitIndexNow()
  return NextResponse.json({ submitted, results })
})
