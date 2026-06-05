import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function cleanEnv(val: string | undefined): string {
  return (val || '').replace(new RegExp(String.fromCharCode(65279), 'g'), '').replace(/[\r\n]/g, '')
}

export async function POST(request: NextRequest) {
  const anthropic = new Anthropic({ apiKey: cleanEnv(process.env.ANTHROPIC_API_KEY) })
  const supabase = createServerClient()

  // Verify identity from JWT — never trust user_id from body
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  const body = await request.json()
  const { question_title, correct_alternative, alternatives, discipline, year } = body

  // Verify plan
  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .select('plan, expires_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (subError) {
    console.error('[explicar] sub lookup error:', subError.message, 'user_id:', user.id)
    return NextResponse.json({ error: 'Erro ao verificar plano' }, { status: 500 })
  }

  const isPro =
    sub?.plan === 'pro' &&
    sub?.expires_at &&
    new Date(sub.expires_at) > new Date()

  const FREE_DAILY_EXPLANATIONS = 1

  if (!isPro) {
    const today = new Date().toISOString().split('T')[0]
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('explanation_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()

    const usedToday = usage?.explanation_count || 0
    if (usedToday >= FREE_DAILY_EXPLANATIONS) {
      return NextResponse.json({ error: 'Plano Pro necessário', freeTrialUsed: true }, { status: 403 })
    }

    // Increment free explanation counter
    await supabase.from('daily_usage').upsert(
      { user_id: user.id, date: today, explanation_count: usedToday + 1 },
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