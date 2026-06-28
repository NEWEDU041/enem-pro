import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { FREE_DAILY_LIMIT, isPro } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface BatchAnswer {
  question_id: string
  selected_alternative: string
  correct_alternative: string
  discipline?: string
  year?: number
}

interface BatchResult {
  question_id: string
  is_correct: boolean
  error?: string
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId: user_id } = auth

  const supabase = createServerClient()
  const body = await request.json()
  const { answers } = body as { answers: BatchAnswer[] }

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'Invalid answers array' }, { status: 400 })
  }

  if (answers.length > 100) {
    return NextResponse.json({ error: 'Max 100 answers per request' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]

  // Get user subscription once (not per answer)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, expires_at')
    .eq('user_id', user_id)
    .maybeSingle()

  const userIsPro = isPro(sub)

  // Check daily limit (only for non-pro)
  let currentCount = 0
  if (!userIsPro) {
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('count')
      .eq('user_id', user_id)
      .eq('date', today)
      .maybeSingle()

    currentCount = usage?.count || 0

    if (currentCount + answers.length > FREE_DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: 'Limite diário atingido',
          limitReached: true,
          remaining: Math.max(0, FREE_DAILY_LIMIT - currentCount),
        },
        { status: 403 }
      )
    }
  }

  // Process all answers in parallel
  const results: BatchResult[] = []
  const answersToInsert: any[] = []

  for (const answer of answers) {
    const is_correct = answer.selected_alternative === answer.correct_alternative

    results.push({
      question_id: answer.question_id,
      is_correct,
    })

    answersToInsert.push({
      user_id,
      question_id: answer.question_id,
      selected_alternative: answer.selected_alternative,
      is_correct,
      discipline: answer.discipline || null,
      year: answer.year || null,
    })
  }

  // Insert all answers in one batch
  const { error: insertError } = await supabase
    .from('user_answers')
    .insert(answersToInsert)

  if (insertError) {
    console.error('[responder/batch] Insert error:', insertError)
    return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 })
  }

  // Update daily usage (non-pro users)
  if (!userIsPro) {
    await supabase.from('daily_usage').upsert(
      { user_id, date: today, count: currentCount + answers.length },
      { onConflict: 'user_id,date' }
    )
  }

  // Calculate stats
  const correctCount = results.filter(r => r.is_correct).length
  const accuracy = Math.round((correctCount / results.length) * 100)

  return NextResponse.json({
    success: true,
    results,
    stats: {
      total: results.length,
      correct: correctCount,
      accuracy: `${accuracy}%`,
    },
    isPro: userIsPro,
  })
}
