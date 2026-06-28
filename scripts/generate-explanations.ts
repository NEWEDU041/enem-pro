import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '../lib/supabase'
import { fetchQuestionsByYear } from '../lib/enem-api'
import { YEARS } from '../lib/enem-api'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const BATCH_SIZE = 5
const DELAY_MS = 2000

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateExplanation(questionId: string, question: any): Promise<string> {
  const prompt = `Explique por que a alternativa ${question.correctAlternative} está correta para esta questão do ENEM:

Questão: ${question.title}
${question.context ? `Contexto: ${question.context.substring(0, 500)}...` : ''}

Alternativas:
${question.alternatives.map((a: any) => `${a.letter}) ${a.text}`).join('\n')}

Resposta correta: ${question.correctAlternative}

Faça uma explicação clara e concisa (máx 150 palavras) de por que essa alternativa está certa. Foque no raciocínio específico da questão.`

  const msg = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  })

  return msg.content[0].type === 'text' ? msg.content[0].text : ''
}

async function main() {
  const sb = createServerClient()
  let total = 0
  let saved = 0
  let failed = 0

  for (const year of YEARS) {
    console.log(`\n📚 ENEM ${year}...`)
    let questions = []

    try {
      questions = await fetchQuestionsByYear(year)
    } catch (e) {
      console.error(`  ❌ Erro ao buscar questões: ${e}`)
      continue
    }

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE)

      for (const q of batch) {
        try {
          const explanation = await generateExplanation(q.id, q)

          await sb.from('question_explanations').upsert({
            question_id: q.id,
            year,
            explanation,
            created_at: new Date().toISOString(),
          })

          saved++
          console.log(`  ✅ ${q.id}`)
        } catch (e) {
          failed++
          console.log(`  ❌ ${q.id}: ${e}`)
        }

        total++
      }

      await sleep(DELAY_MS)
    }
  }

  console.log(`\n✨ Pronto!`)
  console.log(`Total: ${total} | Salvas: ${saved} | Falhas: ${failed}`)
}

main().catch(console.error)
