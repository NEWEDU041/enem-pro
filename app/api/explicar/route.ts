import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { cleanEnv, isPro, FREE_DAILY_EXPLANATIONS } from '@/lib/utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { PROMPTS } from '@/lib/ai-prompts'
import { fetchSingleQuestionCached } from '@/lib/questions-cache'

export const dynamic = 'force-dynamic'

const QUESTION_ID_RE = /^\d{4}-\d+$/

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const supabase = createServerClient()

  const body = await request.json()
  const { question_id, selected_alternative } = body

  if (question_id && !QUESTION_ID_RE.test(question_id)) {
    return NextResponse.json({ error: 'question_id inválido' }, { status: 400 })
  }

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

  // 2. Cache miss — return empty + log for batch generation
  // All explanations should be pre-generated via bulk script
  // This is a safety fallback only
  console.log('[explicar] Cache miss for question:', question_id)

  // Optional: generate on-demand as fallback for Pro users only
  if (userIsPro && question_id) {
    try {
      const [yearStr, indexStr] = question_id.split('-')
      const question = await fetchSingleQuestionCached(Number(yearStr), Number(indexStr))
      if (!question) {
        return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
      }

      const anthropic = new Anthropic({ apiKey: cleanEnv(process.env.ANTHROPIC_API_KEY) })

      const alternativesText = question.alternatives
        .map(a => `${a.letter}) ${a.text}`)
        .join('\n')

      const wrong = !!selected_alternative && selected_alternative !== question.correctAlternative
      const selectedText = wrong
        ? question.alternatives.find(a => a.letter === selected_alternative)?.text
        : null

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: wrong ? PROMPTS.EXPLAIN_WRONG : PROMPTS.EXPLAIN_ANSWER,
        messages: [
          {
            role: 'user',
            content: `${question.discipline} (ENEM ${question.year})\n\n${question.title}\n\nAlternativas:\n${alternativesText}\n\nCorreta: ${question.correctAlternative}${wrong && selectedText ? `\nAluno escolheu: ${selected_alternative}) ${selectedText}` : ''}`,
          },
        ],
      })

      const explanation = message.content[0].type === 'text' ? message.content[0].text : ''

      // Cache the generated explanation. `void` alone never triggers the
      // PostgrestBuilder's lazy thenable — it must be awaited or `.then()`'d.
      supabase.from('question_explanations').upsert({
        question_id,
        explanation,
        model: 'claude-haiku-4-5-20251001',
      }, { onConflict: 'question_id' }).then(({ error }) => {
        if (error) console.error('[explicar] cache upsert failed:', error.message)
      })

      return NextResponse.json({ explanation, fallback: true })
    } catch (e) {
      console.error('[explicar] Fallback generation error:', e)
    }
  }

  return NextResponse.json(
    { error: 'Explicação não disponível. Use o script de geração em batch.' },
    { status: 202 } // 202 = Accepted but not yet generated
  )
}
