import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { FREE_DAILY_LIMIT } from '@/lib/utils'
import { withErrorHandling } from '@/lib/api-helpers'
import { fetchSingleQuestionCached } from '@/lib/questions-cache'
import { ResponderRequestSchema, validateRequestBody } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId: user_id } = auth
  const supabase = createServerClient()

  // INPUT VALIDATION
  const validation = await validateRequestBody(request, ResponderRequestSchema)
  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: 400 })
  }
  const { question_id, selected_alternative, is_hint_used } = validation.data

  // Resolve the answer key server-side — trusting the client's
  // correct_alternative let a forged payload fake 100% accuracy.
  const index = Number(question_id.split('-')[1])
  const year = Number(question_id.split('-')[0])
  const question = await fetchSingleQuestionCached(year, index)
  if (!question) {
    return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
  }

  // Call optimized SQL function (1 query instead of 3)
  const { data, error } = await supabase.rpc('record_answer', {
    p_user_id: user_id,
    p_question_id: question_id,
    p_selected_alternative: selected_alternative,
    p_correct_alternative: question.correctAlternative,
    p_discipline: question.discipline || null,
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
})
