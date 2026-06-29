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

async function generateExplanation(question: {
  id: string
  title: string
  correctAlternative: string
  alternatives: { letter: string; text: string }[]
}): Promise<string> {
  const correctText = question.alternatives.find(a => a.letter === question.correctAlternative)?.text || ''

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: PROMPT,
    messages: [
      {
        role: 'user',
        content: `${question.title}\n\nCorreto: ${question.correctAlternative} - ${correctText}`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

async function fetchQuestionsFromAPI() {
  console.log('🔄 Buscando questões da API externa...')
  try {
    const response = await fetch('https://api.enem.dev/v1/questions?limit=3600')
    if (!response.ok) throw new Error(`API returned ${response.status}`)
    const questions = await response.json()
    console.log(`✅ Obtive ${questions.length} questões da API`)
    return questions
  } catch (e) {
    console.error('❌ API offline:', String(e))
    return []
  }
}

async function getExistingIds() {
  const { data, error } = await supabase.from('question_explanations').select('question_id')
  if (error) throw error
  return new Set(data.map(d => d.question_id))
}

async function main() {
  console.log('📚 Gerando explicações de questões faltantes...\n')

  const apiQuestions = await fetchQuestionsFromAPI()
  if (!apiQuestions.length) {
    console.log('⚠️ API offline — não há questões novas para gerar')
    return
  }

  const existingIds = await getExistingIds()
  const missing = apiQuestions.filter((q: any) => !existingIds.has(q.id))

  console.log(`📊 ${existing.size} com explicação, ${missing.length} faltando\n`)

  let saved = 0
  let skipped = 0

  for (let i = 0; i < missing.length; i++) {
    const q = missing[i]
    try {
      console.log(`[${i + 1}/${missing.length}] Gerando ${q.id}...`)

      const explanation = await generateExplanation({
        id: q.id,
        title: q.title,
        correctAlternative: q.correct,
        alternatives: q.alternatives,
      })

      const { error } = await supabase.from('question_explanations').insert({
        question_id: q.id,
        explanation,
        model: 'claude-haiku-4-5-20251001',
        discipline: q.discipline || null,
        year: q.year || null,
      })

      if (error) throw error
      saved++

      if ((i + 1) % 10 === 0) {
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
