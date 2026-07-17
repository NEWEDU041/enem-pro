import * as fs from 'fs'
import * as path from 'path'
import { Question } from './types'
import { DISCIPLINES, YEARS, SLUG_TO_DISCIPLINE, disciplineToSlug } from './enem-constants'

export { DISCIPLINES, YEARS, SLUG_TO_DISCIPLINE, disciplineToSlug }

const BASE_URL = 'https://api.enem.dev/v1'

// api.enem.dev has no 2024 data yet — served from a local dataset instead
// (adapted from huggingface.co/datasets/maritaca-ai/enem, Apache 2.0).
const LOCAL_DATASET_YEARS: Record<number, string> = {
  2024: 'enem-2024.json',
}

let localDatasetCache: Record<number, Question[]> = {}

function loadLocalDataset(year: number): Question[] | null {
  const filename = LOCAL_DATASET_YEARS[year]
  if (!filename) return null
  if (localDatasetCache[year]) return localDatasetCache[year]
  const filePath = path.join(process.cwd(), 'data', filename)
  const questions: Question[] = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  localDatasetCache[year] = questions
  return questions
}

const DISCIPLINE_MAP: Record<string, string> = {
  'linguagens': 'Linguagens, Códigos e suas Tecnologias',
  'ciencias-humanas': 'Ciências Humanas e suas Tecnologias',
  'ciencias-natureza': 'Ciências da Natureza e suas Tecnologias',
  'matematica': 'Matemática',
  'ciências humanas e suas tecnologias': 'Ciências Humanas e suas Tecnologias',
  'ciências da natureza e suas tecnologias': 'Ciências da Natureza e suas Tecnologias',
  'linguagens, códigos e suas tecnologias': 'Linguagens, Códigos e suas Tecnologias',
  'matemática': 'Matemática',
  'matemática e suas tecnologias': 'Matemática',
}

function normalizeDiscipline(raw: string | undefined): string {
  if (!raw) return 'Geral'
  const lower = raw.toLowerCase().trim()
  return DISCIPLINE_MAP[lower] || raw
}

interface RawAlternative {
  letter?: string
  letra?: string
  text?: string
  texto?: string
  file?: string | null
  isCorrect?: boolean
}

interface RawQuestion {
  index?: number
  discipline?: string
  disciplina?: string
  title?: string
  enunciado?: string
  context?: string
  contexto?: string
  alternativesIntroduction?: string
  alternatives?: RawAlternative[]
  alternativas?: RawAlternative[]
  correctAlternative?: string
  gabarito?: string
}

// API caps limit at 50/page (previously 200); a year has ~180 questions, so
// this must paginate or every request 400s.
const PAGE_LIMIT = 50
const MAX_PAGES = 20 // safety cap against a runaway loop if hasMore is ever wrong

function mapQuestion(q: RawQuestion, year: number, fallbackIndex: number): Question {
  const alternatives = (q.alternatives || q.alternativas || []).map((a) => ({
    letter: a.letter || a.letra || '',
    text: a.text || a.texto || '',
    file: a.file || null,
    isCorrect: a.isCorrect || false,
  }))

  // Fallback: se não tem correctAlternative explícito, procura na alternativa marcada como correta
  let correctAlternative = q.correctAlternative || q.gabarito || ''
  if (!correctAlternative && alternatives.length > 0) {
    const correctAlt = alternatives.find(a => a.isCorrect)
    correctAlternative = correctAlt?.letter || ''
  }

  const index = q.index ?? fallbackIndex

  return {
    id: `${year}-${index}`,
    year,
    discipline: normalizeDiscipline(q.discipline || q.disciplina),
    title: q.title || q.enunciado || '',
    context: q.context || q.contexto || '',
    alternativesIntroduction: q.alternativesIntroduction || '',
    alternatives,
    correctAlternative,
  }
}

export async function fetchQuestionsByYear(year: number): Promise<Question[]> {
  const local = loadLocalDataset(year)
  if (local) return local

  const all: Question[] = []

  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_LIMIT
    const res = await fetch(`${BASE_URL}/exams/${year}/questions?limit=${PAGE_LIMIT}&offset=${offset}`)
    if (!res.ok) throw new Error(`Erro ao buscar questões de ${year}`)
    const data = await res.json()
    const rawQuestions: RawQuestion[] = data.questions || (Array.isArray(data) ? data : [])

    rawQuestions.forEach((q, i) => all.push(mapQuestion(q, year, offset + i + 1)))

    const hasMore = data.metadata?.hasMore ?? rawQuestions.length === PAGE_LIMIT
    if (!hasMore || rawQuestions.length === 0) break
  }

  return all
}

export async function fetchSingleQuestion(year: number, index: number): Promise<Question | null> {
  const local = loadLocalDataset(year)
  if (local) return local.find(q => q.id === `${year}-${index}`) ?? null

  try {
    const res = await fetch(`${BASE_URL}/exams/${year}/questions/${index}`)
    if (!res.ok) return null
    const q: RawQuestion = await res.json()

    const alternatives = (q.alternatives || []).map((a) => ({
      letter: a.letter || '',
      text: a.text || '',
      file: a.file || null,
      isCorrect: a.isCorrect || false,
    }))

    // Fallback: procura correctAlternative ou se não achar, usa a marcada como correta
    let correctAlternative = q.correctAlternative || q.gabarito || ''
    if (!correctAlternative && alternatives.length > 0) {
      const correctAlt = alternatives.find(a => a.isCorrect)
      correctAlternative = correctAlt?.letter || ''
    }

    return {
      id: `${year}-${index}`,
      year,
      discipline: normalizeDiscipline(q.discipline),
      title: q.title || '',
      context: q.context || '',
      alternativesIntroduction: q.alternativesIntroduction || '',
      alternatives,
      correctAlternative,
    }
  } catch {
    return null
  }
}
