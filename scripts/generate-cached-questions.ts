import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './load-env'

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

const PROMPT = `Explique por que a alternativa está correta. Use até 3 parágrafos. Sem markdown excessivo.`

async function generateExplanation(question: any): Promise<string> {
  const correctText = question.alternatives?.find((a: any) => a.letter === question.correct)?.text || ''

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: PROMPT,
    messages: [
      {
        role: 'user',
        content: `${question.title}\n\nCorreto: ${question.correct} - ${correctText}`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

async function main() {
  console.log('📚 Gerando explicações para questões em cache...\n')

  // Fetch cached questions
  const { data: cached, error: fetchError } = await supabase
    .from('questions_cache')
    .select('*')

  if (fetchError) throw fetchError
  if (!cached?.length) {
    console.log('⚠️ Nenhuma questão em cache')
    return
  }

  console.log(`📊 ${cached.length} questões em cache\n`)

  let saved = 0
  let skipped = 0

  for (let i = 0; i < cached.length; i++) {
    const q = cached[i]
    try {
      console.log(`[${i + 1}/${cached.length}] Gerando ${q.id}...`)

      // Parse data if stored as JSON string
      const data = typeof q.data === 'string' ? JSON.parse(q.data) : q.data

      const explanation = await generateExplanation({
        title: data.title,
        correct: data.correct,
        alternatives: data.alternatives,
      })

      const { error: insertError } = await supabase.from('question_explanations').insert({
        question_id: q.id,
        explanation,
        model: 'claude-haiku-4-5-20251001',
        discipline: data.discipline || null,
        year: data.year || null,
      })

      if (insertError) throw insertError
      saved++

      if ((i + 1) % 5 === 0) {
        console.log(`✅ ${saved} salvas até agora...\n`)
      }
    } catch (e) {
      console.error(`❌ Erro em ${q.id}:`, String(e))
      skipped++
    }
  }

  console.log(`\n✅ Feito! ${saved} salvas, ${skipped} erros`)
}

main().catch(console.error)
