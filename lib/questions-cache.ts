import { fetchQuestionsByYear, fetchSingleQuestion } from './enem-api'
import { createServerClient } from './supabase'
import type { Question } from './types'

const CACHE_TTL_DAYS = 7

async function getCachedYear(year: number): Promise<Question[] | null> {
  try {
    const sb = createServerClient()
    const { data } = await sb
      .from('questions_cache')
      .select('data, cached_at')
      .eq('id', `year-${year}`)
      .maybeSingle()

    if (!data?.data) return null

    const ageMs = Date.now() - new Date(data.cached_at).getTime()
    if (ageMs > CACHE_TTL_DAYS * 86400000) return null

    return data.data as Question[]
  } catch {
    return null
  }
}

async function getStaleCache(year: number): Promise<Question[] | null> {
  try {
    const sb = createServerClient()
    const { data } = await sb
      .from('questions_cache')
      .select('data')
      .eq('id', `year-${year}`)
      .maybeSingle()
    return data?.data ? (data.data as Question[]) : null
  } catch {
    return null
  }
}

async function setCachedYear(year: number, questions: Question[]): Promise<void> {
  try {
    const sb = createServerClient()
    await sb.from('questions_cache').upsert({
      id: `year-${year}`,
      year,
      discipline: null,
      data: questions,
      cached_at: new Date().toISOString(),
    })
  } catch {
    // non-fatal
  }
}

export async function fetchQuestionsByYearCached(year: number): Promise<Question[]> {
  // 1. Try fresh cache
  const cached = await getCachedYear(year)
  if (cached) return cached

  try {
    // 2. Fetch from external API
    const questions = await fetchQuestionsByYear(year)
    // 3. Store async (non-blocking)
    setCachedYear(year, questions).catch(() => {})
    return questions
  } catch (err) {
    // 4. API failed — serve stale cache rather than error
    const stale = await getStaleCache(year)
    if (stale) return stale
    throw err
  }
}

export async function fetchSingleQuestionCached(year: number, index: number): Promise<Question | null> {
  // Try to resolve from year cache (avoids N API calls)
  try {
    const cached = await getCachedYear(year)
    if (cached) return cached.find(q => q.id === `${year}-${index}`) ?? null
  } catch {}

  return fetchSingleQuestion(year, index)
}
