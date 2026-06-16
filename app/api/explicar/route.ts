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

  const anthropic = new Anthropic({ apiKey: cleanEnv(process.env.ANTHROPIC_API_KEY) })
  const supabase = createServerClient()

  const body = await request.json()
  const { question_title, correct_alternative, alternatives, discipline, year } = body

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

    // Increment free explanation counter
    await supabase.from('daily_usage').upsert(
      { user_id: userId, date: today, explanation_count: usedToday + 1 },
      { onConflict: 'user_id,date' }
    )
  }

  const alternativesText = alternatives
    .map((a: { letter: string; text: string }) => `${a.letter}) ${a.text}`)
    .join('\n')

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: `Você é um professor especialista no ENEM. Explique de forma clara, didática e objetiva por que a alternativa correta é a correta. Use no máximo 3 parágrafos. Não use markdown excessivo. Fale diretamente para o estudante.`,
      messages: [
        {
          role: 'user',
          content: `ENEM ${year} — ${discipline}

Questão: ${question_title}

Alternativas:
${alternativesText}

Alternativa correta: ${correct_alternative}

Explique por que a alternativa ${correct_alternative} é a correta e por que as outras estão erradas.`,
        },
      ],
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[explicar] anthropic error:', msg)
    return NextResponse.json({ error: 'Erro ao gerar explicação', detail: msg }, { status: 500 })
  }

  const explanation = (message.content[0] as { type: string; text: string }).text

  return NextResponse.json({ explanation })
}