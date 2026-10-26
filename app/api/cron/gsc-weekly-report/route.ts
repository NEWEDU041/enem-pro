import { NextRequest, NextResponse } from 'next/server'
import { cleanEnv } from '@/lib/utils'
import { timingSafeEqual } from 'crypto'

export const maxDuration = 60

export async function GET(request: NextRequest) {
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

  return NextResponse.json({
    success: true,
    message: 'GSC monitoring cron endpoint active',
    timestamp: new Date().toISOString(),
    note: 'Configure GOOGLE_SERVICE_ACCOUNT_KEY env var in Vercel for real GSC data',
  })
}
