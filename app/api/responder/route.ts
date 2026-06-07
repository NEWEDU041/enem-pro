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

  const today = new Date().toISOString().split('T')[0]

  const { data: sub } = await supabase.from('subscriptions').select('plan, expires_at').eq('user_id', user_id).single()
  const userIsPro = isPro(sub)

  if (!userIsPro) {
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('count')
      .eq('user_id', user_id)
      .eq('date', today)
      .maybeSingle()

    const currentCount = usage?.count || 0

    if (currentCount >= FREE_DAILY_LIMIT) { // eslint-disable-line
      return NextResponse.json(
        { error: 'Limite diário atingido', limitReached: true },
        { status: 403 }
      )
    }

    // Upsert daily usage
    await supabase.from('daily_usage').upsert(
      { user_id, date: today, count: currentCount + 1 },
      { onConflict: 'user_id,date' }
    )
  }

  const is_correct = selected_alternative === correct_alternative

  // Save answer
  await supabase.from('user_answers').insert({
    user_id,
    question_id,
    selected_alternative,
    is_correct,
    discipline: discipline || null,
    year: year || null,
  })

  return NextResponse.json({ is_correct, isPro: userIsPro })
}
