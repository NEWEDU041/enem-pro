import type { Metadata } from 'next'
import Link from 'next/link'
import { SLUG_TO_DISCIPLINE as CANONICAL_SLUGS } from '@/lib/enem-constants'
import { fetchQuestionsByYearCached, filterAndPaginateQuestions, DEFAULT_QUESTIONS_YEAR } from '@/lib/questions-cache'
import { SITE_URL } from '@/lib/site-config'
import QuestoesClient from './QuestoesClient'

// Accepts an older alternate slug spelling on incoming query params; outgoing
// links always use the canonical slug from disciplineToSlug().
const SLUG_TO_DISCIPLINE: Record<string, string> = {
  ...CANONICAL_SLUGS,
  'ciencias-da-natureza': 'Ciências da Natureza e suas Tecnologias',
}

export const metadata: Metadata = {
  title: 'Questões ENEM 2009-2024 — Pratique Grátis com 2.900+ Questões Reais',
  description: 'Pratique com 2.900+ questões reais do ENEM. Filtre por ano e disciplina, veja o gabarito e entenda cada resposta com IA. Grátis.',
  keywords: ['questões ENEM', 'banco de questões ENEM', 'questões de matemática ENEM', 'questões com gabarito', 'simulador ENEM', 'praticar ENEM'],
  alternates: { canonical: `${SITE_URL}/questoes` },
  openGraph: {
    title: 'Questões ENEM 2009-2024 — 2.900+ Questões Reais + Gabarito',
    description: 'Pratique questões reais do ENEM com gabarito e explicações geradas por IA. Filtro por disciplina e ano.',
    url: `${SITE_URL}/questoes`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ENEM Pro - Questões Reais' }],
  },
}

interface PageProps {
  searchParams: Promise<{ year?: string; discipline?: string; disciplina?: string; page?: string }>
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Banco de Questões ENEM',
  description: 'Banco com 2.900+ questões reais do ENEM de 2009 a 2024, filtráveis por disciplina e ano',
  url: `${SITE_URL}/questoes`,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
    description: 'Plano Grátis — 10 questões/dia com gabarito',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
    bestRating: '5',
    worstRating: '1',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/questoes?discipline={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Questões ENEM', item: `${SITE_URL}/questoes` },
  ],
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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* SEO Landing Content (hidden from visual but indexed) */}
      <div className="sr-only">
        <h1>Pratique com Questões Reais do ENEM — 2.900+ Questões de 2009 a 2024</h1>
        <p>
          O ENEM Pro oferece o maior banco de questões reais do ENEM, com 2.900+ questões cobrindo todas as disciplinas de 2009 a 2024.
          Filtre por ano e área, veja o gabarito imediato e aproveite explicações geradas por IA no Plano Pro para entender cada resposta.
        </p>
        <h2>O Que Você Encontra Aqui</h2>
        <p>
          No ENEM Pro você pratica com questões autênticas do INEP, o mesmo instituto que elabora o exame oficial.
          Todas as 2.900+ questões estão organizadas por disciplina e ano, permitindo que você estude exatamente o que cai no ENEM.
          Matemática, Linguagens, Ciências Humanas e Ciências da Natureza — tudo em um só lugar.
        </p>
        <h2>Como Usar a Ferramenta</h2>
        <p>
          É simples: acesse a ferramenta, escolha a disciplina (Matemática, Linguagens, Ciências Humanas ou Ciências da Natureza),
          selecione o ano de 2009 a 2024, e comece a responder. Cada questão mostra o gabarito imediato após você responder.
          No Plano Pro, você desbloqueará explicações detalhadas geradas por IA que explicam por que cada resposta está correta.
        </p>
        <h2>Por Que Praticar com Questões Reais</h2>
        <p>
          Questões reais do ENEM são o melhor indicador de desempenho. Ao praticar com as mesmas questões que caíram nos últimos 15 anos,
          você se acostuma com o estilo, dificuldade e tipos de questionamento que o INEP utiliza. Isso aumenta significativamente suas chances
          de desempenho na prova real.
        </p>
        <h2>Plano de Estudos Recomendado</h2>
        <p>
          Comece com questões de 3-5 anos atrás enquanto aprende. Conforme se aproximar do ENEM, prioritize questões dos últimos 2-3 anos,
          pois estas refletem melhor o padrão atual. Faça um simulado completo a cada duas semanas para testar seu progresso.
        </p>
      </div>

      <QuestoesClient
        initialYear={year}
        initialDiscipline={discipline}
        initialPage={page}
        initialQuestions={questions}
        initialTotal={total}
      />
    </>
  )
}
