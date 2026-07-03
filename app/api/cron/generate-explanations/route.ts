import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { fetchQuestionsByYear } from '@/lib/enem-api'
import { YEARS } from '@/lib/enem-api'
import Anthropic from '@anthropic-ai/sdk'
import { PROMPTS } from '@/lib/ai-prompts'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const year = parseInt(req.nextUrl.searchParams.get('year') || '2023')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

  if (!YEARS.includes(year)) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  }

  const sb = createServerClient()
  let questions: any[] = []
  let generated = 0
  let failed = 0
  let stoppedEarly = false

  try {
    questions = await fetchQuestionsByYear(year)
    questions = questions.slice(offset, offset + limit)
  } catch (e) {
    return NextResponse.json({ error: `Fetch failed: ${e}` }, { status: 500 })
  }

  // maxDuration is 300s; bail out with a resumable cursor before Vercel
  // kills the function mid-batch instead of losing track of where it stopped.
  const deadline = Date.now() + 270_000
  let processed = 0

  for (const q of questions) {
    if (Date.now() > deadline) {
      stoppedEarly = true
      break
    }
    processed++
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
    } catch (e) {
      failed++
    }

    await sleep(500)
  }

  return NextResponse.json({
    year,
    offset,
    generated,
    failed,
    processed,
    total: questions.length,
    stoppedEarly,
    next: stoppedEarly
      ? `Retomar: year=${year}&limit=${limit}&offset=${offset + processed}`
      : `Próximas: year=${year}&limit=${limit}&offset=${offset + limit}`,
  })
}
