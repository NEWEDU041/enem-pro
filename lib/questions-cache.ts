import { fetchQuestionsByYear, fetchSingleQuestion } from './enem-api'
import { createServerClient } from './supabase'
import type { Question } from './types'

const CACHE_TTL_DAYS = 365

export const DEFAULT_QUESTIONS_YEAR = 2024
export const QUESTIONS_PAGE_SIZE = 20

export interface FilteredQuestionsResult {
  questions: Question[]
  total: number
  page: number
}

// Shared by app/api/questoes/route.ts and app/questoes/page.tsx so the
// client-side paginated/filtered view and the server-rendered first page
// can never drift out of sync with each other.
export function filterAndPaginateQuestions(
  all: Question[],
  discipline: string,
  page: number,
  limit: number = QUESTIONS_PAGE_SIZE,
): FilteredQuestionsResult {
  const safePage = Math.max(1, Number.isFinite(page) ? Math.trunc(page) : 1)
  const filtered = discipline
    ? all.filter((q) => q.discipline.toLowerCase().includes(discipline.toLowerCase()))
    : all
  const start = (safePage - 1) * limit
  return { questions: filtered.slice(start, start + limit), total: filtered.length, page: safePage }
}

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
    // 3. Store — awaited so the write survives serverless function teardown
    // (a fire-and-forget promise here was routinely killed before landing,
    // leaving the cache permanently empty and every request hitting the
    // live API instead of Supabase)
    await setCachedYear(year, questions)
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
