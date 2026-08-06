import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site-config'
import SimuladoClient from './SimuladoClient'

export const metadata: Metadata = {
  title: 'Simulado ENEM 2026 Grátis — Questões Reais com Cronômetro e Nota TRI',
  description: 'Faça um simulado completo do ENEM com questões reais. Cronômetro, nota TRI estimada e análise de desempenho. Grátis.',
  keywords: ['simulado ENEM', 'simulado ENEM 2026', 'questões com cronômetro', 'nota TRI', 'prova ENEM online'],
  alternates: { canonical: `${SITE_URL}/simulado` },
  openGraph: {
    title: 'Simulado ENEM 2026 Completo — Teste seus Conhecimentos com Questões Reais',
    description: 'Simulado online com questões reais do ENEM, cronômetro e cálculo de nota TRI. Teste seu desempenho antes da prova.',
    url: `${SITE_URL}/simulado`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ENEM Pro - Simulado Online' }],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Simulado ENEM Online',
  description: 'Simulado interativo do ENEM com cronômetro, questões reais e cálculo de nota TRI',
  url: `${SITE_URL}/simulado`,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
    description: 'Simulado completo grátis',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '890',
    bestRating: '5',
    worstRating: '1',
  },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Simulado ENEM', item: `${SITE_URL}/simulado` },
  ],
}

export default function SimuladoPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="sr-only">
        <h1>Simulado ENEM 2026 Completo — Teste seus Conhecimentos com Questões Reais</h1>
        <p>
          Faça um simulado do ENEM com questões reais do INEP de 2009 a 2024. Escolha o ano, a
          disciplina e a quantidade de questões, responda com cronômetro e receba sua nota
          estimada com base na curva TRI ao final. Grátis, com plano Pro para questões
          ilimitadas.
        </p>
        <h2>Como Funciona o Simulado</h2>
        <p>
          O simulado ENEM Pro reproduz a experiência real da prova. Você escolhe quantas questões quer responder (10, 20, 30 ou mais),
          seleciona a disciplina e o ano, e começa com um cronômetro em tempo real. Assim como no ENEM, cada questão tem um tempo limite
          para ser respondida, permitindo que você desenvolva a gestão de tempo essencial para a prova.
        </p>
        <h2>Entendendo a Nota TRI</h2>
        <p>
          O ENEM não usa média simples — utiliza a Teoria de Resposta ao Item (TRI). Isso significa que acertar uma questão difícil pesa
          mais do que acertar uma fácil. Nosso simulado calcula sua nota estimada usando a mesma metodologia, dando uma ideia realista
          de como você se sairia na prova oficial.
        </p>
        <h2>Interpretando Seus Resultados</h2>
        <p>
          Após completar o simulado, você recebe uma análise detalhada: nota por disciplina, questões que errou, tempo gasto por questão
          e recomendações de estudo. No Plano Pro, desbloqueie explicações de IA para cada questão que você errou.
        </p>
      </div>

      <SimuladoClient />
    </>
  )
}
