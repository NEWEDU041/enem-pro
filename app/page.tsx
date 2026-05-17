import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
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
          <span>+4.800.000 candidatos no ENEM 2025</span>
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 max-w-3xl mb-6 leading-tight">
          Todas as questões do ENEM.<br />
          <span className="text-indigo-600">IA explica o porquê</span> de cada resposta.
        </h1>
        <p className="text-xl text-zinc-500 max-w-xl mb-10">
          De 2009 a 2024. Responda, acerte ou erre, e entenda com clareza por que aquela alternativa é a correta — com explicação gerada por IA.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/register"
            className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Estudar grátis — 10 questões/dia
          </Link>
          <Link
            href="/planos"
            className="bg-white text-zinc-900 border border-zinc-300 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-zinc-50 transition-colors"
          >
            Ver planos
          </Link>
        </div>
        <p className="text-sm text-zinc-400 mt-4">Sem cartão de crédito. Grátis para sempre (com limite diário).</p>
      </section>

      {/* Features */}
      <section className="bg-white py-20 px-6">
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

      {/* Social proof */}
      <section className="bg-white py-16 px-6 border-t border-zinc-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-zinc-400 text-sm uppercase tracking-widest mb-8">O que dizem os estudantes</p>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <blockquote key={t.name} className="bg-zinc-50 rounded-2xl p-6 text-left">
                <p className="text-zinc-700 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <footer className="text-xs font-semibold text-zinc-500">{t.name}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-indigo-600 py-20 px-6 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Pronto para o ENEM 2026?</h2>
        <p className="text-indigo-200 mb-8">Comece hoje, é grátis.</p>
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

const testimonials = [
  {
    name: 'Ana Lima, São Paulo',
    text: 'Finalmente entendo o raciocínio por trás das questões de Matemática. A explicação da IA é muito melhor do que o professor resolução.',
  },
  {
    name: 'Carlos Mendes, Recife',
    text: 'Uso 10 minutos por dia. Em 3 semanas minha taxa de acerto em Ciências Humanas foi de 40% para 65%.',
  },
  {
    name: 'Júlia Santos, Belo Horizonte',
    text: 'O Pro vale muito. Questões ilimitadas + IA por R$14,90 é o melhor custo-benefício que achei.',
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
