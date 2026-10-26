import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { isPro, FREE_DAILY_LIMIT } from '@/lib/utils'
import { withErrorHandling } from '@/lib/api-helpers'
import { checkUserRateLimit } from '@/lib/user-rate-limit'
import { fetchQuestionsByYearCached } from '@/lib/questions-cache'
import { SimuladoSaveRequestSchema, validateRequestBody } from '@/lib/validation'
import type { Question } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  // INPUT VALIDATION
  const validation = await validateRequestBody(request, SimuladoSaveRequestSchema)
  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: 400 })
  }
  const { test_id, responses, completed_at } = validation.data

  const supabase = createServerClient()

  // USER-BASED RATE LIMITING
  const rl = await checkUserRateLimit(userId, supabase, '/api/simulado/salvar')
  if (!rl.ok) {
    return NextResponse.json(
      { 
        error: 'Limite de requisições atingido',
        tier: rl.tier,
        reset_at: rl.resetAt.toISOString(),
      },
      { status: 429, headers: rl.headers }
    )
  }

  const today = new Date().toISOString().split('T')[0]

  const [subRes, usageRes] = await Promise.all([
    supabase.from('subscriptions').select('plan, expires_at').eq('user_id', userId).maybeSingle(),
    supabase.from('daily_usage').select('count').eq('user_id', userId).eq('date', today).maybeSingle(),
  ])

  const userIsPro = isPro(subRes.data)
  const currentCount = usageRes.data?.count ?? 0

  const toSave = userIsPro
    ? responses
    : responses.slice(0, Math.max(0, FREE_DAILY_LIMIT - currentCount))

  if (toSave.length === 0) {
    return NextResponse.json({ saved: 0, total: responses.length, limitReached: true })
  }

  // Resolve the answer key server-side instead of trusting the client's
  // correct_alternative — otherwise a forged payload can claim 100% accuracy.
  const years = [...new Set(toSave.map(a => a).map(a => a.question_id.split('-')[0]).map(y => Number(y)))]
  const questionsByYear = new Map<number, Question[]>()
  await Promise.all(years.map(async (year) => {
    questionsByYear.set(year, await fetchQuestionsByYearCached(year))
  }))

  const rows = toSave.map((a) => {
    const yearStr = a.question_id.split('-')[0]
    const indexStr = a.question_id.split('-')[1]
    const correct = yearStr ? questionsByYear.get(Number(yearStr))?.find(q => q.id === a.question_id)?.correctAlternative : undefined
    return {
      user_id: userId,
      test_id,
      question_id: a.question_id,
      selected_alternative: a.selected_alternative,
      is_correct: !!correct && a.selected_alternative === correct,
      time_spent_seconds: a.time_spent_seconds,
    }
  })

  await supabase.from('user_answers').insert(rows)

  const { error: usageError } = await supabase.rpc('increment_daily_usage', {
    p_user_id: userId,
    p_date: today,
    p_n: toSave.length,
  })
  if (usageError) console.error('[simulado/salvar] usage increment failed:', usageError.message)

  return NextResponse.json({ saved: toSave.length, total: answers.length, limitReached: !userIsPro && toSave.length < answers.length })
})
