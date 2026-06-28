import { createServerClient } from '@/lib/supabase'
import { fetchQuestionsByYear, YEARS } from '@/lib/enem-api'

async function checkCoverage() {
  const sb = createServerClient()
  let totalApiQuestions = 0
  let totalWithExplanations = 0
  const coverageByYear: Record<number, { api: number; cached: number; coverage: number }> = {}

  console.log('🔍 Analyzing question coverage...\n')

  for (const year of YEARS) {
    try {
      // Count from API
      const apiQuestions = await fetchQuestionsByYear(year)
      const apiCount = apiQuestions.length

      // Count cached
      const { count: cachedCount } = await sb
        .from('question_explanations')
        .select('*', { count: 'exact', head: true })
        .eq('year', year)

      const cached = cachedCount || 0
      const coverage = Math.round((cached / apiCount) * 100)

      coverageByYear[year] = { api: apiCount, cached, coverage }
      totalApiQuestions += apiCount
      totalWithExplanations += cached

      const bar = '█'.repeat(Math.floor(coverage / 5)) + '░'.repeat(20 - Math.floor(coverage / 5))
      console.log(`${year} [${bar}] ${cached}/${apiCount} (${coverage}%)`)
    } catch (e) {
      console.error(`❌ ${year}: Error -`, e)
    }
  }

  console.log('\n' + '='.repeat(50))
  const totalCoverage = Math.round((totalWithExplanations / totalApiQuestions) * 100)
  console.log(`📊 TOTAL: ${totalWithExplanations}/${totalApiQuestions} (${totalCoverage}%)`)
  console.log(`   Missing: ${totalApiQuestions - totalWithExplanations} questões`)
  console.log('='.repeat(50))

  // Show years with lowest coverage (priority)
  console.log('\n🎯 Priority (lowest coverage):')
  const sorted = Object.entries(coverageByYear)
    .sort((a, b) => a[1].coverage - b[1].coverage)
    .slice(0, 5)

  for (const [year, data] of sorted) {
    console.log(`   ${year}: ${data.cached}/${data.api} (${data.coverage}%) — Need: ${data.api - data.cached}`)
  }
}

checkCoverage().catch(console.error)
