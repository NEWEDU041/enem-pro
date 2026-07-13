import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { cleanEnv } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// Temporary diagnostic — remove after confirming questions_cache writes work.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const secret = cleanEnv(process.env.CRON_SECRET)
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const { data, error, status, statusText } = await supabase
    .from('questions_cache')
    .upsert({
      id: 'debug-test-row',
      year: 1999,
      discipline: null,
      data: [{ id: 'debug', ok: true }],
      cached_at: new Date().toISOString(),
    })
    .select()

  return NextResponse.json({ data, error, status, statusText })
}
