import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const supabase = createServerClient()
  const body = await request.json()
  const { user_id, question_title, correct_alternative, alternatives, discipline, year } = body

  if (!user_id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Verify Pro plan
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, expires_at')
    .eq('user_id', user_id)
    .single()

  const isPro =
    sub?.plan === 'pro' &&
    sub?.expires_at &&
    new Date(sub.expires_at) > new Date()

  if (!isPro) {
    return NextResponse.json({ error: 'Plano Pro necessário' }, { status: 403 })
  }

  const alternativesText = alternatives
    .map((a: { letter: string; text: string }) => `${a.letter}) ${a.text}`)
    .join('\n')

  const message = await anthropic.messages.create({
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

  const explanation = (message.content[0] as { type: string; text: string }).text

  return NextResponse.json({ explanation })
}
