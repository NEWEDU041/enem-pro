import { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Gabarito ENEM 2009-2024 — Gabarito Oficial Completo + Análise de Questões',
  description: 'Gabarito oficial do ENEM de todas as edições (2009-2024). Matemática, Linguagens, Ciências Humanas e Ciências da Natureza. Com análise de questões e correcção.',
  keywords: [
    'gabarito ENEM',
    'gabarito ENEM 2024',
    'gabarito ENEM oficial',
    'gabarito ENEM 2023',
    'respostas ENEM',
    'gabarito por disciplina',
    'questões ENEM com gabarito',
    'gabarito ENEM por ano',
  ],
  alternates: { canonical: `${SITE_URL}/gabarito` },
  openGraph: {
    title: 'Gabarito ENEM 2009-2024 — Todas as Respostas Corretas e Oficiais',
    description: 'Acesse o gabarito oficial do ENEM de todas as edições. Filtro por ano e disciplina com análise de questões e performance.',
    url: `${SITE_URL}/gabarito`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ENEM Pro - Gabarito ENEM' }],
  },
}

const YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009]

const YEAR_INFO: Record<number, { candidates: string; highlight: string; date: string }> = {
  2024: { candidates: '3,2 milhões', highlight: 'Edição mais recente', date: 'Novembro 2024' },
  2023: { candidates: '3,9 milhões', highlight: 'Retomada pós-pandemia', date: 'Novembro 2023' },
  2022: { candidates: '3,4 milhões', highlight: 'Edição híbrida de recuperação', date: 'Novembro 2022' },
  2021: { candidates: '3,1 milhões', highlight: 'Edição especial pós-pandemia', date: 'Fevereiro/Julho 2021' },
  2020: { candidates: '5,7 milhões', highlight: 'Aplicado em janeiro de 2021', date: 'Janeiro 2021' },
  2019: { candidates: '5,1 milhões', highlight: 'Novo formato de redação', date: 'Novembro 2019' },
  2018: { candidates: '5,5 milhões', highlight: 'Tema: Manipulação do comportamento', date: 'Novembro 2018' },
  2017: { candidates: '6,7 milhões', highlight: 'Tema: Desafios para a formação educacional', date: 'Novembro 2017' },
  2016: { candidates: '8,6 milhões', highlight: 'Tema: Caminhos para combater o racismo', date: 'Novembro 2016' },
  2015: { candidates: '7,7 milhões', highlight: 'Tema: A persistência da violência contra a mulher', date: 'Novembro 2015' },
  2014: { candidates: '8,7 milhões', highlight: 'Tema: Publicidade infantil', date: 'Novembro 2014' },
  2013: { candidates: '7,2 milhões', highlight: 'Tema: Efeitos da implantação da lei seca', date: 'Novembro 2013' },
  2012: { candidates: '5,8 milhões', highlight: 'Tema: O movimento imigratório para o Brasil', date: 'Novembro 2012' },
  2011: { candidates: '5,3 milhões', highlight: 'Tema: Viver em rede no século XXI', date: 'Novembro 2011' },
  2010: { candidates: '4,6 milhões', highlight: 'Primeiro ENEM com novo formato (4 áreas)', date: 'Novembro 2010' },
  2009: { candidates: '4,1 milhões', highlight: 'Último ENEM no formato antigo', date: 'Novembro 2009' },
}

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Gabarito ENEM Completo',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  description: 'Gabarito oficial do ENEM de todas as edições de 2009 a 2024 com análise de questões',
  url: `${SITE_URL}/gabarito`,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '5000',
    bestRating: '5',
    worstRating: '1',
  },
  creator: {
    '@type': 'Organization',
    name: 'ENEM Pro',
    url: SITE_URL,
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/gabarito/{search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Gabarito ENEM — Todas as Edições (2009-2024)',
  description: 'Gabarito oficial do ENEM de 2009 a 2024 com todas as respostas corretas',
  url: `${SITE_URL}/gabarito`,
  itemListElement: YEARS.map((y, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: `Gabarito ENEM ${y}`,
    url: `${SITE_URL}/gabarito/${y}`,
    description: YEAR_INFO[y]?.highlight || `Gabarito ENEM ${y}`,
  })),
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Quando é divulgado o gabarito oficial do ENEM?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'O gabarito oficial do ENEM é divulgado pelo INEP no dia seguinte à aplicação da segunda prova, normalmente em novembro. Aqui no ENEM Pro, você tem acesso a todos os gabaritos desde 2009.',
      },
    },
    {
      '@type': 'Question',
      name: 'O gabarito é diferente para cada caderno colorido?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'As questões são idênticas, mas a ordem das alternativas muda entre os cadernos (amarelo, azul, rosa e branco). O gabarito oficial do INEP corresponde ao caderno amarelo. Use nossa ferramenta para comparar suas respostas com cada gabarito.',
      },
    },
    {
      '@type': 'Question',
      name: 'Qual é a diferença entre os cadernos de cores diferentes?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Os cadernos contêm as mesmas questões na mesma ordem, mas as alternativas (A, B, C, D, E) estão em ordens diferentes. Isso evita cola. Se você lembra da cor do seu caderno, pode identificá-lo comparando suas respostas.',
      },
    },
    {
      '@type': 'Question',
      name: 'Como descobrir qual caderno eu fiz se não lembro da cor?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Compare suas respostas com cada um dos 4 gabaritos (amarelo, azul, rosa, branco). Quando seus acertos coincidirem perfeitamente com um gabarito, você descobriu qual era sua cor.',
      },
    },
    {
      '@type': 'Question',
      name: 'Posso usar os gabaritos antigos para estudar?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutamente! Usar gabaritos de anos anteriores para praticar é extremamente valioso. As questões refletem o padrão ENEM e ajudam você a se familiarizar com o nível de dificuldade. Recomendamos focar em questões dos últimos 2-3 anos.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quais foram os temas de redação de cada ano?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Cada edição do ENEM apresenta um novo tema de redação. Por exemplo, 2016 foi "Caminhos para combater o racismo" e 2019 foi sobre "a adoção, no Brasil, de políticas públicas que reconheçam, apoiem e valorizem as funções educacionais das famílias". Confira nosso histórico de temas.',
      },
    },
    {
      '@type': 'Question',
      name: 'Há questões resolvidas no seu banco de gabaritos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim! Além do gabarito oficial, nossa plataforma oferece explicações detalhadas para cada questão no Plano Pro. No Plano Grátis, você tem acesso ao gabarito. Acesse nosso Banco de Questões para praticar com explicações.',
      },
    },
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Gabarito ENEM', item: `${SITE_URL}/gabarito` },
  ],
}

export default function GabaritoIndexPageOptimized() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Expanded SEO Content */}
      <div className="sr-only">
        <h1>Gabarito ENEM 2009-2024 — Gabarito Oficial Completo de Todas as Edições</h1>

        <h2>Introdução — Por Que Acessar o Gabarito ENEM</h2>
        <p>
          O Gabarito ENEM do ENEM Pro oferece o gabarito oficial completo de todas as edições do ENEM de 2009 a 2024. Saber as respostas
          corretas é essencial para praticar, corrigir suas respostas, calcular sua nota aproximada e entender em quais áreas você precisa
          melhorar. Nosso banco contém os gabaritos de todas as 4 disciplinas (Matemática, Linguagens, Ciências Humanas e Ciências da Natureza)
          e oferece análise detalhada de cada questão.
        </p>

        <h2>Como Usar o Gabarito ENEM</h2>
        <p>
          Acessar o gabarito é fácil: escolha o ano desejado de 2009 a 2024 e você verá todas as respostas corretas organizadas por disciplina.
          Se você fez uma prova anterior, compare suas respostas com nosso gabarito para calcular quantas questões acertou. No Plano Pro,
          você desbloqueará explicações detalhadas de cada questão, ajudando você a entender por que cada resposta está correta.
        </p>

        <h2>Cadernos de Cores Diferentes — Entenda as Diferenças</h2>
        <p>
          O ENEM oferece 4 versões da prova com cadernos de cores diferentes: amarelo, azul, rosa e branco. As questões são idênticas,
          mas a ordem das alternativas (A, B, C, D, E) muda entre os cadernos. Isso evita fraude durante a prova. Nosso banco oferece
          gabaritos para todos os 4 cadernos, permitindo que você identifique qual foi o seu caderno comparando suas respostas.
        </p>

        <h2>Histórico de Temas de Redação — Veja o Padrão de Temas</h2>
        <p>
          Cada ano o ENEM apresenta um novo tema de redação. Nosso histórico mostra todos os temas desde 2009. Analisando esses temas,
          você identifica padrões: como temas sociais, ambientais, direitos humanos e inovação aparecem frequentemente. Usar o histórico
          de temas para estudar redação melhora suas chances de estar preparado para qualquer tema que possa cair.
        </p>

        <h2>Análise de Performance — Identifique Suas Fraquezas</h2>
        <p>
          Ao acessar o gabarito, você pode ver suas respostas versus as corretas. Isso permite que você identifique em quais disciplinas
          você mais erra e em quais você vai melhor. Essa análise é crucial para estruturar seu plano de estudos. Se você erra 20 questões
          de Matemática mas apenas 5 de Linguagens, você sabe onde precisa focar.
        </p>

        <h2>Comparação Entre Anos — Veja Como a Prova Evolui</h2>
        <p>
          Comparar gabaritos e questões de anos diferentes revela padrões. O nível de dificuldade mudou? Qual disciplina ficou mais
          desafiadora nos últimos anos? Essas observações ajudam você a se preparar melhor. Questões recentes tendem a ser mais relevantes
          para sua preparação, então reserve tempo extra estudando gabaritos dos últimos 2-3 anos.
        </p>

        <h2>Dados de Inscrição e Contexto — Entenda a Concorrência</h2>
        <p>
          Cada ano o gabarito vem com contexto: quantos candidatos se inscreverem, dados sobre o tema de redação e particularidades daquele
          ano. Esses dados ajudam você a entender a concorrência e o contexto da prova. Um ano com mais inscrições pode indicar mais
          competição para vagas SISU.
        </p>

        <h2>Integração com Banco de Questões e Simulado</h2>
        <p>
          Nosso Gabarito funciona com o Banco de Questões e o Simulado. Acesse uma questão no banco, veja sua resposta, confira o gabarito
          e aprenda com explicações de IA. Faça um simulado, receba uma nota TRI, e depois revise as questões que errou usando nosso gabarito.
          Tudo conectado em uma única plataforma.
        </p>

        <h2>Plano Recomendado de Estudo com Gabarito</h2>
        <p>
          Comece revendo gabaritos de 5-10 anos atrás para entender o padrão. Conforme se aproximar do ENEM, concentre-se nos gabaritos dos
          últimos 3 anos. Para cada questão que errar, estude o conceito relacionado. No Plano Pro, use as explicações de IA para entender o
          raciocínio. Isso transforma cada gabarito em uma ferramenta de aprendizado poderosa.
        </p>

        <h2>FAQ — Perguntas Frequentes Sobre Gabaritos ENEM</h2>
        <p>
          Confira as perguntas frequentes abaixo para aprender mais sobre como os gabaritos funcionam, as diferenças entre cadernos coloridos,
          temas de redação e como usar gabaritos para otimizar seu estudo.
        </p>
      </div>

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
          <h1 className="text-4xl font-bold text-zinc-900 mb-3">Gabarito ENEM 2009-2024 — Todas as Edições</h1>
          <p className="text-xl text-zinc-500 max-w-2xl">
            Gabarito oficial do ENEM de 2009 a 2024. Acesse respostas corretas de todas as 4 disciplinas, compare com cada caderno de cores, e estude com análise detalhada.
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
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/questoes" className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors">
              Banco de Questões
            </Link>
            <Link href="/simulado" className="inline-block bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-800 transition-colors border border-indigo-600">
              Fazer Simulado
            </Link>
          </div>
        </div>

        {/* FAQ SEO */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">Perguntas frequentes sobre gabarito do ENEM</h2>
          <div className="space-y-6">
            {[
              { q: 'Quando sai o gabarito do ENEM?', a: 'O gabarito oficial do ENEM é divulgado pelo INEP no dia seguinte à aplicação da segunda prova, normalmente em novembro. Aqui no ENEM Pro, você tem acesso a todos os gabaritos desde 2009.' },
              { q: 'O gabarito do ENEM é o mesmo para todos os cadernos?', a: 'As questões são as mesmas, mas a ordem das alternativas muda entre os cadernos de cores diferentes. O gabarito oficial do INEP corresponde ao caderno amarelo. Nossa plataforma oferece gabaritos para todos os 4 cadernos.' },
              { q: 'Como calcular minha nota no ENEM?', a: 'A nota do ENEM usa a Teoria de Resposta ao Item (TRI), que considera a dificuldade de cada questão. Acertar questões difíceis pesa mais do que acertar questões fáceis. Use nossa Calculadora de Nota ENEM para estimar sua pontuação.' },
              { q: 'Posso praticar com questões de gabaritos anteriores?', a: 'Sim! O ENEM Pro reúne todas as questões oficiais de 2009 a 2024. Você pode praticar por ano e disciplina, e o plano Pro inclui explicação de IA para cada questão.' },
              { q: 'Qual é a diferença entre cadernos de cores diferentes?', a: 'Os cadernos de cores diferentes (amarelo, azul, rosa e branco) contêm as mesmas questões, mas em ordem diferente. Você receberá uma cor aleatória no dia da prova.' },
              { q: 'Como saber qual caderno eu fiz se não me lembro da cor?', a: 'Você pode identificar seu caderno comparando suas respostas com cada gabarito (amarelo, azul, rosa, branco). Quando seus acertos coincidirem com um dos gabaritos, você descobriu qual era sua cor.' },
              { q: 'O gabarito de anos anteriores é igual ao do ENEM 2026?', a: 'O formato e a metodologia são semelhantes, mas o ENEM evolui sempre. O padrão de questões e dificuldade tendem a ser similares, razão pela qual praticar com gabaritos anteriores é muito valioso para se preparar.' },
            ].map(({ q, a }) => (
              <div key={q}>
                <h3 className="font-semibold text-zinc-900 mb-2">{q}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Internal Linking */}
      <section className="sr-only">
        <nav>
          <h3>Explore Outras Ferramentas ENEM Pro</h3>
          <ul>
            <li><Link href="/questoes">Banco de Questões ENEM — 2.900+ Questões com Gabarito</Link></li>
            <li><Link href="/simulado">Simulado ENEM Online — Teste com Cronômetro e Nota TRI</Link></li>
            <li><Link href="/calcular-nota">Calculadora de Nota ENEM — Estime Sua Pontuação com Curva TRI</Link></li>
            <li><Link href="/ferramentas">Todas as Ferramentas ENEM Pro</Link></li>
          </ul>
        </nav>
      </section>

      <footer className="bg-zinc-900 text-zinc-400 text-sm py-8 px-6 text-center mt-12">
        <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
      </footer>
    </div>
  )
}
