import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from './supabase'
import { fetchQuestionsByYear } from './enem-api'
import { PROMPTS } from './ai-prompts'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export interface BatchResult {
  year: number
  offset: number
  generated: number
  skipped: number
  failed: number
  processed: number
  total: number
  stoppedEarly: boolean
}

export async function generateExplanationBatch(
  year: number,
  offset: number,
  limit: number,
  deadline: number = Date.now() + 270_000,
): Promise<BatchResult> {
  const sb = createServerClient()
  const all = await fetchQuestionsByYear(year)
  const questions = all.slice(offset, offset + limit)

  const { data: existing } = await sb
    .from('question_explanations')
    .select('question_id')
    .in('question_id', questions.map(q => q.id))
  const done = new Set((existing ?? []).map(e => e.question_id))

  let generated = 0
  let skipped = 0
  let failed = 0
  let processed = 0
  let stoppedEarly = false

  for (const q of questions) {
    if (Date.now() > deadline) {
      stoppedEarly = true
      break
    }
    processed++

    if (done.has(q.id)) {
      skipped++
      continue
    }

    try {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: PROMPTS.EXPLAIN_ANSWER,
        messages: [{
          role: 'user',
          content: `${q.title}

Alternativas:
${q.alternatives.map((a: any) => `${a.letter}) ${a.text}`).join('\n')}

Correta: ${q.correctAlternative}`,
        }],
      })

      const explanation = msg.content[0].type === 'text' ? msg.content[0].text : ''

      await sb.from('question_explanations').upsert({
        question_id: q.id,
        explanation,
        model: 'claude-haiku-4-5-20251001',
      }, { onConflict: 'question_id' })

      generated++
      await sleep(500)
    } catch {
      failed++
    }
  }

  return { year, offset, generated, skipped, failed, processed, total: questions.length, stoppedEarly }
}
