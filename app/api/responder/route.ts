import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { FREE_DAILY_LIMIT, isPro } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId: user_id } = auth
  const supabase = createServerClient()

  const body = await request.json()
  const { question_id, selected_alternative, correct_alternative, discipline, year } = body

  if (!question_id || !selected_alternative) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  // Call optimized SQL function (1 query instead of 3)
  const { data, error } = await supabase.rpc('record_answer', {
    p_user_id: user_id,
    p_question_id: question_id,
    p_selected_alternative: selected_alternative,
    p_correct_alternative: correct_alternative,
    p_discipline: discipline || null,
    p_year: year || null,
    p_free_daily_limit: FREE_DAILY_LIMIT,
  })

  if (error) {
    console.error('[responder] SQL error:', error)
    return NextResponse.json({ error: 'Erro ao registrar resposta' }, { status: 500 })
  }

  if (data?.error) {
    return NextResponse.json(
      { error: data.error, limitReached: data.limit_reached },
      { status: 403 }
    )
  }

  return NextResponse.json({
    is_correct: data?.is_correct,
    isPro: data?.is_pro,
  })
}
