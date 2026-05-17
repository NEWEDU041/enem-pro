import { Question } from './types'

const BASE_URL = 'https://api.enem.dev/v1'

export const DISCIPLINES = [
  'Matemática',
  'Linguagens, Códigos e suas Tecnologias',
  'Ciências Humanas e suas Tecnologias',
  'Ciências da Natureza e suas Tecnologias',
]

export const YEARS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009]

interface RawAlternative {
  letter?: string
  letra?: string
  text?: string
  texto?: string
  isCorrect?: boolean
}

interface RawQuestion {
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

export async function fetchQuestionsByYear(year: number): Promise<Question[]> {
  const res = await fetch(`${BASE_URL}/exams/${year}/questions`, {
    next: { revalidate: 86400 },
  })
  if (!res.ok) throw new Error(`Erro ao buscar questões de ${year}`)
  const data = await res.json()
  return (data.questions || data).map((q: RawQuestion, i: number) => ({
    id: `${year}-${i + 1}`,
    year,
    discipline: q.discipline || q.disciplina || 'Geral',
    title: q.title || q.enunciado || '',
    context: q.context || q.contexto || '',
    alternativesIntroduction: q.alternativesIntroduction || '',
    alternatives: (q.alternatives || q.alternativas || []).map((a) => ({
      letter: a.letter || a.letra || '',
      text: a.text || a.texto || '',
      isCorrect: a.isCorrect || false,
    })),
    correctAlternative: q.correctAlternative || q.gabarito || '',
  }))
}

export async function fetchSingleQuestion(year: number, index: number): Promise<Question | null> {
  try {
    const res = await fetch(`${BASE_URL}/exams/${year}/questions/${index}`, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const q: RawQuestion = await res.json()
    return {
      id: `${year}-${index}`,
      year,
      discipline: q.discipline || 'Geral',
      title: q.title || '',
      context: q.context || '',
      alternativesIntroduction: q.alternativesIntroduction || '',
      alternatives: (q.alternatives || []).map((a) => ({
        letter: a.letter || '',
        text: a.text || '',
        isCorrect: a.isCorrect || false,
      })),
      correctAlternative: q.correctAlternative || '',
    }
  } catch {
    return null
  }
}
