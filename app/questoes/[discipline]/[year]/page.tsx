import { Metadata } from 'next'
import Link from 'next/link'
import { fetchQuestionsByYear } from '@/lib/enem-api'

const SLUG_TO_DISCIPLINE: Record<string, string> = {
  'matematica': 'Matemática',
  'linguagens': 'Linguagens, Códigos e suas Tecnologias',
  'ciencias-humanas': 'Ciências Humanas e suas Tecnologias',
  'ciencias-natureza': 'Ciências da Natureza e suas Tecnologias',
}

const DISCIPLINE_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_TO_DISCIPLINE).map(([k, v]) => [v, k])
)

const VALID_YEARS = [2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009]

export async function generateStaticParams() {
  const params = []
  for (const discipline of Object.keys(SLUG_TO_DISCIPLINE)) {
    for (const year of VALID_YEARS) {
      params.push({ discipline, year: String(year) })
    }
  }
  return params
}

export async function generateMetadata({ params }: { params: Promise<{ discipline: string; year: string }> }): Promise<Metadata> {
  const { discipline, year } = await params
  const disc = SLUG_TO_DISCIPLINE[discipline]
  if (!disc) return {}
  const shortDisc = disc.split(',')[0]
  return {
    title: `Questões de ${shortDisc} ENEM ${year} com gabarito — ENEM Pro`,
    description: `Pratique todas as questões de ${shortDisc} do ENEM ${year} com gabarito oficial e explicação por IA. Treine grátis.`,
    alternates: { canonical: `https://enem-pro-eight.vercel.app/questoes/${discipline}/${year}` },
  }
}

export default async function SEOQuestoesPage({ params }: { params: Promise<{ discipline: string; year: string }> }) {
  const { discipline, year } = await params
  const disc = SLUG_TO_DISCIPLINE[discipline]
  const yearNum = parseInt(year)

  if (!disc || !VALID_YEARS.includes(yearNum)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Página não encontrada.</p>
      </div>
    )
  }

  const shortDisc = disc.split(',')[0]

  let questions: Awaited<ReturnType<typeof fetchQuestionsByYear>> = []
  try {
    const all = await fetchQuestionsByYear(yearNum)
    questions = all.filter(q => q.discipline.toLowerCase().includes(shortDisc.toLowerCase().split(' ')[0]))
  } catch {
    questions = []
  }

  const otherYears = VALID_YEARS.filter(y => y !== yearNum).slice(0, 6)
  const otherDiscs = Object.entries(SLUG_TO_DISCIPLINE).filter(([s]) => s !== discipline)

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-zinc-500 hover:text-zinc-900">Entrar</Link>
            <Link href="/auth/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <nav className="text-xs text-zinc-400 mb-6">
          <Link href="/" className="hover:text-zinc-700">Início</Link>
          {' / '}
          <Link href="/questoes" className="hover:text-zinc-700">Questões</Link>
          {' / '}
          <span className="text-zinc-600">{shortDisc} {year}</span>
        </nav>

        <h1 className="text-3xl font-bold mb-3 text-zinc-900">
          Questões de {shortDisc} — ENEM {year}
        </h1>
        <p className="text-zinc-500 mb-8">
          {questions.length > 0 ? questions.length : 'Todas as'} questões oficiais de {shortDisc} do ENEM {year} com gabarito.
          Responda e receba explicação por IA no Plano Pro.
        </p>

        {/* CTA */}
        <div className="bg-indigo-600 text-white rounded-2xl px-6 py-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Pratique com gabarito e IA — grátis</p>
            <p className="text-indigo-200 text-sm">10 questões/dia grátis · IA explica no Pro por R$14,90/mês</p>
          </div>
          <Link href="/auth/register" className="shrink-0 bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors text-sm">
            Criar conta grátis
          </Link>
        </div>

        {/* Question list */}
        {questions.length > 0 ? (
          <div className="space-y-3 mb-10">
            {questions.map((q, i) => (
              <Link
                key={q.id}
                href={`/questoes/${q.id}?year=${year}`}
                className="block bg-white rounded-xl border border-zinc-200 px-6 py-4 hover:border-indigo-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-400">Questão {i + 1}</span>
                    </div>
                    <p className="text-sm text-zinc-700 line-clamp-2 leading-relaxed">
                      {q.title || 'Ver questão completa'}
                    </p>
                  </div>
                  <span className="text-zinc-300 shrink-0">→</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center text-zinc-400 mb-10">
            Questões disponíveis após criar conta.{' '}
            <Link href="/auth/register" className="text-indigo-600 underline">Começar grátis</Link>
          </div>
        )}

        {/* Internal links — outros anos */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
          <h2 className="font-semibold mb-4 text-zinc-900">{shortDisc} — outros anos</h2>
          <div className="flex flex-wrap gap-2">
            {otherYears.map(y => (
              <Link
                key={y}
                href={`/questoes/${discipline}/${y}`}
                className="px-4 py-2 border border-zinc-200 rounded-lg text-sm hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                ENEM {y}
              </Link>
            ))}
          </div>
        </div>

        {/* Internal links — outras disciplinas */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="font-semibold mb-4 text-zinc-900">Outras disciplinas — ENEM {year}</h2>
          <div className="flex flex-wrap gap-2">
            {otherDiscs.map(([slug, name]) => (
              <Link
                key={slug}
                href={`/questoes/${slug}/${year}`}
                className="px-4 py-2 border border-zinc-200 rounded-lg text-sm hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                {name.split(',')[0]}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-zinc-900 text-zinc-500 text-sm py-8 px-6 text-center mt-16">
        <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
      </footer>
    </div>
  )
}
