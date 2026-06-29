import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  const supabase = createServerClient()
  const { error } = await supabase.rpc('refresh_stats_snapshot')

  if (error) {
    console.error('[refresh-stats]', error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, refreshed_at: new Date().toISOString() })
}
