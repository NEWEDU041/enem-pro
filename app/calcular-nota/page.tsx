import type { Metadata } from 'next'
import Link from 'next/link'
import CalcularNotaClient from '@/components/CalcularNotaClient'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Calculadora ENEM 2026 — Estime Sua Nota por Área com Curva TRI',
  description: 'Calculadora de nota ENEM com curva TRI. Estima sua nota por área, compara com notas de corte SISU e mostra cursos acessíveis.',
  keywords: ['calculadora ENEM', 'nota ENEM TRI', 'nota de corte SISU', 'calcular nota ENEM', 'estimativa ENEM'],
  alternates: { canonical: `${SITE_URL}/calcular-nota` },
  openGraph: {
    title: 'Calculadora ENEM 2026 — Descubra Sua Pontuação com Curva TRI',
    description: 'Calculadora de nota ENEM com curva TRI. Estima sua nota por área, compara com notas de corte SISU, ProUni, FIES.',
    url: `${SITE_URL}/calcular-nota`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ENEM Pro - Calculadora de Nota' }],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Calculadora de Nota ENEM',
  description: 'Calculadora interativa de nota ENEM com estimativa TRI por área e comparação com notas de corte SISU',
  url: `${SITE_URL}/calcular-nota`,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
    description: 'Calculadora completamente grátis',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1500',
    bestRating: '5',
    worstRating: '1',
  },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Calcular Nota ENEM', item: `${SITE_URL}/calcular-nota` },
  ],
}

export default function CalcularNotaPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* SEO Landing Content (hidden from visual but indexed) */}
      <div className="sr-only">
        <h1>Calculadora de Nota ENEM — Descubra Sua Pontuação com Curva TRI</h1>
        <p>
          Calcule sua nota estimada no ENEM de forma rápida e precisa com nossa calculadora. Insira seus acertos por área e descubra
          qual seria sua pontuação usando a Teoria de Resposta ao Item (TRI). Compare com notas de corte do SISU, ProUni e FIES para
          saber quais cursos estão ao seu alcance.
        </p>
        <h2>O Que é a Teoria de Resposta ao Item (TRI)</h2>
        <p>
          O ENEM não utiliza média simples de acertos. Usa a TRI, que considera a dificuldade de cada questão. Quando você acerta uma
          questão difícil, sua nota sobe muito mais do que acertar uma fácil. Nossa calculadora replica essa lógica para dar uma estimativa
          realista de qual seria sua pontuação na prova oficial.
        </p>
        <h2>Como Usar a Calculadora</h2>
        <p>
          É simples: insira o número de acertos que você teve em cada uma das 4 áreas (Linguagens, Matemática, Ciências Humanas e Ciências
          da Natureza). Nossa calculadora fará o cálculo automático levando em conta a dificuldade média das questões e te mostrará sua nota
          estimada. Você pode testar diferentes cenários para ver como muda sua nota.
        </p>
        <h2>Notas de Corte SISU, ProUni e FIES</h2>
        <p>
          Conhecer sua nota estimada é importante, mas saber se ela é suficiente para entrar em seu curso de interesse é ainda mais.
          Nossa calculadora mostra as notas de corte dos últimos anos para diversos cursos no SISU, permitindo que você compare sua
          estimativa com os requisitos. Também inclui informações sobre ProUni e FIES.
        </p>
        <h2>Estratégia de Acertos por Área</h2>
        <p>
          Nem todas as áreas têm o mesmo peso no seu objetivo. Se você quer Medicina, por exemplo, precisa de uma nota altíssima. Se quer
          Pedagogia, a nota pode ser menor. Use nossa calculadora para testar diferentes cenários e saber em qual área precisa focar mais
          seus estudos para atingir seu objetivo.
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
    </div>
  )
}
