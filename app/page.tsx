import Link from 'next/link'
import Script from 'next/script'
import DemoQuestion from '@/components/DemoQuestion'
import { createServerClient } from '@/lib/supabase'

async function getLiveStats() {
  try {
    const sb = createServerClient()
    const [answersRes, usersRes] = await Promise.all([
      sb.from('user_answers').select('*', { count: 'exact', head: true }),
      sb.from('daily_usage').select('*', { count: 'exact', head: true })
        .gte('date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]),
    ])
    return {
      totalAnswers: answersRes.count || 0,
      activeUsers: usersRes.count || 0,
    }
  } catch {
    return { totalAnswers: 0, activeUsers: 0 }
  }
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ENEM Pro',
  url: 'https://enem-pro-eight.vercel.app',
  description: 'Todas as questões do ENEM de 2009 a 2024 com explicação gerada por IA.',
  applicationCategory: 'EducationApplication',
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'BRL', name: 'Plano Grátis' },
    { '@type': 'Offer', price: '14.90', priceCurrency: 'BRL', name: 'Plano Pro' },
  ],
}

export default async function LandingPage() {
  const stats = await getLiveStats()
  return (
    <div className="flex flex-col min-h-screen">
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold text-indigo-600">ENEM Pro</span>
          <div className="flex items-center gap-4">
            <Link href="/planos" className="text-sm text-zinc-600 hover:text-zinc-900">Planos</Link>
            <Link href="/auth/login" className="text-sm text-zinc-600 hover:text-zinc-900">Entrar</Link>
            <Link
              href="/auth/register"
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-2 rounded-full mb-8">
          <span>✦</span>
          <span>ENEM 2025 — questões reais do INEP com IA</span>
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 max-w-3xl mb-6 leading-tight">
          Medicina, Direito, Engenharia na federal.<br />
          <span className="text-indigo-600">Começa com a questão certa.</span>
        </h1>
        <p className="text-xl text-zinc-500 max-w-xl mb-10">
          3.600+ questões reais do INEP de 2009 a 2024. Erre uma — a IA explica o raciocínio completo em 30 segundos. Para quem quer aprovação, não só treino.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/register"
            className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Começar grátis agora
          </Link>
          <Link
            href="/planos"
            className="bg-white text-zinc-900 border border-zinc-300 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-zinc-50 transition-colors"
          >
            Ver Pro — R$14,90/mês
          </Link>
        </div>
        <p className="text-sm text-zinc-400 mt-4">Sem cartão de crédito. 10 questões/dia grátis para sempre.</p>
      </section>

      {/* Stats bar */}
      <section className="bg-zinc-900 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-white mb-1">3.600+</div>
            <div className="text-zinc-400 text-sm">Questões reais INEP</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">16 anos</div>
            <div className="text-zinc-400 text-sm">2009 a 2024</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.totalAnswers > 50 ? stats.totalAnswers.toLocaleString('pt-BR') + '+' : '30 seg'}
            </div>
            <div className="text-zinc-400 text-sm">
              {stats.totalAnswers > 50 ? 'Questões respondidas' : 'Para a IA explicar'}
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">R$0</div>
            <div className="text-zinc-400 text-sm">Para começar</div>
          </div>
        </div>
      </section>

      {/* Demo interativo — questão real do INEP */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              Questão real do INEP — responda agora
            </div>
            <h2 className="text-3xl font-bold mb-3">Teste antes de criar conta</h2>
            <p className="text-zinc-500 max-w-md mx-auto">Responda uma questão real do ENEM. Veja como a IA explica o raciocínio completo no Pro.</p>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <DemoQuestion />
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Como funciona</h2>
          <p className="text-zinc-500 text-center mb-14 max-w-md mx-auto">Três passos. Resultado em semanas.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.title} className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-zinc-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Por que o ENEM Pro?</h2>
          <p className="text-zinc-500 text-center mb-14 max-w-xl mx-auto">
            Outros apps mostram o gabarito. O ENEM Pro explica o raciocínio por trás de cada alternativa.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-zinc-100 bg-zinc-50">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Preços simples</h2>
          <p className="text-zinc-500 mb-14">Comece grátis. Evolua quando quiser.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <PricingCard
              name="Grátis"
              price="R$0"
              desc="Para quem está começando"
              features={[
                '10 questões por dia',
                'Todas as disciplinas',
                'Gabarito após responder',
                'Histórico de acertos',
              ]}
              cta="Criar conta grátis"
              href="/auth/register"
              highlighted={false}
            />
            <PricingCard
              name="Pro"
              price="R$14,90"
              period="/mês"
              desc="Para quem quer passar"
              features={[
                'Questões ilimitadas',
                'IA explica cada resposta',
                'Filtro por ano e disciplina',
                'Estatísticas detalhadas',
                'Todos os anos (2009–2024)',
              ]}
              cta="Assinar Pro"
              href="/planos"
              highlighted={true}
            />
          </div>
        </div>
      </section>

      {/* Garantia */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
            <span className="text-3xl">🛡️</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">Garantia de 30 dias</h2>
          <p className="text-zinc-500 leading-relaxed">
            Estude 30 questões por dia durante 30 dias com o Pro. Se você não sentir que está mais preparado para o ENEM, devolvemos 100% do seu dinheiro — sem perguntas.
          </p>
        </div>
      </section>

      {/* Proof section */}
      <section className="bg-zinc-50 py-16 px-6 border-t border-zinc-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-zinc-400 text-sm uppercase tracking-widest mb-8">Por que o ENEM Pro é diferente</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 text-left border border-zinc-100">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-semibold text-zinc-900 mb-2">Questões reais do INEP</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">3.600+ questões oficiais do ENEM de 2009 a 2024. Disponibilizadas publicamente pelo INEP. Nenhuma questão inventada.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-left border border-zinc-100">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold text-zinc-900 mb-2">IA treinada para o ENEM</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">Cada explicação é gerada no momento, para aquela questão específica. Não é gabarito genérico — é análise do raciocínio por trás da alternativa correta.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-left border border-zinc-100">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="font-semibold text-zinc-900 mb-2">Risco zero por 30 dias</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">Estude 30 questões por dia durante 30 dias. Se não sentir evolução, devolvemos 100% — sem formulário, sem pergunta, sem enrolação.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-indigo-600 py-20 px-6 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">O ENEM 2025 não espera.</h2>
        <p className="text-indigo-200 mb-2">Cada dia sem treino é um dia a menos de preparação.</p>
        <p className="text-indigo-300 text-sm mb-8">Comece agora — grátis, sem cartão de crédito.</p>
        <Link
          href="/auth/register"
          className="bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition-colors"
        >
          Criar conta grátis
        </Link>
      </section>

      <footer className="bg-zinc-900 text-zinc-500 text-sm py-8 px-6 text-center">
        <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
      </footer>
    </div>
  )
}

const steps = [
  {
    title: 'Escolha ano e disciplina',
    desc: 'Filtre por qualquer combinação — Matemática 2022, Ciências Humanas 2019, etc.',
  },
  {
    title: 'Responda as questões',
    desc: 'Interface limpa, sem distração. Veja o gabarito imediatamente após responder.',
  },
  {
    title: 'Entenda com a IA',
    desc: 'No Pro, a IA explica o raciocínio completo: por que a correta é certa e as erradas, erradas.',
  },
]

const features = [
  {
    icon: '📚',
    title: 'Questões reais do ENEM',
    desc: 'Todas as questões oficiais de 2009 a 2024. Mais de 3.600 questões organizadas por ano, disciplina e dificuldade.',
  },
  {
    icon: '🤖',
    title: 'IA explica o porquê',
    desc: 'Após responder, a IA gera uma explicação detalhada de por que aquela alternativa é a correta — não só o gabarito.',
  },
  {
    icon: '📊',
    title: 'Acompanhe seu progresso',
    desc: 'Veja sua taxa de acerto por disciplina, identifique pontos fracos e foque onde mais precisa.',
  },
]


function PricingCard({
  name, price, period, desc, features, cta, href, highlighted
}: {
  name: string
  price: string
  period?: string
  desc: string
  features: string[]
  cta: string
  href: string
  highlighted: boolean
}) {
  return (
    <div className={`rounded-2xl p-8 text-left ${highlighted ? 'bg-indigo-600 text-white' : 'bg-white border border-zinc-200 text-zinc-900'}`}>
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-1 ${highlighted ? 'text-white' : ''}`}>{name}</h3>
        <p className={`text-sm ${highlighted ? 'text-indigo-200' : 'text-zinc-500'}`}>{desc}</p>
      </div>
      <div className="mb-8">
        <span className="text-4xl font-bold">{price}</span>
        {period && <span className={`text-sm ${highlighted ? 'text-indigo-200' : 'text-zinc-500'}`}>{period}</span>}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <span className={highlighted ? 'text-indigo-200' : 'text-indigo-500'}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`block text-center py-3 rounded-xl font-semibold transition-colors ${
          highlighted
            ? 'bg-white text-indigo-600 hover:bg-indigo-50'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {cta}
      </Link>
    </div>
  )
}
