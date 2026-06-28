import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-static'
export const revalidate = 86400 // Cache for 24h

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()

  // Serve pre-generated explanation from cache only
  const { data, error } = await supabase
    .from('question_explanations')
    .select('explanation, model, created_at')
    .eq('question_id', params.id)
    .maybeSingle()

  if (error) {
    console.error('[questao/explicacao] DB error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!data?.explanation) {
    return NextResponse.json(
      { error: 'Explicação não disponível', status: 'not_generated' },
      { status: 404 }
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
