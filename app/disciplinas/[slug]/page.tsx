import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/site-config'

const DISCIPLINES_MAP: Record<string, {
  name: string
  fullName: string
  slug: string
  desc: string
  topics: string[]
  yearRange: string
  color: string
  icon: string
}> = {
  matematica: {
    name: 'Matemática',
    fullName: 'Matemática e suas Tecnologias',
    slug: 'matematica',
    desc: 'Pratique questões de Matemática do ENEM de 2009 a 2024. Álgebra, geometria, estatística, funções e mais — com explicação de IA para cada questão errada.',
    topics: ['Álgebra e funções', 'Geometria plana e espacial', 'Estatística e probabilidade', 'Análise combinatória', 'Progressões (PA e PG)', 'Trigonometria', 'Logaritmos e exponenciais', 'Matrizes e determinantes'],
    yearRange: '2009–2024',
    color: 'indigo',
    icon: '📐',
  },
  linguagens: {
    name: 'Linguagens',
    fullName: 'Linguagens, Códigos e suas Tecnologias',
    slug: 'linguagens',
    desc: 'Questões de Linguagens do ENEM de 2009 a 2024. Interpretação de texto, gramática, literatura, artes, educação física e língua estrangeira.',
    topics: ['Interpretação de texto', 'Gramática e norma culta', 'Literatura brasileira', 'Semiótica e linguagem', 'Artes e música', 'Língua estrangeira (Inglês/Espanhol)', 'Publicidade e propaganda', 'Gêneros textuais'],
    yearRange: '2009–2024',
    color: 'violet',
    icon: '📖',
  },
  'ciencias-humanas': {
    name: 'Ciências Humanas',
    fullName: 'Ciências Humanas e suas Tecnologias',
    slug: 'ciencias-humanas',
    desc: 'Questões de Ciências Humanas do ENEM de 2009 a 2024. História, Geografia, Filosofia e Sociologia com gabarito e explicação por IA.',
    topics: ['História do Brasil', 'História Mundial', 'Geografia do Brasil', 'Geopolítica', 'Filosofia Antiga e Moderna', 'Sociologia', 'Direitos humanos', 'Atualidades e cidadania'],
    yearRange: '2009–2024',
    color: 'amber',
    icon: '🌎',
  },
  'ciencias-natureza': {
    name: 'Ciências da Natureza',
    fullName: 'Ciências da Natureza e suas Tecnologias',
    slug: 'ciencias-natureza',
    desc: 'Questões de Ciências da Natureza do ENEM de 2009 a 2024. Física, Química e Biologia — com resolução completa gerada por IA.',
    topics: ['Mecânica e cinemática', 'Eletricidade e magnetismo', 'Termodinâmica e ondas', 'Química orgânica', 'Estequiometria', 'Biologia celular e molecular', 'Ecologia e meio ambiente', 'Genética e hereditariedade'],
    yearRange: '2009–2024',
    color: 'emerald',
    icon: '🔬',
  },
}

const SLUG_TO_API_DISCIPLINE: Record<string, string> = {
  matematica: 'Matemática',
  linguagens: 'Linguagens, Códigos e suas Tecnologias',
  'ciencias-humanas': 'Ciências Humanas e suas Tecnologias',
  'ciencias-natureza': 'Ciências da Natureza e suas Tecnologias',
}

export async function generateStaticParams() {
  return Object.keys(DISCIPLINES_MAP).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const disc = DISCIPLINES_MAP[slug]
  if (!disc) return {}
  return {
    title: `Questões ENEM ${disc.name} 2009–2024 | ENEM Pro`,
    description: disc.desc,
    alternates: { canonical: `${SITE_URL}/disciplinas/${slug}` },
    openGraph: {
      title: `Questões ENEM ${disc.name} | ENEM Pro`,
      description: disc.desc,
    },
  }
}

const COLOR_MAP: Record<string, { badge: string; btn: string; card: string; ring: string }> = {
  indigo: { badge: 'bg-indigo-50 text-indigo-700', btn: 'bg-indigo-600 hover:bg-indigo-700 text-white', card: 'border-indigo-100 bg-indigo-50', ring: 'ring-indigo-200' },
  violet: { badge: 'bg-violet-50 text-violet-700', btn: 'bg-violet-600 hover:bg-violet-700 text-white', card: 'border-violet-100 bg-violet-50', ring: 'ring-violet-200' },
  amber: { badge: 'bg-amber-50 text-amber-700', btn: 'bg-amber-600 hover:bg-amber-700 text-white', card: 'border-amber-100 bg-amber-50', ring: 'ring-amber-200' },
  emerald: { badge: 'bg-emerald-50 text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700 text-white', card: 'border-emerald-100 bg-emerald-50', ring: 'ring-emerald-200' },
}

const YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009]

export default async function DisciplinaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const disc = DISCIPLINES_MAP[slug]
  if (!disc) notFound()

  const c = COLOR_MAP[disc.color]
  const apiDisc = encodeURIComponent(SLUG_TO_API_DISCIPLINE[slug])

  const pageUrl = `${SITE_URL}/disciplinas/${slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `ENEM ${disc.name} — Questões 2009 a 2024`,
    description: disc.desc,
    url: pageUrl,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'ENEM Pro',
      url: SITE_URL,
    },
    hasCourseInstance: YEARS.map((y) => ({
      '@type': 'CourseInstance',
      name: `ENEM ${disc.name} ${y}`,
      courseMode: 'online',
      inLanguage: 'pt-BR',
    })),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Questões ENEM', item: `${SITE_URL}/questoes` },
      { '@type': 'ListItem', position: 3, name: `${disc.name}`, item: pageUrl },
    ],
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-zinc-600 hover:text-zinc-900">Entrar</Link>
            <Link href="/auth/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-white border-b border-zinc-100 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full mb-6 ${c.badge}`}>
            <span>{disc.icon}</span>
            <span>ENEM {disc.yearRange}</span>
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 mb-4 leading-tight">
            Questões ENEM — {disc.name}
          </h1>
          <p className="text-xl text-zinc-500 max-w-2xl mb-8 leading-relaxed">{disc.desc}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/questoes?discipline=${encodeURIComponent(SLUG_TO_API_DISCIPLINE[slug])}&year=2023`}
              className={`inline-block px-8 py-4 rounded-xl text-lg font-semibold transition-colors ${c.btn}`}
            >
              Praticar questões →
            </Link>
            <Link
              href="/auth/register"
              className="inline-block bg-white border border-zinc-300 text-zinc-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-zinc-50 transition-colors"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </section>

      {/* Tópicos */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Principais tópicos cobrados</h2>
          <p className="text-zinc-500 mb-8">Os conteúdos que mais aparecem no ENEM de {disc.name}.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {disc.topics.map((t) => (
              <div key={t} className={`flex items-center gap-3 rounded-xl border p-4 ${c.card}`}>
                <span className="text-indigo-500 font-bold text-lg shrink-0">✓</span>
                <span className="text-sm font-medium text-zinc-800">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Questões por ano */}
      <section className="py-16 px-6 bg-white border-t border-zinc-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Questões por ano</h2>
          <p className="text-zinc-500 mb-8">Escolha o ano do ENEM para praticar {disc.name}.</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {YEARS.map((y) => (
              <Link
                key={y}
                href={`/questoes?discipline=${apiDisc}&year=${y}`}
                className="flex items-center justify-center py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition-all"
              >
                {y}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Por que o ENEM Pro */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-900 mb-8 text-center">Por que treinar {disc.name} no ENEM Pro?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <div className="text-3xl mb-4">📋</div>
              <h3 className="font-semibold mb-2">Questões reais do INEP</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Todas as questões de {disc.name} do ENEM de 2009 a 2024. Direto da fonte oficial — nada inventado.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="font-semibold mb-2">IA explica cada erro</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Errou uma questão? A IA gera uma explicação completa do raciocínio correto em 30 segundos.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-semibold mb-2">Acompanhe sua evolução</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Veja sua taxa de acerto em {disc.name}, identifique pontos fracos e saiba exatamente onde focar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Outras disciplinas */}
      <section className="py-12 px-6 bg-white border-t border-zinc-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-zinc-900 mb-4">Outras disciplinas</h2>
          <div className="flex flex-wrap gap-3">
            {Object.values(DISCIPLINES_MAP).filter((d) => d.slug !== slug).map((d) => (
              <Link
                key={d.slug}
                href={`/disciplinas/${d.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-700 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
              >
                {d.icon} {d.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-16 px-6 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Comece a praticar {disc.name} agora</h2>
        <p className="text-indigo-200 mb-8">10 questões por dia grátis. Sem cartão de crédito.</p>
        <Link
          href="/auth/register"
          className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition-colors"
        >
          Criar conta grátis
        </Link>
      </section>

      <footer className="bg-zinc-900 text-zinc-500 text-sm py-8 px-6 text-center">
        <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
      </footer>
    </div>
  )
}
