import { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Gabarito ENEM 2009-2024 — Gabarito Official + Análise de Questões',
  description: 'Gabarito oficial do ENEM de todas as edições de 2009 a 2024. Matemática, Linguagens, Ciências Humanas e Ciências da Natureza com respostas corretas e análise.',
  keywords: ['gabarito ENEM', 'gabarito ENEM 2024', 'gabarito oficial ENEM', 'respostas ENEM', 'gabarito por disciplina'],
  alternates: { canonical: `${SITE_URL}/gabarito` },
  openGraph: {
    title: 'Gabarito ENEM 2009-2024 — Todas as Respostas Corretas',
    description: 'Acesse o gabarito oficial do ENEM de todas as edições. Filtro por ano e disciplina com análise de questões.',
    url: `${SITE_URL}/gabarito`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ENEM Pro - Gabarito ENEM' }],
  },
}

const YEARS = [2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009]

const YEAR_INFO: Record<number, { candidates: string; highlight: string }> = {
  2023: { candidates: '3,9 milhões', highlight: 'Retomada pós-pandemia' },
  2022: { candidates: '3,4 milhões', highlight: 'Edição híbrida de recuperação' },
  2021: { candidates: '3,1 milhões', highlight: 'Edição especial pós-pandemia' },
  2020: { candidates: '5,7 milhões', highlight: 'Aplicado em janeiro de 2021' },
  2019: { candidates: '5,1 milhões', highlight: 'Novo formato de redação' },
  2018: { candidates: '5,5 milhões', highlight: 'Tema: Manipulação do comportamento' },
  2017: { candidates: '6,7 milhões', highlight: 'Tema: Desafios para a formação educacional' },
  2016: { candidates: '8,6 milhões', highlight: 'Tema: Caminhos para combater o racismo' },
  2015: { candidates: '7,7 milhões', highlight: 'Tema: A persistência da violência contra a mulher' },
  2014: { candidates: '8,7 milhões', highlight: 'Tema: Publicidade infantil' },
  2013: { candidates: '7,2 milhões', highlight: 'Tema: Efeitos da implantação da lei seca' },
  2012: { candidates: '5,8 milhões', highlight: 'Tema: O movimento imigratório para o Brasil' },
  2011: { candidates: '5,3 milhões', highlight: 'Tema: Viver em rede no século XXI' },
  2010: { candidates: '4,6 milhões', highlight: 'Primeiro ENEM com novo formato (4 áreas)' },
  2009: { candidates: '4,1 milhões', highlight: 'Último ENEM no formato antigo' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Gabarito ENEM — Todas as Edições',
  description: 'Gabarito oficial do ENEM de 2009 a 2024',
  url: `${SITE_URL}/gabarito`,
  itemListElement: YEARS.map((y, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: `Gabarito ENEM ${y}`,
    url: `${SITE_URL}/gabarito/${y}`,
  })),
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Gabarito ENEM', item: `${SITE_URL}/gabarito` },
  ],
}

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Quando sai o gabarito do ENEM?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'O gabarito oficial do ENEM é divulgado pelo INEP no dia seguinte à aplicação da segunda prova, normalmente em novembro. Aqui no ENEM Pro, você tem acesso a todos os gabaritos desde 2009.',
      },
    },
    {
      '@type': 'Question',
      name: 'O gabarito do ENEM é o mesmo para todos os cadernos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'As questões são as mesmas, mas a ordem das alternativas muda entre os cadernos de cores diferentes. O gabarito oficial do INEP corresponde ao caderno amarelo.',
      },
    },
    {
      '@type': 'Question',
      name: 'Como calcular minha nota no ENEM?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A nota do ENEM usa a Teoria de Resposta ao Item (TRI), que considera a dificuldade de cada questão. Acertar questões difíceis pesa mais do que acertar questões fáceis. Use nossa Calculadora de Nota ENEM para estimar sua pontuação.',
      },
    },
    {
      '@type': 'Question',
      name: 'Posso praticar com questões de gabaritos anteriores?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim! O ENEM Pro reúne todas as questões oficiais de 2009 a 2024. Você pode praticar por ano e disciplina, e o plano Pro inclui explicação de IA para cada questão.',
      },
    },
    {
      '@type': 'Question',
      name: 'Qual é a diferença entre cadernos de cores diferentes?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Os cadernos de cores diferentes (amarelo, azul, rosa e branco) contêm as mesmas questões, mas em ordem diferente. Você receberá uma cor aleatória no dia da prova.',
      },
    },
  ],
}

export default function GabaritoIndexPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

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
        <nav className="text-xs text-zinc-500 mb-6">
          <Link href="/" className="hover:text-zinc-700">Início</Link>
          {' / '}
          <span className="text-zinc-600">Gabarito ENEM</span>
        </nav>

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-zinc-900 mb-3">Gabarito ENEM — Todas as Edições</h1>
          <p className="text-xl text-zinc-500 max-w-2xl">
            Gabarito oficial do ENEM de 2009 a 2024. Veja as respostas corretas de Matemática, Linguagens, Ciências Humanas e Ciências da Natureza.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {YEARS.map((year) => {
            const info = YEAR_INFO[year]
            return (
              <Link
                key={year}
                href={`/gabarito/${year}`}
                className="bg-white rounded-2xl border border-zinc-200 p-6 hover:border-indigo-400 hover:shadow-sm transition-all flex items-center gap-5"
              >
                <div className="shrink-0 w-16 h-16 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <span className="text-indigo-700 font-bold text-lg">{year}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-zinc-900 mb-0.5">Gabarito ENEM {year}</div>
                  {info && (
                    <>
                      <div className="text-xs text-zinc-500">{info.candidates} inscritos</div>
                      <div className="text-xs text-zinc-500 mt-0.5 truncate">{info.highlight}</div>
                    </>
                  )}
                </div>
                <span className="text-zinc-300 text-lg shrink-0">→</span>
              </Link>
            )
          })}
        </div>

        {/* CTA */}
        <div className="bg-indigo-600 text-white rounded-2xl px-8 py-8 text-center mb-10">
          <h2 className="text-2xl font-bold mb-2">Pratique com as questões reais</h2>
          <p className="text-indigo-100 mb-6">Veja o gabarito, responda as questões e entenda o raciocínio com IA. 10 questões/dia grátis.</p>
          <Link href="/auth/register" className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors">
            Criar conta grátis
          </Link>
        </div>

        {/* FAQ SEO */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">Perguntas frequentes sobre o gabarito do ENEM</h2>
          <div className="space-y-6">
            {[
              { q: 'Quando sai o gabarito do ENEM?', a: 'O gabarito oficial do ENEM é divulgado pelo INEP no dia seguinte à aplicação da segunda prova, normalmente em novembro. Aqui no ENEM Pro, você tem acesso a todos os gabaritos desde 2009.' },
              { q: 'O gabarito do ENEM é o mesmo para todos os cadernos?', a: 'As questões são as mesmas, mas a ordem das alternativas muda entre os cadernos de cores diferentes. O gabarito oficial do INEP corresponde ao caderno amarelo.' },
              { q: 'Como calcular minha nota no ENEM?', a: 'A nota do ENEM usa a Teoria de Resposta ao Item (TRI), que considera a dificuldade de cada questão. Acertar questões difíceis pesa mais do que acertar questões fáceis. Use nossa Calculadora de Nota ENEM para estimar sua pontuação.' },
              { q: 'Posso praticar com questões de gabaritos anteriores?', a: 'Sim! O ENEM Pro reúne todas as questões oficiais de 2009 a 2024. Você pode praticar por ano e disciplina, e o plano Pro inclui explicação de IA para cada questão.' },
              { q: 'Qual é a diferença entre cadernos de cores diferentes?', a: 'Os cadernos de cores diferentes (amarelo, azul, rosa e branco) contêm as mesmas questões, mas em ordem diferente. Você receberá uma cor aleatória no dia da prova.' },
              { q: 'Como saber qual caderno eu fiz se não me lembro da cor?', a: 'Você pode identificar seu caderno comparando suas respostas com cada gabarito (amarelo, azul, rosa, branco). Quando seus acertos coincidirem com um dos gabaritos, você descobriu qual era sua cor.' },
              { q: 'O gabarito de anos anteriores é igual ao do ENEM 2026?', a: 'O formato e a metodologia são semelhantes, mas o ENEM evolui sempre. O padrão de questões e dificuldade tendem a ser similares, razão pela qual praticar com gabaritos anteriores é muito valioso.' },
            ].map(({ q, a }) => (
              <div key={q}>
                <h3 className="font-semibold text-zinc-900 mb-2">{q}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-zinc-900 text-zinc-400 text-sm py-8 px-6 text-center mt-12">
        <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
      </footer>
    </div>
  )
}
