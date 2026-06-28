import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'
import { fetchQuestionsByYear, YEARS } from '@/lib/enem-api'
import { PROMPTS } from '@/lib/ai-prompts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function generatePriorityYears() {
  const sb = createServerClient()

  // Step 1: Analyze coverage by year
  console.log('📊 Analyzing coverage...\n')
  const coverage: Array<{ year: number; api: number; cached: number; needed: number; coverage: number }> = []

  for (const year of YEARS) {
    try {
      const apiQuestions = await fetchQuestionsByYear(year)
      const { count: cachedCount } = await sb
        .from('question_explanations')
        .select('*', { count: 'exact', head: true })
        .eq('year', year)

      const cached = cachedCount || 0
      const needed = apiQuestions.length - cached
      const coveragePercent = Math.round((cached / apiQuestions.length) * 100)

      coverage.push({
        year,
        api: apiQuestions.length,
        cached,
        needed,
        coverage: coveragePercent,
      })
    } catch (e) {
      console.error(`Error checking ${year}:`, e)
    }
  }

  // Sort by coverage (lowest first) and get top 5
  const priorityYears = coverage
    .sort((a, b) => a.coverage - b.coverage)
    .slice(0, 5)

  console.log('🎯 Priority years (lowest coverage):\n')
  let totalNeeded = 0
  for (const { year, api, cached, needed, coverage: cov } of priorityYears) {
    const bar = '█'.repeat(Math.floor(cov / 5)) + '░'.repeat(20 - Math.floor(cov / 5))
    console.log(`${year} [${bar}] ${cached}/${api} | Need: ${needed}`)
    totalNeeded += needed
  }

  console.log(`\n⏱️  Estimated time: ~${Math.ceil(totalNeeded * 0.3 / 60)} minutes`)
  console.log(`💰 Tokens: ~${Math.ceil(totalNeeded * 150)} (Haiku)\n`)
  console.log('='.repeat(50))

  // Step 2: Generate for priority years only
  let totalGenerated = 0
  let totalFailed = 0

  for (const { year } of priorityYears) {
    console.log(`\n📅 Generating for ${year}...`)

    try {
      const allQuestions = await fetchQuestionsByYear(year)

      // Get existing for this year
      const { data: existing } = await sb
        .from('question_explanations')
        .select('question_id')

      const existingIds = new Set(existing?.map(e => e.question_id) || [])
      const toGenerate = allQuestions.filter(q => !existingIds.has(q.id))

      console.log(`   Total: ${allQuestions.length} | Cached: ${existingIds.size} | To generate: ${toGenerate.length}`)

      for (let i = 0; i < toGenerate.length; i++) {
        const q = toGenerate[i]

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

          // Progress indicator
          if ((i + 1) % 50 === 0) {
            console.log(`   ✅ ${i + 1}/${toGenerate.length}`)
          }
        } catch (e) {
          totalFailed++
        }

        await sleep(250) // Rate limiting
      }

      console.log(`   ✅ Complete: ${toGenerate.length} generated`)
    } catch (e) {
      console.error(`   ❌ Year failed:`, e)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Summary:')
  console.log(`   Generated: ${totalGenerated}`)
  console.log(`   Failed: ${totalFailed}`)
  console.log(`   Total: ${totalGenerated + totalFailed}`)
  console.log('='.repeat(50))
}

generatePriorityYears().catch(console.error)
