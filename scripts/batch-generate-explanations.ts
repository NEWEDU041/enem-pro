import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

async function generateExplanations() {
  console.log('🔍 Buscando questões sem explicação...')

  // Fetch questions without explanations
  const { data: questions, error } = await supabase
    .from('questions_cache')
    .select('id, year, index, data')
    .is('explanation', null)
    .limit(100)

  if (error) {
    console.error('❌ Erro:', error)
    return
  }

  console.log(`📚 ${questions?.length || 0} questões encontradas`)

  if (!questions || questions.length === 0) {
    console.log('✅ Todas as questões têm explicação!')
    return
  }

  for (const q of questions) {
    const qData = q.data as any
    if (!qData || !qData.statement) continue

    try {
      console.log(`⏳ ${qData.year} - Questão ${q.index}...`)

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Explique esta questão do ENEM em 300-400 palavras:

**Enunciado:** ${qData.statement}

**Alternativas:**
${qData.alternatives?.map((a: string, i: number) => `${String.fromCharCode(65 + i)}) ${a}`).join('\n')}

**Resposta correta:** ${qData.answer}

Explique por quê a resposta está correta e por que as outras estão erradas.`
          }
        ]
      })

      const explanation = response.content[0].type === 'text' ? response.content[0].text : ''

      // Salvar no Supabase
      await supabase
        .from('questions_cache')
        .update({ explanation, updated_at: new Date().toISOString() })
        .eq('id', q.id)

      console.log(`✅ Salva`)
    } catch (err) {
      console.error(`❌ Erro:`, err)
    }
  }

  console.log('\n✨ Lote completo!')
}

generateExplanations().catch(console.error)
