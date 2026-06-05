import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const FREE_DAILY_LIMIT = 10

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  // Verify identity from JWT — never trust user_id from body
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const body = await request.json()
  const { question_id, selected_alternative, correct_alternative, discipline, year } = body
  const user_id = user.id  // always from JWT, never from body

  if (!question_id || !selected_alternative) {
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
    discipline: discipline || null,
    year: year || null,
  })

  return NextResponse.json({ is_correct, isPro })
}
