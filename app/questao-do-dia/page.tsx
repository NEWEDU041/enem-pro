import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import DemoQuestion from '@/components/DemoQuestion'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Questão do Dia ENEM 2026 — Pratique Grátis Todo Dia',
  description: 'Uma questão nova do ENEM todo dia, rotacionando entre Matemática, Humanas, Linguagens e Ciências da Natureza. Veja o gabarito e treine a consistência.',
  alternates: { canonical: `${SITE_URL}/questao-do-dia` },
  openGraph: {
    title: 'Questão do Dia ENEM — Nova Questão Todo Dia',
    description: 'Pratique uma questão real do ENEM por dia. Grátis, sem cadastro.',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Quiz',
  name: 'Questão do Dia ENEM',
  description: 'Questão diária rotativa do ENEM com gabarito',
  url: `${SITE_URL}/questao-do-dia`,
  provider: { '@type': 'Organization', name: 'ENEM Pro' },
  educationalLevel: 'Ensino Médio',
  inLanguage: 'pt-BR',
}

export default function QuestaoDoDialPage() {
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

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-3">Questão do Dia — ENEM 2026</h1>
          <p className="text-zinc-600">
            Uma questão nova todo dia, alternando entre as 4 disciplinas do ENEM. Responda, veja o gabarito e continue amanhã.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
          <Suspense fallback={
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-40 bg-zinc-100 rounded" />
              <div className="h-20 bg-zinc-100 rounded-xl" />
              {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-zinc-100 rounded-xl" />)}
            </div>
          }>
            <DemoQuestion />
          </Suspense>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-6">
          <h2 className="font-bold text-zinc-900 mb-3">Por que praticar todo dia?</h2>
          <div className="space-y-2 text-sm text-zinc-600">
            <p><strong>Consistência {'>'} Intensidade.</strong> 1 questão por dia durante 6 meses = 180 questões. Um fim de semana de maratona dificilmente chega a isso — e a retenção é muito menor.</p>
            <p>A questão do dia alterna entre as 4 disciplinas automaticamente, garantindo que você não negligencie nenhuma área ao longo do tempo.</p>
            <p>Criar uma conta grátis dá acesso a <strong>10 questões por dia</strong> com registro de desempenho, modo revisão e explicação de IA para cada erro.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          <Link href="/simulado" className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-indigo-300 transition-all">
            <p className="font-semibold text-zinc-900 mb-1">📝 Simulado completo</p>
            <p className="text-xs text-zinc-500">10, 20 ou 45 questões por sessão com timer</p>
          </Link>
          <Link href="/calcular-nota" className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-indigo-300 transition-all">
            <p className="font-semibold text-zinc-900 mb-1">🧮 Calcular nota</p>
            <p className="text-xs text-zinc-500">Estime sua nota com a curva TRI por área</p>
          </Link>
          <Link href="/cronograma" className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-indigo-300 transition-all">
            <p className="font-semibold text-zinc-900 mb-1">📅 Cronograma</p>
            <p className="text-xs text-zinc-500">Monte seu plano de estudos semanal</p>
          </Link>
          <Link href="/temas-redacao" className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-indigo-300 transition-all">
            <p className="font-semibold text-zinc-900 mb-1">✍️ Temas de Redação</p>
            <p className="text-xs text-zinc-500">Histórico completo de temas 2009–2024</p>
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 text-sm justify-center">
          <Link href="/questoes" className="text-indigo-600 hover:underline">Questões por ano →</Link>
          <Link href="/gabarito" className="text-indigo-600 hover:underline">Gabarito ENEM →</Link>
          <Link href="/ferramentas" className="text-indigo-600 hover:underline">Todas as ferramentas →</Link>
        </div>
      </main>
    </div>
  )
}
