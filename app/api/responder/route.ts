import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const FREE_DAILY_LIMIT = 10

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const body = await request.json()
  const { user_id, question_id, selected_alternative, correct_alternative } = body

  if (!user_id || !question_id || !selected_alternative) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]

  // Check subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, expires_at')
    .eq('user_id', user_id)
    .single()

  const isPro =
    sub?.plan === 'pro' &&
    sub?.expires_at &&
    new Date(sub.expires_at) > new Date()

  // Check daily limit for free users
  if (!isPro) {
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('count')
      .eq('user_id', user_id)
      .eq('date', today)
      .single()

    const currentCount = usage?.count || 0

    if (currentCount >= FREE_DAILY_LIMIT) {
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
  })

  return NextResponse.json({ is_correct, isPro })
}
