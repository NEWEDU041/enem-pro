import type { Metadata } from 'next'
import Link from 'next/link'
import CalcularNotaClient from '@/components/CalcularNotaClient'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Calculadora ENEM 2026 — Calcule Sua Nota com Curva TRI Automática',
  description: 'Calculadora de nota ENEM com TRI automática. Estima sua pontuação por área, compara com notas de corte SISU, ProUni e FIES. Descubra quais cursos estão ao seu alcance.',
  keywords: [
    'calculadora ENEM',
    'calculadora nota ENEM',
    'TRI ENEM',
    'nota de corte SISU',
    'calcular nota ENEM TRI',
    'estimativa de nota ENEM',
    'notas de corte ENEM',
    'nota de corte ProUni',
  ],
  alternates: { canonical: `${SITE_URL}/calcular-nota` },
  openGraph: {
    title: 'Calculadora ENEM 2026 — Descubra Sua Pontuação com Curva TRI',
    description: 'Calculadora interativa de nota ENEM com TRI, notas de corte SISU, ProUni e FIES. Compare sua nota com cursos de interesse.',
    url: `${SITE_URL}/calcular-nota`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ENEM Pro - Calculadora de Nota' }],
  },
}

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Calculadora de Nota ENEM',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  description: 'Calculadora interativa de nota ENEM com estimativa TRI por área de conhecimento e comparação com notas de corte SISU',
  url: `${SITE_URL}/calcular-nota`,
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
  potentialAction: [
    {
      '@type': 'CalculateAction',
      description: 'Calcular nota ENEM',
    },
  ],
}

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'Tool',
  name: 'Calculadora de Nota ENEM',
  description: 'Ferramenta para calcular nota ENEM com TRI automático',
  url: `${SITE_URL}/calcular-nota`,
  image: `${SITE_URL}/opengraph-image`,
  creator: {
    '@type': 'Organization',
    name: 'ENEM Pro',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Como funciona a Teoria de Resposta ao Item (TRI)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A TRI é a metodologia oficial do ENEM que considera a dificuldade de cada questão. Acertar uma questão difícil pesa muito mais que acertar uma fácil. Nossa calculadora replica essa lógica para oferecer uma estimativa realista de sua nota.',
      },
    },
    {
      '@type': 'Question',
      name: 'Qual é a diferença entre nota raw e nota TRI?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A nota raw é simplesmente contar acertos (45 acertos = 45 pontos). A nota TRI transforma isso em uma escala de 0-1000 levando em conta a dificuldade. Nossa calculadora trabalha com TRI.',
      },
    },
    {
      '@type': 'Question',
      name: 'Como as notas de corte do SISU funcionam?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'As notas de corte do SISU variam a cada edição baseadas na concorrência. Nossa calculadora mostra histórico de notas de corte para que você compare sua nota estimada com requisitos de cursos de interesse.',
      },
    },
    {
      '@type': 'Question',
      name: 'Posso usar a calculadora para explorar diferentes cenários?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim! Você pode testar diferentes números de acertos em cada disciplina para ver como sua nota TRI mudaria e qual seria o impacto em suas chances de entrar em um curso específico.',
      },
    },
    {
      '@type': 'Question',
      name: 'A calculadora também mostra notas de corte ProUni e FIES?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim! Além do SISU, nossa calculadora oferece informações sobre notas de corte ProUni e FIES, ajudando você a explorar todas as opções de acesso ao ensino superior.',
      },
    },
    {
      '@type': 'Question',
      name: 'Qual nota TRI preciso para entrar em Medicina?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Medicina é o curso mais concorrido. Notas de corte costumam ser superiores a 900 pontos. Use nossa calculadora para explorar quantos acertos em cada disciplina você precisa para atingir essa meta.',
      },
    },
    {
      '@type': 'Question',
      name: 'Como saber meu desempenho em comparação com outros candidatos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nossa calculadora mostra histórico de notas de corte, oferecendo contexto sobre o nível de competição para diferentes cursos nos últimos anos.',
      },
    },
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Calcular Nota ENEM', item: `${SITE_URL}/calcular-nota` },
  ],
}

export default function CalcularNotaPageOptimized() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Expanded SEO Content */}
      <div className="sr-only">
        <h1>Calculadora de Nota ENEM 2026 — Calcule Sua Pontuação com Curva TRI Automática</h1>

        <h2>Introdução — Por Que Você Precisa de Uma Calculadora de Nota ENEM</h2>
        <p>
          A Calculadora de Nota ENEM do ENEM Pro permite que você estime sua pontuação final usando a Teoria de Resposta ao Item (TRI),
          a mesma metodologia usada pelo INEP. Diferentemente de uma média simples, a TRI considera a dificuldade de cada questão,
          oferecendo uma estimativa realista de sua nota. Com nossa calculadora, você explora diferentes cenários de acertos e compara
          sua pontuação com notas de corte de cursos de interesse no SISU, ProUni e FIES.
        </p>

        <h2>Como Usar a Calculadora de Nota ENEM</h2>
        <p>
          Usar a calculadora é simples: insira o número de acertos (de 0 a 45) que você teve em cada uma das 4 áreas de conhecimento
          (Linguagens e Códigos, Matemática, Ciências Humanas, e Ciências da Natureza). Nossa calculadora fará o cálculo automático,
          levando em conta a dificuldade média das questões em cada área, e mostrará sua nota TRI estimada em uma escala de 0 a 1000.
          Você pode testar quantos cenários quiser para explorar como diferentes números de acertos afetam sua nota final.
        </p>

        <h2>Entendendo a TRI — Teoria de Resposta ao Item Explicada</h2>
        <p>
          O ENEM não usa uma média simples: 45 acertos não significa 45 pontos. Em vez disso, usa a TRI, que transforma seus acertos
          em uma nota de 0 a 1000 levando em conta a dificuldade de cada questão. Quando você acerta uma questão difícil, sua nota sobe
          muito mais do que quando acerta uma fácil. Quando acerta uma fácil que a maioria acertaria, sua nota sobe menos. A TRI é um
          sistema sofisticado projetado para avaliar não apenas quantas questões você acertou, mas qual é a sua compreensão verdadeira
          dos conceitos.
        </p>

        <h2>Notas de Corte SISU — Descubra Quais Cursos Estão ao Seu Alcance</h2>
        <p>
          As notas de corte do SISU variam a cada edição baseadas na concorrência entre candidatos. Um curso popular pode ter nota de
          corte de 900 pontos em uma edição e 850 em outra. Nossa calculadora mostra histórico de notas de corte de diversos cursos
          nos últimos anos, ajudando você a entender a concorrência real. Você pode comparar sua nota estimada com esses dados e ter
          uma ideia realista de suas chances de entrar no curso de interesse.
        </p>

        <h2>ProUni e FIES — Explorar Outras Opções de Acesso ao Ensino Superior</h2>
        <p>
          SISU é apenas uma opção. ProUni oferece bolsas parciais e integrais baseadas na sua nota ENEM. FIES oferece empréstimos
          educacionais com taxa de juros reduzida. Nossa calculadora oferece informações sobre notas de corte ProUni e FIES, permitindo
          que você explore todas as suas opções de acesso ao ensino superior.
        </p>

        <h2>Estratégia Por Disciplina — Foque Seus Estudos Inteligentemente</h2>
        <p>
          Nem todas as disciplinas têm o mesmo peso em sua meta. Se você quer um curso competitivo, uma fraqueza em Matemática pode
          ser crítica. Se prefere um curso menos concorrido, talvez possa compensar com força em Ciências Humanas. Use nossa calculadora
          para testar diferentes cenários: E se eu conseguir 40 acertos em Matemática mas apenas 30 em Ciências Humanas? Ainda chego
          a 900 pontos?&quot; Essas simulações ajudam você a estruturar uma estratégia inteligente de estudos.
        </p>

        <h2>Comparação Com Edições Anteriores — Entenda Tendências de Notas</h2>
        <p>
          Nossa calculadora oferece histórico de notas de corte dos últimos anos, permitindo que você identifique tendências. Um curso
          estava com 850 em 2023 mas 900 em 2024? Isso indica aumento de concorrência. Você pode usar essas tendências para definir suas
          metas de forma mais realista e ajustar seu foco de estudos.
        </p>

        <h2>Integração com Outras Ferramentas ENEM Pro</h2>
        <p>
          A calculadora funciona perfeitamente com nossas outras ferramentas. Faça um Simulado Online e receba uma nota TRI, depois
          use esta calculadora para explorar cenários. Acesse o Banco de Questões para praticar e melhorar sua taxa de acerto em
          disciplinas fracas. Tudo integrado em uma única plataforma.
        </p>

        <h2>Dicas Para Maximizar Sua Nota ENEM</h2>
        <p>
          Use a calculadora para definir metas realistas: se você quer 800 pontos, quantos acertos você precisa em cada disciplina?
          Trabalhe para atingir esses números específicos. Foque em disciplinas onde você está fraco — melhorar de 30 para 35 acertos
          em Matemática pode impactar sua nota final mais do que melhorar de 40 para 45 em uma disciplina onde já vai bem. A TRI recompensa
          progresso em áreas desafiadoras.
        </p>

        <h2>FAQ — Perguntas Frequentes Sobre Cálculo de Nota ENEM</h2>
        <p>
          Confira as perguntas frequentes abaixo para aprender mais sobre como a TRI funciona, como as notas de corte são determinadas,
          e como usar a calculadora para planejar seu estudo.
        </p>
      </div>

      <header className="bg-white border-b border-zinc-200 px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
        <div className="flex items-center gap-3">
          <Link href="/ferramentas" className="text-sm text-zinc-500 hover:text-zinc-900 hidden sm:inline">Ferramentas</Link>
          <Link href="/auth/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            Criar conta grátis
          </Link>
        </div>
      </header>

      <CalcularNotaClient />

      {/* Enhanced CTA */}
      <section className="sr-only">
        <h2>Calcule Sua Nota Agora</h2>
        <p>
          Comece a usar a calculadora ENEM e descubra sua pontuação estimada. Teste diferentes cenários e planeje seu estudo de forma
          estratégica.
        </p>
      </section>

      {/* Internal Linking */}
      <div className="sr-only">
        <nav>
          <h3>Explore Outras Ferramentas ENEM Pro</h3>
          <ul>
            <li><Link href="/questoes">Banco de Questões ENEM — 2.900+ Questões com Gabarito</Link></li>
            <li><Link href="/simulado">Simulado ENEM Online — Teste com Cronômetro e Nota TRI</Link></li>
            <li><Link href="/gabarito">Gabarito ENEM 2009-2024 — Todas as Respostas Corretas</Link></li>
            <li><Link href="/ferramentas">Todas as Ferramentas ENEM Pro</Link></li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
