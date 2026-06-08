import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Competitor = {
  name: string
  price: string
  slug: string
  desc: string
  focus: string
  cons: string[]
  pros: string[]
}

const COMPETITORS: Record<string, Competitor> = {
  descomplica: {
    name: 'Descomplica',
    slug: 'descomplica',
    price: 'R$39–79/mês',
    desc: 'Plataforma focada em videoaulas para ENEM e vestibulares. Um dos maiores players do mercado.',
    focus: 'Videoaulas + cursos gravados',
    cons: [
      'Custo 3–5× maior que o ENEM Pro',
      'Foco em videoaulas — você assiste, não pratica',
      'Sem banco de questões INEP reais integrado',
      'Sem explicação de IA por questão específica',
      'Sem modo revisão de erros automático',
    ],
    pros: [
      'Grande biblioteca de videoaulas',
      'Marca reconhecida',
      'Professores especializados por matéria',
    ],
  },
  stoodi: {
    name: 'Stoodi',
    slug: 'stoodi',
    price: 'R$39/mês',
    desc: 'Plataforma com plano de estudos, exercícios e correção de redação para ENEM.',
    focus: 'Plano de estudos + videoaulas',
    cons: [
      'Custo 2,6× maior que o ENEM Pro',
      'Questões genéricas — não exclusivamente da prova INEP',
      'Sem explicação de IA personalizada por questão',
      'Redação corrigida por IA genérica',
      'Sem gabarito interativo com anos históricos',
    ],
    pros: [
      'Plano de estudos estruturado',
      'Correção de redação incluída',
      'Interface moderna',
    ],
  },
  'estuda-com': {
    name: 'Estuda.com',
    slug: 'estuda-com',
    price: 'Pago',
    desc: 'Plataforma com foco em banco de questões de concursos e ENEM.',
    focus: 'Banco de questões (200K+)',
    cons: [
      'Interface menos moderna',
      'Sem explicação de IA por questão',
      'Sem modo revisão automático de erros',
      'Sem cronograma personalizado',
      'Focado em quantidade, não em aprendizado',
    ],
    pros: [
      'Grande banco de questões (200K+)',
      'Cobre além do ENEM (concursos)',
      'Histórico longo na plataforma',
    ],
  },
}

export async function generateStaticParams() {
  return Object.keys(COMPETITORS).map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const c = COMPETITORS[slug]
  if (!c) return {}
  return {
    title: `ENEM Pro vs ${c.name} — Qual é Melhor para o ENEM 2026?`,
    description: `Compare ENEM Pro e ${c.name}: preço, questões INEP, IA e funcionalidades. Veja qual plataforma prepara melhor para o ENEM 2026 pelo menor custo.`,
    alternates: { canonical: `https://enem-pro-eight.vercel.app/vs/${slug}` },
  }
}

const ENEM_PRO_PROS = [
  'Questões oficiais INEP (2009–2024) — as mesmas da prova real',
  'IA explica o raciocínio de cada questão errada',
  'Modo revisão automático de erros por disciplina',
  'Gabarito histórico por ano e disciplina',
  'Calculadora de nota TRI interativa',
  'Cronograma personalizado por prioridade',
  'Push notification — lembrete diário de estudo',
  'R$14,90/mês ou R$99/ano — 6× mais barato',
  '10 questões/dia grátis — sem cartão',
]

export default async function VsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = COMPETITORS[slug]
  if (!c) notFound()

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
        <Link href="/auth/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          Começar grátis
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <p className="text-sm text-zinc-500 mb-2">Comparativo</p>
          <h1 className="text-3xl font-bold text-zinc-900 mb-3">ENEM Pro vs {c.name}</h1>
          <p className="text-zinc-600">{c.desc}</p>
        </div>

        {/* Preço em destaque */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-indigo-600 text-white rounded-2xl p-6 text-center">
            <p className="text-sm font-medium opacity-80 mb-2">ENEM Pro</p>
            <p className="text-3xl font-bold mb-1">R$14,90<span className="text-lg font-normal opacity-70">/mês</span></p>
            <p className="text-xs opacity-70">ou R$99/ano (45% off)</p>
            <p className="text-xs mt-2 opacity-80">10 questões/dia grátis</p>
          </div>
          <div className="bg-zinc-200 text-zinc-700 rounded-2xl p-6 text-center">
            <p className="text-sm font-medium mb-2">{c.name}</p>
            <p className="text-3xl font-bold mb-1">{c.price}</p>
            <p className="text-xs text-zinc-500 mt-2">{c.focus}</p>
          </div>
        </div>

        {/* Tabela comparativa */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 font-semibold text-zinc-700">Funcionalidade</th>
                <th className="text-center px-4 py-3 font-semibold text-indigo-600">ENEM Pro</th>
                <th className="text-center px-4 py-3 font-semibold text-zinc-500">{c.name}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {[
                ['Questões INEP reais (2009–2024)', true, false],
                ['IA explica cada questão errada', true, false],
                ['Modo revisão de erros automático', true, false],
                ['Gabarito histórico por ano', true, false],
                ['Calculadora nota TRI', true, false],
                ['Cronograma personalizado', true, false],
                ['Gratuito parcialmente', true, false],
                ['Preço mensal acessível', true, false],
              ].map(([label, enem, comp]) => (
                <tr key={String(label)} className="hover:bg-zinc-50">
                  <td className="px-5 py-3 text-zinc-700">{label}</td>
                  <td className="text-center px-4 py-3">
                    {enem ? <span className="text-green-500 font-bold">✓</span> : <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="text-center px-4 py-3">
                    {comp ? <span className="text-green-500 font-bold">✓</span> : <span className="text-zinc-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <h2 className="font-bold text-indigo-700 mb-3">✓ Por que escolher o ENEM Pro</h2>
            <ul className="space-y-2">
              {ENEM_PRO_PROS.map(p => (
                <li key={p} className="flex items-start gap-2 text-sm text-zinc-700">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <h2 className="font-bold text-zinc-700 mb-3">⚠️ {c.name} — limitações</h2>
            <ul className="space-y-2">
              {c.cons.map(p => (
                <li key={p} className="flex items-start gap-2 text-sm text-zinc-600">
                  <span className="text-zinc-400 mt-0.5 shrink-0">✗</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <h3 className="font-semibold text-zinc-600 mt-4 mb-2 text-sm">O que o {c.name} faz bem:</h3>
            <ul className="space-y-1">
              {c.pros.map(p => (
                <li key={p} className="text-sm text-zinc-500 flex items-start gap-2">
                  <span className="text-zinc-400 shrink-0">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-8 text-center mb-8">
          <p className="text-xl font-bold text-indigo-900 mb-2">
            Comece grátis — sem cartão de crédito
          </p>
          <p className="text-indigo-700 text-sm mb-6">
            10 questões reais do ENEM por dia. Gabarito imediato. IA explica cada erro.<br />
            Assine Pro por <strong>R$14,90/mês</strong> quando quiser mais.
          </p>
          <Link href="/auth/register" className="inline-block bg-indigo-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-indigo-700 text-lg">
            Criar conta grátis →
          </Link>
          <p className="text-xs text-indigo-400 mt-3">Sem cartão. Sem compromisso.</p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/planos" className="text-indigo-600 hover:underline">Ver planos e preços →</Link>
          <Link href="/ferramentas" className="text-indigo-600 hover:underline">Ver todas as ferramentas →</Link>
          <Link href="/calcular-nota" className="text-indigo-600 hover:underline">Calcular nota ENEM →</Link>
        </div>
      </main>
    </div>
  )
}
