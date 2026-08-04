import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    message: 'GSC monitoring cron endpoint active',
    timestamp: new Date().toISOString(),
    note: 'Configure GOOGLE_SERVICE_ACCOUNT_KEY env var in Vercel for real GSC data',
  })
}
