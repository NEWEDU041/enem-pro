import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/site-config'

type Competitor = {
  name: string
  price: string
  slug: string
  desc: string
  focus: string
  cons: string[]
  pros: string[]
  // Ordem: Questões INEP reais, IA explica por questão, Revisão automática,
  // Gabarito histórico por ano, Calculadora TRI, Cronograma personalizado,
  // Gratuito (parcial/total), Preço ≤ ENEM Pro. Verificado via pesquisa real
  // em 20/07/2026 — default é false quando não confirmado (nunca supor).
  features: [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean]
}

const COMPETITORS: Record<string, Competitor> = {
  descomplica: {
    name: 'Descomplica',
    slug: 'descomplica',
    price: 'R$39,90–119,90/mês',
    desc: 'Plataforma focada em videoaulas para ENEM e vestibulares. Um dos maiores players do mercado, com banco de questões e gabarito histórico próprios.',
    focus: 'Videoaulas + cursos gravados',
    cons: [
      'Planos completos custam bem mais que o ENEM Pro',
      'Modelo centrado em videoaulas — menos foco em prática ativa por questão',
      'IA é um assistente de estudos geral, não uma explicação dedicada por questão errada',
      'Sem modo de revisão automática de erros por disciplina',
    ],
    pros: [
      'Grande biblioteca de videoaulas',
      'Marca reconhecida',
      'Tem banco de questões reais do INEP e gabarito histórico interativo próprios',
      'Professores especializados por matéria',
    ],
    features: [true, false, false, true, true, false, false, false],
  },
  stoodi: {
    name: 'Stoodi',
    slug: 'stoodi',
    price: 'R$13,90–39,90/mês (plano anual)',
    desc: 'Plataforma com plano de estudos, exercícios, gabarito histórico e correção de redação para ENEM.',
    focus: 'Plano de estudos + videoaulas',
    cons: [
      'Preço parcelado em compromisso anual, não avulso mês a mês',
      'Redação corrigida por especialistas humanos, com prazo de até 10 dias úteis (não é instantâneo)',
      'TutorIA é um chat geral de dúvidas, não uma explicação dedicada por questão errada',
      'Sem modo de revisão automática de erros por disciplina',
    ],
    pros: [
      'Plano de estudos estruturado',
      'Gabarito histórico do ENEM (2011–2024)',
      'Correção de redação incluída',
      'Interface moderna',
    ],
    features: [false, false, false, true, false, true, false, false],
  },
  'estuda-com': {
    name: 'Estuda.com',
    slug: 'estuda-com',
    price: 'Grátis (Treineiro) ou R$45,90–99,90/mês',
    desc: 'Plataforma com foco em banco de questões de concursos e ENEM, com assistente de IA (Duda) e plano de estudos adaptativo.',
    focus: 'Banco de questões (200K+) + IA',
    cons: [
      'Interface menos moderna',
      'Focado em volume de questões — cobre concursos além do ENEM, menos especializado',
      'Sem calculadora de nota TRI',
    ],
    pros: [
      'Grande banco de questões (200K+)',
      'Duda IA explica questões erradas e monta plano de estudos adaptativo',
      'Cobre além do ENEM (concursos)',
      'Tem plano gratuito',
    ],
    features: [false, true, true, false, false, true, true, false],
  },
  'me-salva': {
    name: 'Me Salva!',
    slug: 'me-salva',
    price: 'até R$49,90/mês',
    desc: 'Plataforma de videoaulas e exercícios focada em ENEM e vestibulares, com forte presença no YouTube e banco de provas reais do INEP.',
    focus: 'Videoaulas didáticas + exercícios',
    cons: [
      'Custo mensal mais alto que o ENEM Pro',
      'Modelo baseado em videoaulas — foco passivo, não ativo',
      'Sem confirmação de explicação de IA personalizada por questão específica',
      'Sem modo de revisão automática de erros por disciplina',
    ],
    pros: [
      'Professores didáticos com boa didática em vídeo',
      'Canal YouTube gratuito com ~2 milhões de inscritos',
      'Banco de Provas com exames reais do INEP (2009–2018) e gabarito',
      'Cobre ENEM, FUVEST, UNICAMP e outros vestibulares',
    ],
    features: [true, false, false, true, false, false, false, false],
  },
  'khan-academy': {
    name: 'Khan Academy',
    slug: 'khan-academy',
    price: 'Gratuito',
    desc: 'Plataforma educacional gratuita, sem fins lucrativos, com conteúdo adaptado ao currículo brasileiro em parceria com a Fundação Lemann.',
    focus: 'Conteúdo gratuito + exercícios adaptados',
    cons: [
      'Exercícios adaptados ao currículo brasileiro — não são as provas reais do INEP',
      'Sem questões oficiais do ENEM (2009–2024)',
      'Sem explicação de IA específica por questão do ENEM',
      'Sem gabarito histórico do ENEM',
      'Sem calculadora de nota TRI',
      'Conteúdo mais generalista — não específico à banca INEP',
    ],
    pros: [
      '100% gratuito, sem anúncios',
      'Conteúdo de alta qualidade (matemática, ciências)',
      'Parceria com a Fundação Lemann para adaptação ao ensino brasileiro',
    ],
    features: [false, false, false, false, false, false, true, true],
  },
  poliedro: {
    name: 'Sistema Poliedro',
    slug: 'poliedro',
    price: 'Sistema anual (via escola parceira ou curso), não é assinatura mensal avulsa',
    desc: 'Sistema de ensino premium focado em vestibulares de elite (FUVEST, UNICAMP, Medicina) com material didático impresso e plataforma online.',
    focus: 'Preparação vestibulares top + ENEM',
    cons: [
      'Modelo de venda anual/escolar — não é uma assinatura mensal simples como o ENEM Pro',
      'Foco em vestibulares de elite — não otimizado só para ENEM',
      'Centrado em material impresso próprio, não nas provas reais do INEP',
    ],
    pros: [
      'Material didático de alta qualidade',
      'Ótimo para quem mira FUVEST/UNICAMP/Medicina além do ENEM',
      'Professores especializados por disciplina',
    ],
    features: [false, false, false, false, false, false, false, false],
  },
  'prepara-enem': {
    name: 'Prepara ENEM',
    slug: 'prepara-enem',
    price: 'Gratuito',
    desc: 'Aplicativo móvel gratuito (Google Play) com questões de todas as provas do ENEM e simulados rápidos para praticar no celular.',
    focus: 'App mobile + simulados rápidos',
    cons: [
      'Sem confirmação de explicação de IA por questão',
      'Sem calculadora de nota TRI',
      'Sem cronograma personalizado de estudos',
      'Foco em simulados rápidos — menos indicado para estudo por disciplina',
    ],
    pros: [
      'Interface mobile amigável, 500 mil+ downloads',
      'Gratuito, sem necessidade de cadastro',
      'Simulados rápidos para praticar no celular',
    ],
    features: [true, false, false, true, false, false, true, true],
  },
  estrategia: {
    name: 'Estratégia Vestibulares',
    slug: 'estrategia',
    price: 'R$73–267/mês (planos anuais parcelados)',
    desc: 'Plataforma com videoaulas, banco de questões (288 mil+), simulados e planejamento com IA para ENEM e vestibulares, com professores reconhecidos.',
    focus: 'Videoaulas + banco de questões + simulados',
    cons: [
      'Preço mais alto que o ENEM Pro, vendido em planos anuais parcelados',
      'IA é voltada a planejamento de estudos, não a explicar o raciocínio de cada questão errada',
      'Sem modo de revisão automática de erros por disciplina confirmado',
    ],
    pros: [
      'Professores reconhecidos com didática comprovada',
      'Banco de questões extenso (288 mil+, parte comentada)',
      'Cobre ENEM e principais vestibulares estaduais',
      'Simulados semanais gratuitos com correção',
    ],
    features: [false, false, false, false, false, true, true, false],
  },
}

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const c = COMPETITORS[slug]
  if (!c) return {}
  return {
    title: `ENEM Pro vs ${c.name} — Qual é Melhor para o ENEM 2026?`,
    description: `Compare ENEM Pro e ${c.name}: preço, questões INEP, IA e funcionalidades. Veja qual plataforma prepara melhor para o ENEM 2026 pelo menor custo.`,
    alternates: { canonical: `${SITE_URL}/vs/${slug}` },
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
  'R$29,90/mês ou R$99/ano — sem fidelidade',
  '10 questões/dia grátis — sem cartão',
]

export default async function VsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = COMPETITORS[slug]
  if (!c) notFound()

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `ENEM Pro vs ${c.name}`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Product',
          name: 'ENEM Pro',
          description: 'Questões reais do ENEM de 2009 a 2024 com explicação por IA.',
          offers: { '@type': 'Offer', price: '29.90', priceCurrency: 'BRL' },
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: { '@type': 'Product', name: c.name, description: c.desc },
      },
    ],
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Comparativos', item: `${SITE_URL}/vs` },
      { '@type': 'ListItem', position: 3, name: `vs ${c.name}`, item: `${SITE_URL}/vs/${slug}` },
    ],
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
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
            <p className="text-3xl font-bold mb-1">R$29,90<span className="text-lg font-normal opacity-70">/mês</span></p>
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
                'Questões INEP reais (2009–2024)',
                'IA explica cada questão errada',
                'Modo revisão de erros automático',
                'Gabarito histórico por ano',
                'Calculadora nota TRI',
                'Cronograma personalizado',
                'Gratuito (parcial ou total)',
                'Preço ≤ ENEM Pro',
              ].map((label, i) => (
                <tr key={label} className="hover:bg-zinc-50">
                  <td className="px-5 py-3 text-zinc-700">{label}</td>
                  <td className="text-center px-4 py-3">
                    <span className="text-green-500 font-bold">✓</span>
                  </td>
                  <td className="text-center px-4 py-3">
                    {c.features[i] ? <span className="text-green-500 font-bold">✓</span> : <span className="text-zinc-300">—</span>}
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
            Assine Pro por <strong>R$29,90/mês</strong> quando quiser mais.
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
