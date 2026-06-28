import { fetchQuestionsByYear, YEARS } from '@/lib/enem-api'

async function countAllQuestions() {
  let totalQuestions = 0

  console.log('📊 Counting questions by year...\n')

  for (const year of YEARS) {
    try {
      const questions = await fetchQuestionsByYear(year)
      console.log(`📅 ${year}: ${questions.length} questões`)
      totalQuestions += questions.length
    } catch (e) {
      console.error(`❌ ${year}: Error -`, e)
    }
  }

  console.log(`\n✅ Total: ${totalQuestions} questões`)
  console.log(`   Cached: 717`)
  console.log(`   Missing: ${totalQuestions - 717}`)
  console.log(`   % Complete: ${Math.round((717 / totalQuestions) * 100)}%`)
}

countAllQuestions().catch(console.error)
