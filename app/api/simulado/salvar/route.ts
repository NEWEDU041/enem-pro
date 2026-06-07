import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { isPro, FREE_DAILY_LIMIT } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface AnswerPayload {
  question_id: string
  selected_alternative: string
  correct_alternative: string
  discipline?: string
  year?: number
}

export async function POST(request: NextRequest) {
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

  const rows = toSave.map((a) => ({
    user_id: userId,
    question_id: a.question_id,
    selected_alternative: a.selected_alternative,
    is_correct: a.selected_alternative === a.correct_alternative,
    discipline: a.discipline ?? null,
    year: a.year ?? null,
  }))

  await supabase.from('user_answers').insert(rows)

  await supabase.from('daily_usage').upsert(
    { user_id: userId, date: today, count: currentCount + toSave.length },
    { onConflict: 'user_id,date' }
  )

  return NextResponse.json({ saved: toSave.length, total: answers.length, limitReached: !userIsPro && toSave.length < answers.length })
}
