import Link from 'next/link'
import Script from 'next/script'
import DemoQuestion from '@/components/DemoQuestion'
import { createServerClient } from '@/lib/supabase'
import { SITE_URL } from '@/lib/site-config'
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal'
import { LinkButton } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

async function getLiveStats() {
  try {
    const sb = createServerClient()
    const { data } = await sb
      .from('stats_snapshot')
      .select('total_answers')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    return { totalAnswers: data?.total_answers || 0 }
  } catch {
    return { totalAnswers: 0 }
  }
}

const faqItems = [
  {
    q: 'O ENEM Pro é grátis?',
    a: 'Sim. O plano gratuito permite responder até 10 questões por dia sem necessidade de cartão de crédito. O plano Pro (R$8,25/mês no plano anual, ou R$29,90/mês no mensal) libera questões ilimitadas e as explicações geradas por IA.',
  },
  {
    q: 'Quantas questões do ENEM estão disponíveis?',
    a: 'O ENEM Pro reúne mais de 2.900 questões oficiais do INEP de 2009 a 2024, organizadas por ano, disciplina e área de conhecimento.',
  },
  {
    q: 'O ENEM Pro tem questões de todas as disciplinas?',
    a: 'Sim. Todas as 4 áreas do ENEM estão cobertas: Matemática, Linguagens e Códigos, Ciências Humanas e Ciências da Natureza — com questões de todos os anos desde 2009.',
  },
  {
    q: 'Como funciona a explicação por IA?',
    a: 'Após responder uma questão no plano Pro, a IA analisa a questão e gera em 30 segundos uma explicação completa: por que a alternativa correta está certa e por que as erradas estão erradas.',
  },
  {
    q: 'Posso usar o ENEM Pro para simulados completos?',
    a: 'Sim. O recurso de simulado permite montar provas com 10, 20 ou 45 questões por disciplina, com timer e nota estimada ao final — simulando as condições reais do ENEM.',
  },
  {
    q: 'O ENEM Pro tem calculadora de nota?',
    a: 'Sim. A calculadora de nota ENEM usa uma aproximação da curva TRI para estimar sua nota por área (300–900) a partir do número de acertos, e compara com as notas de corte de cursos como Medicina, Direito e Engenharia.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ENEM Pro',
  url: SITE_URL,
  description: 'Todas as questões do ENEM de 2009 a 2024 com explicação gerada por IA.',
  applicationCategory: 'EducationApplication',
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'BRL', name: 'Plano Grátis' },
    { '@type': 'Offer', price: '99', priceCurrency: 'BRL', name: 'Plano Pro Anual' },
    { '@type': 'Offer', price: '29.90', priceCurrency: 'BRL', name: 'Plano Pro Mensal' },
  ],
}

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

export default async function LandingPage() {
  const stats = await getLiveStats()
  return (
    <div className="flex flex-col min-h-screen" id="page-root">
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Script
        id="faq-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-ink-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <span className="font-display text-xl font-bold text-ink-900 shrink-0 whitespace-nowrap">ENEM Pro</span>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/ferramentas" className="text-sm text-ink-500 hover:text-ink-900 hidden md:inline">Ferramentas</Link>
            <Link href="/calcular-nota" className="text-sm text-ink-500 hover:text-ink-900 hidden sm:inline">Calcular nota</Link>
            <Link href="/planos" className="text-sm text-ink-500 hover:text-ink-900 hidden sm:inline">Planos</Link>
            <Link href="/auth/login" className="text-sm text-ink-500 hover:text-ink-900">Entrar</Link>
            <LinkButton href="/auth/register" size="sm" className="whitespace-nowrap">Começar grátis</LinkButton>
          </div>
        </div>
      </nav>

      <main id="main-content">
      {/* Hero + stats — bloco navy único */}
      <section className="relative bg-ink-950 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <div className="relative flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
          <Badge color="onDark" className="mb-8 px-4 py-2 text-sm gap-2">
            <span className="text-gold-400">✦</span>
            <span>ENEM 2026 — questões reais do INEP com IA</span>
          </Badge>
          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-white max-w-3xl mb-6 leading-[1.05]">
            Medicina, Direito, Engenharia na federal.<br />
            <span className="text-gold-400">Começa com a questão certa.</span>
          </h1>
          <p className="text-xl text-ink-200 max-w-xl mb-10">
            2.900+ questões reais do INEP de 2009 a 2024. Erre uma — a IA explica o raciocínio completo em 30 segundos. Para quem quer aprovação, não só treino.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <LinkButton href="/auth/register" size="lg">Começar grátis agora</LinkButton>
            <LinkButton href="/planos" variant="secondary" size="lg" className="!bg-white/5 !text-white !border-white/15 hover:!bg-white/10">Ver Pro — R$8,25/mês</LinkButton>
          </div>
          <p className="text-sm text-ink-500 mt-4">Sem cartão de crédito. 10 questões/dia grátis para sempre.</p>
          <p className="text-xs text-ink-500 mt-2">30 dias de garantia · Cancele quando quiser · Sem cartão para começar</p>
        </div>

        {/* Stats bar */}
        <RevealGroup className="relative max-w-4xl mx-auto grid grid-cols-4 gap-6 text-center border-t border-white/10 py-10 px-6">
          <RevealItem>
            <div className="font-display text-3xl font-bold text-white mb-1">2.900+</div>
            <div className="text-ink-500 text-sm">Questões reais INEP</div>
          </RevealItem>
          <RevealItem>
            <div className="font-display text-3xl font-bold text-white mb-1">16 anos</div>
            <div className="text-ink-500 text-sm">2009 a 2024</div>
          </RevealItem>
          <RevealItem>
            <div className="font-display text-3xl font-bold text-white mb-1">
              {stats.totalAnswers > 50 ? stats.totalAnswers.toLocaleString('pt-BR') + '+' : '30 seg'}
            </div>
            <div className="text-ink-500 text-sm">
              {stats.totalAnswers > 50 ? 'Questões respondidas' : 'Para a IA explicar'}
            </div>
          </RevealItem>
          <RevealItem>
            <div className="font-display text-3xl font-bold text-gold-400 mb-1">R$0</div>
            <div className="text-ink-500 text-sm">Para começar</div>
          </RevealItem>
        </RevealGroup>
      </section>

      {/* Demo interativo — questão real do INEP */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-2xl mx-auto">
          <Reveal className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              Questão do Dia — nova todo dia
            </div>
            <h2 className="font-display text-3xl font-bold mb-3 text-ink-900">Teste antes de criar conta</h2>
            <p className="text-zinc-500 max-w-md mx-auto">Uma questão real do INEP por dia. Rotaciona disciplinas e anos automaticamente.</p>
          </Reveal>
          <Reveal delay={0.1} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <DemoQuestion />
          </Reveal>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-center mb-4 text-ink-900">Como funciona</h2>
            <p className="text-ink-500 text-center mb-14 max-w-md mx-auto">Três passos. Resultado em semanas.</p>
          </Reveal>
          <RevealGroup className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <RevealItem key={s.title} className="text-center">
                <div className="font-display w-12 h-12 rounded-full bg-ink-900 text-gold-400 text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="font-semibold mb-2 text-ink-900">{s.title}</h3>
                <p className="text-ink-500 text-sm leading-relaxed">{s.desc}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Features */}
      <section className="bg-ink-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-center mb-4 text-ink-900">Por que o ENEM Pro?</h2>
            <p className="text-ink-500 text-center mb-14 max-w-xl mx-auto">
              Outros apps mostram o gabarito. O ENEM Pro explica o raciocínio por trás de cada alternativa.
            </p>
          </Reveal>
          <RevealGroup className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <RevealItem
                key={f.title}
                className={`p-8 rounded-2xl border transition-transform hover:-translate-y-1 ${
                  i === 1
                    ? 'bg-ink-900 border-ink-900 text-white shadow-lg shadow-ink-200'
                    : 'bg-white border-ink-100 shadow-sm'
                }`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-5 ${
                  i === 1 ? 'bg-gold-500/15' : 'bg-gold-100'
                }`}>
                  {f.icon}
                </div>
                <h3 className={`font-display text-lg font-semibold mb-2 ${i === 1 ? 'text-white' : 'text-ink-900'}`}>{f.title}</h3>
                <p className={`text-sm leading-relaxed ${i === 1 ? 'text-ink-200' : 'text-ink-500'}`}>{f.desc}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="font-display text-3xl font-bold mb-4 text-ink-900">Preços simples</h2>
            <p className="text-ink-500 mb-14">Comece grátis. Evolua quando quiser.</p>
          </Reveal>
          <RevealGroup className="grid md:grid-cols-2 gap-6">
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
              price="R$8,25"
              period="/mês"
              desc="Para quem quer passar — R$99/ano"
              features={[
                'Questões ilimitadas',
                'IA explica cada resposta',
                'Filtro por ano e disciplina',
                'Estatísticas detalhadas',
                'Todos os anos (2009–2024)',
              ]}
              cta="Assinar Pro Anual — R$99/ano"
              href="/planos"
              highlighted={true}
            />
          </RevealGroup>
        </div>
      </section>

      {/* Garantia */}
      <section className="bg-ink-50 py-16 px-6">
        <Reveal className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-100 mb-6">
            <span className="text-3xl">🛡️</span>
          </div>
          <h2 className="font-display text-2xl font-bold mb-4 text-ink-900">Garantia de 30 dias</h2>
          <p className="text-ink-500 leading-relaxed">
            Estude 30 questões por dia durante 30 dias com o Pro. Se você não sentir que está mais preparado para o ENEM, devolvemos 100% do seu dinheiro — sem perguntas.
          </p>
        </Reveal>
      </section>

      {/* Proof section */}
      <section className="bg-white py-16 px-6 border-t border-ink-100">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <p className="text-ink-500 text-sm uppercase tracking-widest mb-8">Por que o ENEM Pro é diferente</p>
          </Reveal>
          <RevealGroup className="grid md:grid-cols-3 gap-6">
            <RevealItem className="bg-ink-50 rounded-2xl p-6 text-left border border-ink-100 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-semibold text-ink-900 mb-2">Questões reais do INEP</h3>
              <p className="text-ink-500 text-sm leading-relaxed">2.900+ questões oficiais do ENEM de 2009 a 2024. Disponibilizadas publicamente pelo INEP. Nenhuma questão inventada.</p>
            </RevealItem>
            <RevealItem className="bg-ink-50 rounded-2xl p-6 text-left border border-ink-100 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold text-ink-900 mb-2">IA treinada para o ENEM</h3>
              <p className="text-ink-500 text-sm leading-relaxed">Cada explicação é gerada no momento, para aquela questão específica. Não é gabarito genérico — é análise do raciocínio por trás da alternativa correta.</p>
            </RevealItem>
            <RevealItem className="bg-ink-50 rounded-2xl p-6 text-left border border-ink-100 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="font-semibold text-ink-900 mb-2">Risco zero por 30 dias</h3>
              <p className="text-ink-500 text-sm leading-relaxed">Estude 30 questões por dia durante 30 dias. Se não sentir evolução, devolvemos 100% — sem formulário, sem pergunta, sem enrolação.</p>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-ink-50 border-t border-ink-100">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-center mb-4 text-ink-900">Perguntas frequentes</h2>
            <p className="text-ink-500 text-center mb-12 max-w-lg mx-auto">Tudo que você precisa saber antes de começar.</p>
          </Reveal>
          <div className="space-y-4">
            {faqItems.map(({ q, a }) => (
              <details key={q} className="group bg-white rounded-2xl border border-ink-100 px-6 py-4">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-ink-900 text-sm gap-4">
                  {q}
                  <span className="text-gold-600 shrink-0 text-lg group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-ink-500 text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-ink-950 py-20 px-6 text-center text-white">
        <Reveal>
          <h2 className="font-display text-3xl font-bold mb-4">O ENEM 2026 não espera.</h2>
          <p className="text-ink-200 mb-2">Cada dia sem treino é um dia a menos de preparação.</p>
          <p className="text-ink-500 text-sm mb-8">Comece agora — grátis, sem cartão de crédito.</p>
          <Link
            href="/auth/register"
            className="bg-gold-500 text-ink-950 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gold-400 transition-colors inline-block"
          >
            Criar conta grátis
          </Link>
        </Reveal>
      </section>

      </main>
      <footer className="bg-ink-950 text-ink-500 text-sm py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <p className="text-white font-semibold mb-3">Questões ENEM</p>
            <ul className="space-y-2">
              <li><Link href="/disciplinas/matematica" className="hover:text-white transition-colors">Matemática</Link></li>
              <li><Link href="/disciplinas/linguagens" className="hover:text-white transition-colors">Linguagens</Link></li>
              <li><Link href="/disciplinas/ciencias-humanas" className="hover:text-white transition-colors">Ciências Humanas</Link></li>
              <li><Link href="/disciplinas/ciencias-natureza" className="hover:text-white transition-colors">Ciências da Natureza</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-3">Por Matéria</p>
            <ul className="space-y-2">
              <li><Link href="/materias/fisica" className="hover:text-white transition-colors">Física</Link></li>
              <li><Link href="/materias/quimica" className="hover:text-white transition-colors">Química</Link></li>
              <li><Link href="/materias/biologia" className="hover:text-white transition-colors">Biologia</Link></li>
              <li><Link href="/materias/matematica" className="hover:text-white transition-colors">Matemática</Link></li>
              <li><Link href="/materias/historia" className="hover:text-white transition-colors">História</Link></li>
              <li><Link href="/materias/geografia" className="hover:text-white transition-colors">Geografia</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-3">Ferramentas</p>
            <ul className="space-y-2">
              <li><Link href="/calcular-nota" className="hover:text-white transition-colors">Calcular nota ENEM</Link></li>
              <li><Link href="/gabarito" className="hover:text-white transition-colors">Gabarito ENEM</Link></li>
              <li><Link href="/simulado" className="hover:text-white transition-colors">Simulado</Link></li>
              <li><Link href="/cronograma" className="hover:text-white transition-colors">Cronograma de estudos</Link></li>
              <li><Link href="/temas-redacao" className="hover:text-white transition-colors">Temas de redação</Link></li>
              <li><Link href="/questao-do-dia" className="hover:text-white transition-colors">Questão do dia</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-3">ENEM Pro</p>
            <ul className="space-y-2">
              <li><Link href="/planos" className="hover:text-white transition-colors">Planos e preços</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog ENEM</Link></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Criar conta grátis</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Entrar</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-zinc-800 pt-6 flex flex-col sm:flex-row justify-between gap-2">
          <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
          <p className="text-zinc-600">Gabarito ENEM 2009–2024 · Questões reais INEP</p>
        </div>
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
    desc: 'Todas as questões oficiais de 2009 a 2024. Mais de 2.900 questões organizadas por ano, disciplina e dificuldade.',
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
    <div className={`rounded-2xl p-8 text-left ${highlighted ? 'bg-ink-950 text-white ring-1 ring-gold-500/40' : 'bg-white border border-ink-100 text-ink-900'}`}>
      <div className="mb-6">
        <h3 className={`font-display text-lg font-semibold mb-1 ${highlighted ? 'text-white' : ''}`}>{name}</h3>
        <p className={`text-sm ${highlighted ? 'text-ink-300' : 'text-ink-500'}`}>{desc}</p>
      </div>
      <div className="mb-8">
        <span className="font-display text-4xl font-bold">{price}</span>
        {period && <span className={`text-sm ${highlighted ? 'text-ink-300' : 'text-ink-500'}`}>{period}</span>}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <span className={highlighted ? 'text-gold-400' : 'text-gold-600'}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`block text-center py-3 rounded-xl font-semibold transition-colors ${
          highlighted
            ? 'bg-gold-500 text-ink-950 hover:bg-gold-400'
            : 'bg-ink-900 text-white hover:bg-ink-800'
        }`}
      >
        {cta}
      </Link>
    </div>
  )
}
