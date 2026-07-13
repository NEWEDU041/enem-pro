import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchQuestionsByYearCached } from '@/lib/questions-cache'
import { SITE_URL } from '@/lib/site-config'
import { previewText } from '@/lib/text-preview'
import { disciplineToSlug } from '@/lib/enem-api'

// API enem.dev only provides data for years up to 2023
const VALID_YEARS = [2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009]

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const { year } = await params
  return {
    title: `Gabarito ENEM ${year} — Todas as Disciplinas`,
    description: `Gabarito oficial do ENEM ${year} completo: Matemática, Linguagens, Ciências Humanas e Ciências da Natureza. Veja as respostas corretas de todas as questões.`,
    alternates: { canonical: `${SITE_URL}/gabarito/${year}` },
    openGraph: {
      title: `Gabarito ENEM ${year} Completo | ENEM Pro`,
      description: `Gabarito oficial do ENEM ${year}. Respostas corretas de todas as disciplinas.`,
    },
  }
}

const DISC_ORDER = [
  'Linguagens, Códigos e suas Tecnologias',
  'Ciências Humanas e suas Tecnologias',
  'Ciências da Natureza e suas Tecnologias',
  'Matemática',
]

const DISC_SHORT: Record<string, string> = {
  'Linguagens, Códigos e suas Tecnologias': 'Linguagens',
  'Ciências Humanas e suas Tecnologias': 'Ciências Humanas',
  'Ciências da Natureza e suas Tecnologias': 'Ciências da Natureza',
  'Matemática': 'Matemática',
}


export default async function GabaritoYearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params
  const yearNum = parseInt(year)

  if (!VALID_YEARS.includes(yearNum)) notFound()

  let questions: Awaited<ReturnType<typeof fetchQuestionsByYearCached>> = []
  try {
    questions = await fetchQuestionsByYearCached(yearNum)
  } catch {
    questions = []
  }

  // Group by discipline, preserving index within full list
  const byDisc: Record<string, { q: typeof questions[0]; globalIndex: number }[]> = {}
  questions.forEach((q, i) => {
    if (!byDisc[q.discipline]) byDisc[q.discipline] = []
    byDisc[q.discipline].push({ q, globalIndex: i + 1 })
  })

  const disciplines = DISC_ORDER.filter((d) => byDisc[d]?.length)
  const otherYears = VALID_YEARS.filter((y) => y !== yearNum)

  const pageUrl = `${SITE_URL}/gabarito/${year}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Gabarito ENEM ${year} — Todas as Disciplinas`,
    description: `Gabarito oficial do ENEM ${year} completo com respostas corretas de todas as questões.`,
    url: pageUrl,
    inLanguage: 'pt-BR',
    publisher: { '@type': 'EducationalOrganization', name: 'ENEM Pro', url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Gabarito ENEM', item: `${SITE_URL}/gabarito` },
      { '@type': 'ListItem', position: 3, name: `Gabarito ENEM ${year}`, item: pageUrl },
    ],
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <nav className="sticky top-0 z-50 bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-zinc-600 hover:text-zinc-900">Entrar</Link>
            <Link href="/auth/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <nav className="text-xs text-zinc-400 mb-6">
          <Link href="/" className="hover:text-zinc-700">Início</Link>
          {' / '}
          <Link href="/gabarito" className="hover:text-zinc-700">Gabarito ENEM</Link>
          {' / '}
          <span className="text-zinc-600">{year}</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 mb-3">Gabarito ENEM {year}</h1>
          <p className="text-lg text-zinc-500 max-w-2xl">
            Gabarito oficial completo do ENEM {year} com {questions.length} questões organizadas por disciplina.
            Clique em qualquer questão para praticar com gabarito e explicação por IA.
          </p>
        </div>

        {/* Jump links */}
        {disciplines.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {disciplines.map((d) => (
              <a
                key={d}
                href={`#${disciplineToSlug(d)}`}
                className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                {DISC_SHORT[d]} ({byDisc[d].length})
              </a>
            ))}
          </div>
        )}

        {/* CTA banner */}
        <div className="bg-indigo-600 text-white rounded-2xl px-6 py-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Pratique estas questões com gabarito e IA</p>
            <p className="text-indigo-200 text-sm">10 questões/dia grátis · Pro: ilimitado + IA explica cada resposta</p>
          </div>
          <Link href="/auth/register" className="shrink-0 bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors text-sm">
            Criar conta grátis
          </Link>
        </div>

        {questions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center text-zinc-400">
            Gabarito não disponível no momento. Tente novamente em alguns segundos.
          </div>
        ) : (
          <div className="space-y-8">
            {disciplines.map((disc) => {
              const items = byDisc[disc] || []
              const discSlug = disciplineToSlug(disc) || ''
              return (
                <section key={disc} id={discSlug}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-zinc-900">{DISC_SHORT[disc]}</h2>
                    <Link
                      href={`/questoes/${discSlug}/${year}`}
                      className="text-xs text-indigo-600 font-semibold hover:underline"
                    >
                      Praticar {DISC_SHORT[disc]} {year} →
                    </Link>
                  </div>
                  <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                    <div className="grid grid-cols-[3rem_1fr] text-xs font-semibold text-zinc-400 uppercase tracking-wide px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                      <span>Nº</span>
                      <span>Enunciado e resposta</span>
                    </div>
                    <div className="divide-y divide-zinc-100">
                      {items.map(({ q, globalIndex }) => {
                        const correctAlt = q.alternatives?.find((a) => a.letter === q.correctAlternative)
                        const preview = previewText(q.alternativesIntroduction) || previewText(q.context)
                        return (
                          <Link
                            key={q.id}
                            href={`/questoes/${discSlug}/${year}/${q.id.split('-')[1]}`}
                            className="grid grid-cols-[3rem_1fr] items-start px-4 py-3.5 hover:bg-indigo-50 transition-colors group"
                          >
                            <span className="text-sm font-mono text-zinc-400 pt-0.5">{globalIndex}</span>
                            <span>
                              <span className="block text-sm text-zinc-700 pr-4 group-hover:text-indigo-700">
                                {preview ? preview.slice(0, 140) + (preview.length > 140 ? '…' : '') : 'Questão com imagem — ver completa'}
                              </span>
                              <span className="mt-1.5 flex items-start gap-2">
                                <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-xs">
                                  {q.correctAlternative}
                                </span>
                                <span className="text-sm text-green-700 leading-snug pt-0.5">
                                  {previewText(correctAlt?.text) || (correctAlt?.file ? 'Alternativa em imagem — ver questão completa' : 'Resposta correta')}
                                </span>
                              </span>
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* Outros anos */}
        <div className="mt-10 bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="font-bold text-zinc-900 mb-4">Gabarito de outros anos</h2>
          <div className="flex flex-wrap gap-2">
            {otherYears.map((y) => (
              <Link
                key={y}
                href={`/gabarito/${y}`}
                className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                ENEM {y}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-zinc-900 text-zinc-500 text-sm py-8 px-6 text-center mt-12">
        <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
      </footer>
    </div>
  )
}
