import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()

  // Serve pre-generated explanation from cache only
  const { data, error } = await supabase
    .from('question_explanations')
    .select('explanation, model, created_at')
    .eq('question_id', id)
    .maybeSingle()

  if (error) {
    console.error('[questao/explicacao] DB error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!data?.explanation) {
    // Not cached: the cron may generate the explanation any time after this,
    // and a stale 404 shouldn't outlive that (previously cached 24h via
    // force-static + revalidate, which applied even to the not-found case).
    return NextResponse.json(
      { error: 'Explicação não disponível', status: 'not_generated' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  return NextResponse.json({
    explanation: data.explanation,
    model: data.model,
    generated_at: data.created_at,
  }, {
    headers: {
      'Cache-Control': 'public, max-age=86400', // Cache client-side for 24h
    },
  })
}
