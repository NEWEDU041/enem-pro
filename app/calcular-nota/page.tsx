import type { Metadata } from 'next'
import Link from 'next/link'
import CalcularNotaClient from '@/components/CalcularNotaClient'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Calculadora de Nota ENEM 2026 — Estimativa TRI por Área | ENEM Pro',
  description: 'Calcule sua nota estimada no ENEM com base nos acertos por área. Usa a curva TRI e compara com notas de corte do SISU para Medicina, Direito, Engenharia e mais.',
  alternates: { canonical: `${SITE_URL}/calcular-nota` },
  openGraph: {
    title: 'Calculadora de Nota ENEM 2026 — Estimativa TRI',
    description: 'Descubra sua nota estimada no ENEM. Compare com notas de corte do SISU.',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Calculadora de Nota ENEM',
  description: 'Calculadora interativa de nota ENEM com estimativa TRI por área',
  url: `${SITE_URL}/calcular-nota`,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
}

export default function CalcularNotaPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
