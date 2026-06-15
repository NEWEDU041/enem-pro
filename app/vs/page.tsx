import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'ENEM Pro vs Concorrentes — Comparativos Completos 2026',
  description: 'Compare o ENEM Pro com Descomplica, Stoodi, Me Salva, Khan Academy, Poliedro e outras plataformas. Preços, funcionalidades e qual prepara melhor para o ENEM 2026.',
  alternates: { canonical: `${SITE_URL}/vs` },
  openGraph: {
    title: 'ENEM Pro vs Concorrentes 2026',
    description: 'Comparativos honestos: ENEM Pro vs as principais plataformas de preparação para o ENEM.',
  },
}

const COMPETITORS = [
  {
    slug: 'descomplica',
    name: 'Descomplica',
    price: 'R$39–79/mês',
    focus: 'Videoaulas',
    diff: '3–5× mais caro, sem questões INEP reais',
  },
  {
    slug: 'stoodi',
    name: 'Stoodi',
    price: 'R$39/mês',
    focus: 'Plano de estudos + videoaulas',
    diff: '2,6× mais caro, questões genéricas',
  },
  {
    slug: 'me-salva',
    name: 'Me Salva!',
    price: 'R$29–49/mês',
    focus: 'Videoaulas didáticas',
    diff: '2–3× mais caro, sem IA por questão',
  },
  {
    slug: 'khan-academy',
    name: 'Khan Academy',
    price: 'Gratuito',
    focus: 'Conteúdo educacional',
    diff: 'Questões americanas — não são provas INEP reais',
  },
  {
    slug: 'estuda-com',
    name: 'Estuda.com',
    price: 'Pago',
    focus: 'Banco de questões',
    diff: 'Sem IA, sem revisão automática de erros',
  },
  {
    slug: 'poliedro',
    name: 'Sistema Poliedro',
    price: 'R$79–129/mês',
    focus: 'Vestibulares premium + ENEM',
    diff: '5–9× mais caro, material impresso, não focado no INEP',
  },
  {
    slug: 'gauss',
    name: 'Gauss Educação',
    price: 'R$29–59/mês',
    focus: 'Banco de questões + desempenho',
    diff: '2–4× mais caro, sem IA personalizada',
  },
  {
    slug: 'prepara-enem',
    name: 'Prepara ENEM',
    price: 'R$19–39/mês',
    focus: 'App mobile + simulados rápidos',
    diff: 'Sem IA por questão, banco incompleto',
  },
  {
    slug: 'estrategia',
    name: 'Estratégia Vestibulares',
    price: 'R$39–89/mês',
    focus: 'Videoaulas + simulados + ENEM',
    diff: '2,6–6× mais caro, sem questões INEP reais',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'ENEM Pro vs Concorrentes',
  description: 'Comparativos entre ENEM Pro e as principais plataformas de preparação para o ENEM',
  url: `${SITE_URL}/vs`,
  itemListElement: COMPETITORS.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: `ENEM Pro vs ${c.name}`,
    url: `${SITE_URL}/vs/${c.slug}`,
  })),
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Comparativos', item: `${SITE_URL}/vs` },
  ],
}

export default function VsIndexPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <header className="bg-white border-b border-zinc-200 px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
        <Link href="/auth/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          Começar grátis
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <nav className="text-xs text-zinc-500 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-indigo-600">Início</Link>
          <span>/</span>
          <span className="text-zinc-900 font-medium">Comparativos</span>
        </nav>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-zinc-900 mb-3">ENEM Pro vs Concorrentes</h1>
          <p className="text-zinc-600 max-w-xl mx-auto">
            Compare o ENEM Pro com as principais plataformas de preparação. Preços, funcionalidades e qual escolher para o ENEM 2026.
          </p>
        </div>

        {/* Destaque ENEM Pro */}
        <div className="bg-indigo-600 text-white rounded-2xl p-6 mb-8 text-center">
          <p className="text-sm font-medium opacity-80 mb-1">ENEM Pro</p>
          <p className="text-3xl font-bold mb-1">R$14,90<span className="text-lg font-normal opacity-70">/mês</span></p>
          <p className="text-xs opacity-70 mb-4">ou R$99/ano (45% off) · 10 questões/dia grátis</p>
          <div className="flex flex-wrap gap-2 justify-center text-xs">
            {[
              'Questões INEP reais 2009–2024',
              'IA explica cada erro',
              'Revisão automática',
              'Gabarito histórico',
              'Calculadora TRI',
            ].map(f => (
              <span key={f} className="bg-white/20 px-3 py-1 rounded-full">{f}</span>
            ))}
          </div>
        </div>

        {/* Grid de comparativos */}
        <div className="space-y-3 mb-12">
          {COMPETITORS.map(c => (
            <Link
              key={c.slug}
              href={`/vs/${c.slug}`}
              className="block bg-white border border-zinc-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                      ENEM Pro vs {c.name}
                    </h2>
                    <span className="text-xs text-zinc-400 font-medium">{c.price}</span>
                  </div>
                  <p className="text-sm text-zinc-500 mb-1">{c.focus}</p>
                  <p className="text-xs text-rose-600">{c.diff}</p>
                </div>
                <span className="text-zinc-300 group-hover:text-indigo-400 transition-colors text-lg shrink-0">→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-8 text-center">
          <p className="text-xl font-bold text-indigo-900 mb-2">
            Teste grátis — sem cartão de crédito
          </p>
          <p className="text-indigo-700 text-sm mb-6">
            10 questões reais do ENEM por dia. IA explica cada erro.<br />
            Cancele quando quiser.
          </p>
          <Link
            href="/auth/register"
            className="inline-block bg-indigo-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-indigo-700 text-lg"
          >
            Criar conta grátis →
          </Link>
        </div>
      </main>
    </div>
  )
}
