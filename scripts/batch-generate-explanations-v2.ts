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
  console.log('🔍 Buscando anos sem explicação...')

  // Fetch all years from questions_cache
  const { data: years, error } = await supabase
    .from('questions_cache')
    .select('id, year, data')

  if (error) {
    console.error('❌ Erro:', error)
    return
  }

  console.log(`📚 ${years?.length || 0} anos encontrados`)

  if (!years || years.length === 0) {
    console.log('✅ Nenhum ano com questões!')
    return
  }

  let totalProcessed = 0
  let totalGenerated = 0

  for (const yearRecord of years) {
    const questions = yearRecord.data as any[]
    if (!Array.isArray(questions)) {
      console.log(`⏭️  ${yearRecord.year}: data não é array, pulando`)
      continue
    }

    console.log(`\n📅 ${yearRecord.year}: ${questions.length} questões`)

    for (const q of questions) {
      totalProcessed++

      if (!q.title && !q.enunciado) {
        console.log(`  ⏭️  #${totalProcessed}: sem enunciado`)
        continue
      }

      const qId = `${yearRecord.year}-${q.index || totalProcessed}`
      const statement = q.title || q.enunciado || ''
      const alternatives = q.alternatives || []
      const correctAlt = q.correctAlternative || q.gabarito || ''

      try {
        process.stdout.write(`  ⏳ #${totalProcessed}: ${qId}... `)

        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `Explique esta questão do ENEM em 300-400 palavras:

**Enunciado:** ${statement}

**Alternativas:**
${alternatives.map((a: any, i: number) =>
  `${String.fromCharCode(65 + i)}) ${a.text || a.texto || ''}`
).join('\n')}

**Resposta correta:** ${correctAlt}

Explique por quê a resposta está correta e por que as outras estão erradas.`
            }
          ]
        })

        const explanation = response.content[0].type === 'text' ? response.content[0].text : ''

        // Upsert na tabela question_explanations
        const { error: upsertError } = await supabase
          .from('question_explanations')
          .upsert({
            question_id: qId,
            explanation,
            model: 'claude-3-5-sonnet-20241022'
          })

        if (upsertError) {
          console.log(`❌ ${upsertError.message}`)
        } else {
          console.log(`✅`)
          totalGenerated++
        }
      } catch (err) {
        console.log(` ❌ ${err}`)
      }
    }
  }

  console.log(`\n✨ Completo! ${totalGenerated}/${totalProcessed} gerações bem-sucedidas`)
}

generateExplanations().catch(console.error)
