import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Ferramentas ENEM 2026 — Calculadoras e Recursos Gratuitos',
  description: 'Ferramentas gratuitas para o ENEM: calculadora de nota TRI, simulado, cronograma de estudos, gabarito oficial, temas de redação e questão do dia.',
  alternates: { canonical: `${SITE_URL}/ferramentas` },
}

const FERRAMENTAS = [
  {
    icon: '🧮',
    title: 'Calculadora de Nota ENEM',
    desc: 'Insira seus acertos por área e descubra sua nota estimada com curva TRI. Compare com notas de corte do SISU.',
    href: '/calcular-nota',
    cta: 'Calcular nota',
    color: 'indigo',
    badge: 'Popular',
  },
  {
    icon: '📝',
    title: 'Simulado ENEM',
    desc: 'Faça um simulado com questões reais do ENEM. Escolha disciplina, ano e quantidade. Timer incluso.',
    href: '/simulado',
    cta: 'Fazer simulado',
    color: 'violet',
    badge: null,
  },
  {
    icon: '📅',
    title: 'Cronograma de Estudos',
    desc: 'Monte seu cronograma semanal personalizado. Defina dias disponíveis, quantidade de sessões e prioridades por disciplina.',
    href: '/cronograma',
    cta: 'Montar cronograma',
    color: 'emerald',
    badge: null,
  },
  {
    icon: '✅',
    title: 'Gabarito ENEM',
    desc: 'Gabarito oficial do ENEM de 2009 a 2024. Veja as respostas corretas por disciplina e ano.',
    href: '/gabarito',
    cta: 'Ver gabarito',
    color: 'amber',
    badge: null,
  },
  {
    icon: '✍️',
    title: 'Temas de Redação',
    desc: 'Todos os temas da redação ENEM de 2009 a 2024. Analise padrões e prepare sua redação para 2026.',
    href: '/temas-redacao',
    cta: 'Ver temas',
    color: 'rose',
    badge: null,
  },
  {
    icon: '❓',
    title: 'Questão do Dia',
    desc: 'Uma questão nova todo dia, rotacionando entre disciplinas e anos. Treine a consistência.',
    href: '/questao-do-dia',
    cta: 'Ver questão do dia',
    color: 'sky',
    badge: 'Novo',
  },
  {
    icon: '📚',
    title: 'Questões por Disciplina',
    desc: 'Pratique questões filtradas por disciplina (Matemática, Humanas, Natureza, Linguagens) e por ano.',
    href: '/questoes',
    cta: 'Praticar questões',
    color: 'zinc',
    badge: null,
  },
  {
    icon: '🔁',
    title: 'Modo Revisão',
    desc: 'Revise todas as questões que você errou, organizadas por disciplina. Disponível após criar conta.',
    href: '/revisao',
    cta: 'Revisar erros',
    color: 'red',
    badge: null,
  },
]

const MATERIAS = [
  { slug: 'fisica', name: 'Física', icon: '⚡' },
  { slug: 'quimica', name: 'Química', icon: '🧪' },
  { slug: 'biologia', name: 'Biologia', icon: '🧬' },
  { slug: 'historia', name: 'História', icon: '🏛️' },
  { slug: 'geografia', name: 'Geografia', icon: '🌎' },
  { slug: 'filosofia', name: 'Filosofia', icon: '🧠' },
  { slug: 'sociologia', name: 'Sociologia', icon: '👥' },
  { slug: 'portugues', name: 'Português', icon: '📝' },
  { slug: 'literatura', name: 'Literatura', icon: '📚' },
  { slug: 'matematica', name: 'Matemática', icon: '📐' },
  { slug: 'ingles', name: 'Inglês', icon: '🌐' },
]

const COLOR_BADGE: Record<string, string> = {
  indigo: 'bg-indigo-100 text-indigo-700',
  violet: 'bg-violet-100 text-violet-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  sky: 'bg-sky-100 text-sky-700',
  zinc: 'bg-zinc-100 text-zinc-700',
  red: 'bg-red-100 text-red-700',
}

const COLOR_BTN: Record<string, string> = {
  indigo: 'text-indigo-600 hover:text-indigo-800',
  violet: 'text-violet-600 hover:text-violet-800',
  emerald: 'text-emerald-600 hover:text-emerald-800',
  amber: 'text-amber-600 hover:text-amber-800',
  rose: 'text-rose-600 hover:text-rose-800',
  sky: 'text-sky-600 hover:text-sky-800',
  zinc: 'text-zinc-600 hover:text-zinc-800',
  red: 'text-red-600 hover:text-red-800',
}

export default function FerramentasPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
        <Link href="/auth/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          Criar conta grátis
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-zinc-900 mb-3">Ferramentas para o ENEM 2026</h1>
          <p className="text-zinc-600 text-lg">Tudo que você precisa para se preparar — gratuito.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {FERRAMENTAS.map(f => (
            <div key={f.href} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{f.icon}</span>
                  <h2 className="font-bold text-zinc-900">{f.title}</h2>
                </div>
                {f.badge && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${COLOR_BADGE[f.color]}`}>
                    {f.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-600 mb-4">{f.desc}</p>
              <Link href={f.href} className={`text-sm font-semibold ${COLOR_BTN[f.color]} hover:underline`}>
                {f.cta} →
              </Link>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
          <h2 className="font-bold text-zinc-900 mb-4">Guia por Matéria</h2>
          <p className="text-sm text-zinc-500 mb-4">O que cai em cada matéria do ENEM, dicas de estudo e questões organizadas por ano.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {MATERIAS.map(m => (
              <Link
                key={m.slug}
                href={`/materias/${m.slug}`}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm font-medium text-zinc-700"
              >
                <span>{m.icon}</span>
                <span>{m.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 text-center">
          <p className="text-indigo-900 font-bold text-lg mb-2">Pratique com questões reais do ENEM</p>
          <p className="text-indigo-700 text-sm mb-4">
            10 questões por dia grátis + explicação de IA para cada erro. Sem cartão de crédito.
          </p>
          <Link href="/auth/register" className="inline-block bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-700">
            Começar grátis →
          </Link>
        </div>
      </main>
    </div>
  )
}
