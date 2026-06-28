import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { cleanEnv, isPro, FREE_DAILY_EXPLANATIONS } from '@/lib/utils'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const supabase = createServerClient()

  const body = await request.json()
  const { question_id, question_title, correct_alternative, alternatives, discipline, year } = body

  // 1. Check explanation cache first — avoids any AI cost if already generated
  if (question_id) {
    const { data: cached } = await supabase
      .from('question_explanations')
      .select('explanation')
      .eq('question_id', question_id)
      .maybeSingle()

    if (cached?.explanation) {
      return NextResponse.json({ explanation: cached.explanation, cached: true })
    }
  }

  const { data: sub, error: subError } = await supabase.from('subscriptions').select('plan, expires_at').eq('user_id', userId).maybeSingle()

  if (subError) {
    console.error('[explicar] sub lookup error:', subError.message, 'user_id:', userId)
    return NextResponse.json({ error: 'Erro ao verificar plano' }, { status: 500 })
  }

  const userIsPro = isPro(sub)

  const rl = await checkRateLimit(userId, supabase, userIsPro)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Muitas requisições. Aguarde alguns segundos.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    )
  }

  if (!userIsPro) {
    const today = new Date().toISOString().split('T')[0]
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('explanation_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    const usedToday = usage?.explanation_count || 0
    if (usedToday >= FREE_DAILY_EXPLANATIONS) {
      return NextResponse.json({ error: 'Plano Pro necessário', freeTrialUsed: true }, { status: 403 })
    }

    await supabase.from('daily_usage').upsert(
      { user_id: userId, date: today, explanation_count: usedToday + 1 },
      { onConflict: 'user_id,date' }
    )
  }

  // 2. Cache miss — call Anthropic
  const anthropic = new Anthropic({ apiKey: cleanEnv(process.env.ANTHROPIC_API_KEY) })

  const alternativesText = alternatives
    .map((a: { letter: string; text: string }) => `${a.letter}) ${a.text}`)
    .join('\n')

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: `Explique por que a alternativa está correta. Use até 3 parágrafos. Sem markdown excessivo.`,
      messages: [
        {
          role: 'user',
          content: `${discipline} (ENEM ${year})

${question_title}

Alternativas:
${alternativesText}

Correta: ${correct_alternative}`,
        },
      ],
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[explicar] anthropic error:', msg)
    return NextResponse.json({ error: 'Erro ao gerar explicação', detail: msg }, { status: 500 })
  }

  const textBlock = message.content.find((b) => b.type === 'text') as { type: string; text: string } | undefined
  if (!textBlock?.text) {
    return NextResponse.json({ error: 'Resposta vazia da IA' }, { status: 500 })
  }

  const explanation = textBlock.text

  // 3. Save to cache for all future users (non-blocking)
  if (question_id) {
    void supabase.from('question_explanations').upsert({
      question_id,
      explanation,
      model: 'claude-haiku-4-5-20251001',
    }, { onConflict: 'question_id' })
  }

  return NextResponse.json({ explanation })
}
