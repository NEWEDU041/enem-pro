import type { Metadata } from 'next'
import { SLUG_TO_DISCIPLINE as CANONICAL_SLUGS } from '@/lib/enem-constants'
import { fetchQuestionsByYearCached, filterAndPaginateQuestions, DEFAULT_QUESTIONS_YEAR } from '@/lib/questions-cache'
import QuestoesClient from './QuestoesClient'

// Accepts an older alternate slug spelling on incoming query params; outgoing
// links always use the canonical slug from disciplineToSlug().
const SLUG_TO_DISCIPLINE: Record<string, string> = {
  ...CANONICAL_SLUGS,
  'ciencias-da-natureza': 'Ciências da Natureza e suas Tecnologias',
}

export const metadata: Metadata = {
  title: 'Questões ENEM 2009–2024 — Todas as Disciplinas | ENEM Pro',
  description: 'Pratique com mais de 2.900 questões reais do ENEM de 2009 a 2024. Filtre por ano e disciplina. Gabarito imediato e explicação por IA no Plano Pro.',
}

interface PageProps {
  searchParams: Promise<{ year?: string; discipline?: string; disciplina?: string; page?: string }>
}

export default async function QuestoesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const year = params.year || String(DEFAULT_QUESTIONS_YEAR)
  const rawDisc = params.discipline || params.disciplina || ''
  const discipline = (SLUG_TO_DISCIPLINE[rawDisc] ?? rawDisc) || 'Matemática'
  const requestedPage = parseInt(params.page || '1')

  let all: Awaited<ReturnType<typeof fetchQuestionsByYearCached>> = []
  try {
    all = await fetchQuestionsByYearCached(parseInt(year))
  } catch {
    all = []
  }

  const { questions, total, page } = filterAndPaginateQuestions(all, discipline, requestedPage)

  return (
    <QuestoesClient
      initialYear={year}
      initialDiscipline={discipline}
      initialPage={page}
      initialQuestions={questions}
      initialTotal={total}
    />
  )
}
