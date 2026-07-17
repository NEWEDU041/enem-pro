import { loadEnv } from './load-env'
loadEnv()

import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '../lib/supabase'
import { PROMPTS } from '../lib/ai-prompts'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface QuestionWithExplanation {
  id: string
  title: string
  alternatives: { letter: string; text: string }[]
  correctAlternative: string
  explanation?: string
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function fetchQuestionsNeedingRegen(): Promise<QuestionWithExplanation[]> {
  const sb = createServerClient()

  // Fetch questions with explanations that are too short
  const { data, error } = await sb
    .from('question_explanations')
    .select('question_id, explanation')
    .lt('length(explanation)', 350)

  if (error) throw error

  const questionIds = (data ?? []).map(e => e.question_id)
  if (questionIds.length === 0) {
    console.log('✅ Todas as explicações já têm qualidade premium!')
    return []
  }

  console.log(`📊 Encontradas ${questionIds.length} explicações para regenerar\n`)

  // Fetch full question data from enem-cache (or wherever questions are stored)
  const { data: questions, error: qError } = await sb
    .from('enem_cache')
    .select('*')
    .in('id', questionIds)

  if (qError) throw qError

  return (questions ?? []).map((q: any) => ({
    id: q.id,
    title: q.title,
    alternatives: q.alternatives || [],
    correctAlternative: q.correct_alternative || q.correctAlternative,
  }))
}

async function regenerateExplanation(question: QuestionWithExplanation): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: PROMPTS.EXPLAIN_ANSWER_PREMIUM,
    messages: [{
      role: 'user',
      content: `${question.title}

Alternativas:
${question.alternatives.map((a: any) => `${a.letter || a.letter_option || 'A'}) ${a.text}`).join('\n')}

Correta: ${question.correctAlternative}`,
    }],
  })

  const explanation = msg.content[0].type === 'text' ? msg.content[0].text : ''

  // Validate quality
  const charCount = explanation.length
  const wordCount = explanation.split(/\s+/).length

  if (charCount < 350 || wordCount < 60) {
    console.warn(`⚠️  Explicação curta para ${question.id}: ${charCount} chars, ${wordCount} palavras`)
  }

  return explanation
}

async function regenerateBatch(questions: QuestionWithExplanation[], batchNumber: number, totalBatches: number) {
  const sb = createServerClient()
  let success = 0
  let failed = 0

  console.log(`\n📦 BATCH ${batchNumber}/${totalBatches} (${questions.length} questões)`)

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]

    try {
      const explanation = await regenerateExplanation(q)

      await sb.from('question_explanations').upsert({
        question_id: q.id,
        explanation,
        model: 'claude-haiku-4-5-20251001',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'question_id' })

      success++
      const charCount = explanation.length
      process.stdout.write(`\r  ✅ ${success}/${questions.length} | ${q.id}: ${charCount} chars`)

      // Rate limiting: 3 req/sec
      await sleep(333)
    } catch (error) {
      failed++
      console.error(`\n  ❌ ${q.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      await sleep(1000) // Longer pause on error
    }
  }

  console.log(`\n  ✨ Batch ${batchNumber}: ${success} sucessos, ${failed} falhas`)
  return { success, failed }
}

async function main() {
  try {
    console.log('🚀 GERADOR DE EXPLICAÇÕES PREMIUM - ENEM Pro\n')
    console.log('='.repeat(60))

    const questions = await fetchQuestionsNeedingRegen()

    if (questions.length === 0) {
      return
    }

    const BATCH_SIZE = 50
    const totalBatches = Math.ceil(questions.length / BATCH_SIZE)

    let totalSuccess = 0
    let totalFailed = 0
    const startTime = Date.now()

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1

      const { success, failed } = await regenerateBatch(batch, batchNum, totalBatches)
      totalSuccess += success
      totalFailed += failed
    }

    const elapsedSeconds = (Date.now() - startTime) / 1000
    const elapsedMinutes = Math.round(elapsedSeconds / 60)

    console.log('\n' + '='.repeat(60))
    console.log('\n🎉 GERAÇÃO CONCLUÍDA!')
    console.log(`\n📊 Resumo Final:`)
    console.log(`   ✅ Regeneradas com sucesso: ${totalSuccess}`)
    console.log(`   ❌ Falhas: ${totalFailed}`)
    console.log(`   ⏱️  Tempo total: ${elapsedMinutes} minutos`)
    console.log(`   💰 Custo estimado: ~$${(totalSuccess * 0.00000045).toFixed(3)} (Haiku)`)

    // Final verification
    const sb = createServerClient()
    const { data } = await sb
      .from('question_explanations')
      .select('*', { count: 'exact' })

    const finalCount = data?.length || 0
    const qualityCount = (data ?? []).filter(e => (e.explanation ?? '').length >= 350).length

    console.log(`\n✅ Status Final do Banco:`)
    console.log(`   Total: ${finalCount}/2712`)
    console.log(`   Com qualidade premium (≥350 chars): ${qualityCount}`)
    console.log(`   Coverage: ${Math.round((finalCount / 2712) * 100)}%`)

  } catch (error) {
    console.error('❌ Erro fatal:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
