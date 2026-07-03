import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { isPro, FREE_DAILY_LIMIT } from '@/lib/utils'
import { withErrorHandling } from '@/lib/api-helpers'
import { fetchQuestionsByYearCached } from '@/lib/questions-cache'
import type { Question } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface AnswerPayload {
  question_id: string
  selected_alternative: string
  discipline?: string
  year?: number
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const body = await request.json()
  const answers: AnswerPayload[] = body?.answers ?? []

  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'Nenhuma resposta enviada' }, { status: 400 })
  }
  if (answers.length > 50) {
    return NextResponse.json({ error: 'Máximo 50 respostas por chamada' }, { status: 400 })
  }

  const supabase = createServerClient()
  const today = new Date().toISOString().split('T')[0]

  const [subRes, usageRes] = await Promise.all([
    supabase.from('subscriptions').select('plan, expires_at').eq('user_id', userId).maybeSingle(),
    supabase.from('daily_usage').select('count').eq('user_id', userId).eq('date', today).maybeSingle(),
  ])

  const userIsPro = isPro(subRes.data)
  const currentCount = usageRes.data?.count ?? 0

  const toSave = userIsPro
    ? answers
    : answers.slice(0, Math.max(0, FREE_DAILY_LIMIT - currentCount))

  if (toSave.length === 0) {
    return NextResponse.json({ saved: 0, total: answers.length, limitReached: true })
  }

  // Resolve the answer key server-side instead of trusting the client's
  // correct_alternative — otherwise a forged payload can claim 100% accuracy.
  const years = [...new Set(toSave.map(a => a.year).filter((y): y is number => !!y))]
  const questionsByYear = new Map<number, Question[]>()
  await Promise.all(years.map(async (year) => {
    questionsByYear.set(year, await fetchQuestionsByYearCached(year))
  }))

  const rows = toSave.map((a) => {
    const correct = a.year ? questionsByYear.get(a.year)?.find(q => q.id === a.question_id)?.correctAlternative : undefined
    return {
      user_id: userId,
      question_id: a.question_id,
      selected_alternative: a.selected_alternative,
      is_correct: !!correct && a.selected_alternative === correct,
      discipline: a.discipline ?? null,
      year: a.year ?? null,
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
