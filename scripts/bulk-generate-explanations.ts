import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'
import { fetchQuestionsByYear } from '@/lib/enem-api'
import { YEARS } from '@/lib/enem-api'
import { PROMPTS } from '@/lib/ai-prompts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function bulkGenerateAllYears() {
  const sb = createServerClient()
  let totalGenerated = 0
  let totalFailed = 0

  console.log('🚀 Starting bulk generation for all ENEM years...\n')

  for (const year of YEARS) {
    console.log(`📅 Processing year: ${year}`)

    try {
      const allQuestions = await fetchQuestionsByYear(year)

      // Check which ones already have explanations
      const { data: existing } = await sb
        .from('question_explanations')
        .select('question_id')
        .eq('year', year)

      const existingIds = new Set(existing?.map(e => e.question_id) || [])
      const toGenerate = allQuestions.filter(q => !existingIds.has(q.id))

      console.log(`   Total: ${allQuestions.length} | Already cached: ${existingIds.size} | To generate: ${toGenerate.length}`)

      for (const q of toGenerate) {
        try {
          const msg = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 200,
            system: PROMPTS.EXPLAIN_ANSWER,
            messages: [{
              role: 'user',
              content: `${q.title}\n\nAlternativas:\n${q.alternatives.map((a: any) => `${a.letter}) ${a.text}`).join('\n')}\n\nCorreta: ${q.correctAlternative}`,
            }],
          })

          const explanation = msg.content[0].type === 'text' ? msg.content[0].text : ''

          await sb.from('question_explanations').upsert({
            question_id: q.id,
            explanation,
            model: 'claude-haiku-4-5-20251001',
          }, { onConflict: 'question_id' })

          totalGenerated++

          if (totalGenerated % 50 === 0) {
            console.log(`   ✅ Generated ${totalGenerated}`)
          }
        } catch (e) {
          totalFailed++
          console.error(`   ❌ Failed for question ${q.id}:`, e)
        }

        await sleep(300) // Rate limiting
      }
    } catch (e) {
      console.error(`   ❌ Year ${year} failed:`, e)
    }

    console.log('')
  }

  console.log('\n📊 Summary:')
  console.log(`   Generated: ${totalGenerated}`)
  console.log(`   Failed: ${totalFailed}`)
  console.log(`   Total: ${totalGenerated + totalFailed}`)
}

bulkGenerateAllYears().catch(console.error)
