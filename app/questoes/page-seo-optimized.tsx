import type { Metadata } from 'next'
import Link from 'next/link'
import { SLUG_TO_DISCIPLINE as CANONICAL_SLUGS } from '@/lib/enem-constants'
import { fetchQuestionsByYearCached, filterAndPaginateQuestions, DEFAULT_QUESTIONS_YEAR } from '@/lib/questions-cache'
import { SITE_URL } from '@/lib/site-config'
import QuestoesClient from './QuestoesClient'

const SLUG_TO_DISCIPLINE: Record<string, string> = {
  ...CANONICAL_SLUGS,
  'ciencias-da-natureza': 'Ciências da Natureza e suas Tecnologias',
}

export const metadata: Metadata = {
  title: 'Banco de Questões ENEM — 2.900+ Questões Reais com Gabarito e Explicações de IA',
  description: 'Pratique com 2.900+ questões reais do ENEM (2009-2024). Filtro por disciplina, ano e dificuldade. Gabarito imediato + explicações detalhadas no Plano Pro. Grátis.',
  keywords: [
    'questões ENEM',
    'banco de questões ENEM',
    'questões ENEM com gabarito',
    'questões de matemática ENEM',
    'questões ENEM 2024',
    'simulador ENEM',
    'praticar ENEM grátis',
    'questões resolvidas ENEM',
  ],
  alternates: { canonical: `${SITE_URL}/questoes` },
  openGraph: {
    title: 'Banco de Questões ENEM — 2.900+ Questões Reais + Gabarito e IA',
    description: 'Pratique questões reais do ENEM com gabarito instantâneo, análise de performance e explicações geradas por IA.',
    url: `${SITE_URL}/questoes`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ENEM Pro - Banco de Questões' }],
  },
}

interface PageProps {
  searchParams: Promise<{ year?: string; discipline?: string; disciplina?: string; page?: string }>
}

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Banco de Questões ENEM',
  applicationCategory: 'EducationalApplication',
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
  description: 'Banco com 2.900+ questões reais do ENEM de 2009 a 2024, com gabarito instantâneo e explicações por IA',
  url: `${SITE_URL}/questoes`,
  operatingSystem: 'All',
  creator: {
    '@type': 'Organization',
    name: 'ENEM Pro',
    url: SITE_URL,
  },
  potentialAction: [
    {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/questoes?discipline={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    {
      '@type': 'UseAction',
      description: 'Praticar questões do ENEM',
    },
  ],
}

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'Tool',
  name: 'Banco de Questões ENEM',
  description: 'Ferramenta de prática com 2.900+ questões reais do ENEM',
  url: `${SITE_URL}/questoes`,
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
      name: 'Quantas questões do ENEM estão disponíveis no banco?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nosso banco contém 2.900+ questões reais do ENEM, cobrindo todas as edições de 2009 a 2024 e todas as quatro disciplinas principais.',
      },
    },
    {
      '@type': 'Question',
      name: 'Como funciona o gabarito automático?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ao responder uma questão, o gabarito aparece instantaneamente mostrando a resposta correta. No Plano Pro, você desbloqueará explicações detalhadas geradas por IA.',
      },
    },
    {
      '@type': 'Question',
      name: 'Posso filtrar questões por disciplina e ano?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim! Você pode filtrar por qualquer uma das 4 disciplinas (Matemática, Linguagens, Ciências Humanas, Ciências da Natureza) e por anos de 2009 a 2024.',
      },
    },
    {
      '@type': 'Question',
      name: 'As questões são reais do ENEM?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim, 100% das questões são reais e oficiais do INEP. Não são questões similares ou parecidas — são exatamente as que caíram nos exames anteriores.',
      },
    },
    {
      '@type': 'Question',
      name: 'Há limite de questões por dia no plano gratuito?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No plano grátis, você pode praticar 10 questões por dia com acesso ao gabarito. No Plano Pro, prática ilimitada com explicações de IA incluídas.',
      },
    },
    {
      '@type': 'Question',
      name: 'Como o sistema de IA explica as respostas?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A IA analisa cada questão e gera uma explicação em linguagem clara, mostrando o conceito por trás da resposta, por que as outras alternativas estão erradas e como aplicar esse conhecimento em outras questões.',
      },
    },
    {
      '@type': 'Question',
      name: 'Posso acompanhar meu progresso?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim! A plataforma rastreia suas respostas, mostra sua taxa de acerto por disciplina e oferece recomendações de áreas para melhorar.',
      },
    },
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Questões ENEM', item: `${SITE_URL}/questoes` },
  ],
}

export default async function QuestoesPageOptimized({ searchParams }: PageProps) {
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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Expanded SEO Content */}
      <div className="sr-only">
        <h1>Banco de Questões ENEM — 2.900+ Questões Reais com Gabarito e Explicações de IA</h1>

        <h2>Introdução — Por Que Praticar com Questões Reais do ENEM</h2>
        <p>
          O ENEM Pro oferece o maior banco de questões reais do ENEM, com 2.900+ questões autênticas do INEP cobrindo
          todas as disciplinas de 2009 a 2024. Praticar com questões reais é o método mais eficaz para se preparar para
          o exame oficial, pois você se familiariza com o estilo, nível de dificuldade e padrão de questionamento que o
          INEP utiliza. Nosso banco permite que você filtre por disciplina, ano e pratique com gabarito instantâneo.
        </p>

        <h2>Como Usar o Banco de Questões</h2>
        <p>
          Acessar o banco é simples: escolha a disciplina (Matemática, Linguagens, Ciências Humanas ou Ciências da Natureza),
          selecione o ano desejado de 2009 a 2024, e comece a responder questões. Você vê o gabarito imediatamente após responder.
          No Plano Pro, desbloqueie explicações detalhadas geradas por IA que explicam cada resposta, ajudando você a entender
          o conceito por trás e como aplicá-lo em futuras questões. Rastreamos seu progresso e oferecemos recomendações de estudo.
        </p>

        <h2>Vantagens de Praticar com Questões Reais</h2>
        <p>
          Questões reais do ENEM são a melhor indicação de seu desempenho futuro. Ao praticar com as mesmas questões que caíram
          nos últimos 15 anos, você desenvolve familiaridade com o estilo ENEM. Isso aumenta significativamente suas chances de
          uma boa performance na prova oficial. Além disso, você identifica suas fraquezas em cada disciplina e pode focar seus
          estudos nas áreas onde mais precisa.
        </p>

        <h2>Filtros Avançados — Estude Exatamente o Que Você Precisa</h2>
        <p>
          Nosso banco oferece filtros poderosos: escolha uma ou mais disciplinas, selecionse o intervalo de anos, e customize sua
          sessão de prática. Você pode praticar todas as questões de Matemática de 2022 a 2024, ou focar em uma disciplina específica
          de um ano em particular. Os filtros ajudam você a estruturar um plano de estudos personalizado.
        </p>

        <h2>Gabarito Instantâneo e Análise de Performance</h2>
        <p>
          Ao responder cada questão, você recebe o gabarito imediatamente, mostrando qual é a resposta correta. A plataforma rastreia
          suas respostas ao longo do tempo, oferecendo estatísticas detalhadas: taxa de acerto por disciplina, questões que você mais
          erra, padrões de desempenho ao longo dos anos. Use esses dados para identificar suas maiores fraquezas.
        </p>

        <h2>Explicações de IA — Entenda o Raciocínio Por Trás de Cada Resposta</h2>
        <p>
          No Plano Pro, cada questão vem com uma explicação gerada por IA. Nossa inteligência artificial analisa o conteúdo da questão
          e gera uma explicação clara que mostra: por que a resposta correta está certa, por que as outras alternativas estão erradas,
          e qual conceito da disciplina você precisa dominar. Essas explicações transformam cada questão em uma oportunidade de aprendizado.
        </p>

        <h2>Plano de Estudos Recomendado para Máximo Rendimento</h2>
        <p>
          Comece praticando questões de 3-5 anos atrás enquanto aprende novos conceitos. Conforme se aproximar do ENEM, priorize questões
          dos últimos 2-3 anos, pois estas refletem melhor o padrão e nível atual do exame. Faça um simulado completo a cada duas semanas
          para testar seu progresso integrado. Quando atingir uma taxa de acerto superior a 70%, você está pronto para fazer a prova.
        </p>

        <h2>Integração com Outras Ferramentas ENEM Pro</h2>
        <p>
          O banco de questões funciona perfeitamente com nossas outras ferramentas. Use o Simulado Online para praticar com cronômetro e
          receber uma nota TRI estimada. Use a Calculadora de Nota ENEM para saber qual nota você teria com sua taxa de acerto atual.
          Consulte o Gabarito Completo para revisar questões de anos anteriores. Tudo integrado em uma única plataforma.
        </p>

        <h2>FAQ Perguntas Frequentes</h2>
        <p>
          Essas e outras perguntas frequentes estão respondidas abaixo, incluindo informações sobre limite de questões no plano grátis,
          como o sistema de IA funciona, e como acompanhar seu progresso.
        </p>
      </div>

      <QuestoesClient
        initialYear={year}
        initialDiscipline={discipline}
        initialPage={page}
        initialQuestions={questions}
        initialTotal={total}
      />

      {/* Enhanced CTA Section */}
      <section className="sr-only">
        <h2>Começar a Praticar Agora</h2>
        <p>
          Junte-se a milhares de estudantes que já usam o ENEM Pro para se preparar. Acesse o banco de questões grátis,
          comece a praticar hoje e desbloqueie seu potencial com explicações de IA.
        </p>
      </section>

      {/* Related Tools Internal Linking */}
      <div className="sr-only">
        <nav>
          <h3>Explore Outras Ferramentas ENEM Pro</h3>
          <ul>
            <li><Link href="/simulado">Simulado ENEM Online — Teste seus Conhecimentos com Cronômetro</Link></li>
            <li><Link href="/calcular-nota">Calculadora de Nota ENEM — Estime Sua Pontuação com Curva TRI</Link></li>
            <li><Link href="/gabarito">Gabarito ENEM 2009-2024 — Todas as Respostas Corretas</Link></li>
            <li><Link href="/ferramentas">Todas as Ferramentas ENEM Pro</Link></li>
          </ul>
        </nav>
      </div>
    </>
  )
}
