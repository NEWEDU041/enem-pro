import { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Temas da Redação do ENEM — 2009 a 2024 | ENEM Pro',
  description: 'Lista completa dos temas da redação do ENEM de 2009 a 2024. Veja os temas já cobrados, analise padrões e prepare sua redação para o ENEM 2026.',
  alternates: { canonical: `${SITE_URL}/temas-redacao` },
  openGraph: {
    title: 'Temas da Redação do ENEM 2009–2024',
    description: 'Todos os temas da redação ENEM. Analise padrões e prepare-se para 2026.',
  },
}

const TEMAS = [
  { year: 2024, tema: 'Desafios para a valorização da herança africana no Brasil', area: 'Identidade e Cultura', dificuldade: 'Alta', nota: 'Exigiu conhecimento de história, cultura afro-brasileira, Lei 10.639/03 e políticas de reparação social.' },
  { year: 2023, tema: 'Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil', area: 'Gênero e Trabalho', dificuldade: 'Alta', nota: 'Abordou divisão sexual do trabalho, dupla jornada feminina e políticas públicas de reconhecimento.' },
  { year: 2022, tema: 'Desafios para a valorização de comunidades e povos tradicionais no Brasil', area: 'Cultura e Diversidade', dificuldade: 'Média', nota: 'Focou em povos indígenas, quilombolas e comunidades tradicionais versus modernização.' },
  { year: 2021, tema: 'Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil', area: 'Cidadania e Direitos', dificuldade: 'Média', nota: 'Tratou de pessoas sem documentação, acesso a direitos básicos e papel do Estado.' },
  { year: 2020, tema: 'O estigma associado às doenças mentais na sociedade brasileira', area: 'Saúde e Sociedade', dificuldade: 'Média-Alta', nota: 'Exigiu abordagem sobre preconceito, subnotificação e políticas de saúde mental.' },
  { year: 2019, tema: 'Democratização do acesso ao cinema no Brasil', area: 'Cultura e Acesso', dificuldade: 'Média', nota: 'Menos abstrato. Focou em barreiras econômicas, geográficas e de acessibilidade cultural.' },
  { year: 2018, tema: 'Manipulação do comportamento do usuário pelo controle de dados na internet', area: 'Tecnologia e Sociedade', dificuldade: 'Alta', nota: 'Tema contemporâneo sobre privacidade digital, fake news e economia da atenção.' },
  { year: 2017, tema: 'Desafios para a formação educacional de surdos no Brasil', area: 'Acessibilidade e Educação', dificuldade: 'Alta', nota: 'Abordou LIBRAS, inclusão educacional, intérpretes e bilingualismo.' },
  { year: 2016, tema: 'Caminhos para combater a intolerância religiosa no Brasil', area: 'Direitos e Diversidade', dificuldade: 'Média', nota: 'Tratou de laicidade do Estado, liberdade de crença e violência religiosa.' },
  { year: 2015, tema: 'A persistência da violência contra a mulher na sociedade brasileira', area: 'Gênero e Violência', dificuldade: 'Média', nota: 'Focou em feminicídio, Lei Maria da Penha, cultura do estupro e machismo estrutural.' },
  { year: 2014, tema: 'Publicidade infantil em questão no Brasil', area: 'Consumo e Infância', dificuldade: 'Baixa-Média', nota: 'Mais acessível. Tratou de regulamentação, vulnerabilidade infantil e responsabilidade das empresas.' },
  { year: 2013, tema: 'Efeitos da implantação da Lei Seca no Brasil', area: 'Saúde Pública e Legislação', dificuldade: 'Baixa', nota: 'Tema concreto sobre álcool, trânsito, Lei 11.705/08 e impacto social.' },
  { year: 2012, tema: 'O movimento imigratório para o Brasil no século XXI', area: 'Migração e Identidade', dificuldade: 'Média', nota: 'Abordou fluxo de haitianos e outras nacionalidades, xenofobia e política de acolhimento.' },
  { year: 2011, tema: 'Viver em rede no século XXI: os limites entre o público e o privado', area: 'Tecnologia e Privacidade', dificuldade: 'Média', nota: 'Redes sociais, exposição online e fronteiras da privacidade na era digital.' },
  { year: 2010, tema: 'O indivíduo frente à ética nacional', area: 'Ética e Cidadania', dificuldade: 'Alta', nota: 'Primeiro ENEM no novo formato. Tema abstrato sobre ética pública versus privada e corrupção.' },
  { year: 2009, tema: 'O indivíduo diante da ética nacional', area: 'Ética e Cidadania', dificuldade: 'Alta', nota: 'Último ENEM no formato antigo. Discutia corrupção, cidadania e responsabilidade individual.' },
]

const AREAS = [...new Set(TEMAS.map((t) => t.area))]

const DICAS_COMPETENCIAS = [
  { label: 'C1', title: 'Domínio da língua', desc: 'Escreva com clareza, sem erros graves de ortografia e concordância. Uma vírgula no lugar errado pode custar pontos.' },
  { label: 'C2', title: 'Compreensão da proposta', desc: 'Nunca fuja do tema. Leia a proposta 3 vezes antes de escrever. Fuga total = nota 0.' },
  { label: 'C3', title: 'Seleção de argumentos', desc: 'Use dados concretos, referências a leis e filósofos. Evite "achismos". 3 argumentos sólidos valem mais que 5 superficiais.' },
  { label: 'C4', title: 'Coesão textual', desc: 'Use conectivos adequados: "Ademais", "Nesse contexto", "Outrossim" com moderação. O texto precisa fluir naturalmente.' },
  { label: 'C5', title: 'Proposta de intervenção', desc: 'Sempre: agente + ação + modo + efeito + finalidade. Proposta vaga = 0 pontos em C5. Cite agentes específicos (governo federal, escolas, ONGs).' },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Temas da Redação do ENEM — 2009 a 2024',
  description: 'Lista completa dos temas da redação do ENEM de 2009 a 2024 com análise e dicas.',
  url: `${SITE_URL}/temas-redacao`,
  publisher: { '@type': 'Organization', name: 'ENEM Pro', url: SITE_URL },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: TEMAS.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `Tema ENEM ${t.year}: ${t.tema}`,
    })),
  },
}

const DIFIC_COLOR: Record<string, string> = {
  'Alta': 'bg-red-50 text-red-700 border-red-200',
  'Média': 'bg-amber-50 text-amber-700 border-amber-200',
  'Baixa': 'bg-green-50 text-green-700 border-green-200',
  'Média-Alta': 'bg-orange-50 text-orange-700 border-orange-200',
  'Baixa-Média': 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

export default function TemasRedacaoPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="sticky top-0 z-50 bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-zinc-600 hover:text-zinc-900">Entrar</Link>
            <Link href="/auth/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <nav className="text-xs text-zinc-400 mb-6">
          <Link href="/" className="hover:text-zinc-700">Início</Link>
          {' / '}
          <span className="text-zinc-600">Temas da Redação ENEM</span>
        </nav>

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-zinc-900 mb-3">Temas da Redação do ENEM</h1>
          <p className="text-xl text-zinc-500 max-w-2xl">
            Todos os {TEMAS.length} temas cobrados de 2009 a 2024. Analise padrões, identifique tendências e prepare sua redação para o ENEM 2026.
          </p>
        </div>

        {/* Padrões */}
        <div className="bg-indigo-600 text-white rounded-2xl p-6 mb-10">
          <h2 className="font-bold text-lg mb-3">Padrões que o INEP adora cobrar</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="font-semibold mb-1">Grupos vulneráveis</div>
              <div className="text-indigo-200">Mulheres, negros, surdos, imigrantes, povos tradicionais — 9 de 16 temas envolvem minorias.</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="font-semibold mb-1">Sempre começa com &ldquo;Desafios&rdquo;</div>
              <div className="text-indigo-200">6 temas recentes começam com &ldquo;Desafios para...&rdquo;. Provável em 2026 também.</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="font-semibold mb-1">Foco em Brasil</div>
              <div className="text-indigo-200">Quase todo tema termina em &ldquo;...no Brasil&rdquo;. O contexto é sempre nacional, nunca genérico.</div>
            </div>
          </div>
        </div>

        {/* Tabela de temas */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden mb-10">
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50">
            <h2 className="font-bold text-zinc-900">Todos os temas por ano</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {TEMAS.map((t) => (
              <div key={t.year} className="px-6 py-5">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <span className="text-indigo-700 font-bold">{t.year}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                      <h3 className="font-semibold text-zinc-900 leading-snug">{t.tema}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{t.area}</span>
                      <span className={`text-xs border px-2 py-0.5 rounded-full font-medium ${DIFIC_COLOR[t.dificuldade] || 'bg-zinc-100 text-zinc-600'}`}>
                        Dificuldade: {t.dificuldade}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed">{t.nota}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5 Competências */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">As 5 competências da redação ENEM</h2>
          <p className="text-zinc-500 mb-6">Cada competência vale 200 pontos. Nota máxima = 1000.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {DICAS_COMPETENCIAS.map((c) => (
              <div key={c.label} className="bg-white rounded-2xl border border-zinc-200 p-5 flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                  {c.label}
                </div>
                <div>
                  <div className="font-semibold text-zinc-900 mb-1">{c.title}</div>
                  <p className="text-sm text-zinc-500 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Temas por área */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-10">
          <h2 className="font-bold text-zinc-900 mb-4">Frequência por área temática</h2>
          <div className="space-y-2">
            {AREAS.map((area) => {
              const count = TEMAS.filter((t) => t.area === area).length
              const pct = Math.round((count / TEMAS.length) * 100)
              return (
                <div key={area}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-700">{area}</span>
                    <span className="text-zinc-400 font-mono">{count}x</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-indigo-600 text-white rounded-2xl p-8 text-center mb-10">
          <h2 className="text-2xl font-bold mb-2">Pratique sua redação com correção por IA</h2>
          <p className="text-indigo-200 mb-6">O ENEM Pro corrige sua redação nas 5 competências do INEP e dá nota de 0 a 1000 em segundos.</p>
          <Link href="/auth/register" className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors">
            Começar grátis
          </Link>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">Perguntas frequentes sobre a redação do ENEM</h2>
          <div className="space-y-6">
            {[
              { q: 'Qual é o tema da redação do ENEM 2026?', a: 'O tema do ENEM 2026 ainda não foi divulgado — será revelado apenas no dia da prova. Com base nos padrões históricos, temas ligados a minorias, direitos sociais, tecnologia e desigualdade são os mais prováveis.' },
              { q: 'Quantas linhas deve ter a redação do ENEM?', a: 'O ideal é entre 25 e 30 linhas. Menos de 8 linhas = nota 0. Não existe máximo, mas textos muito longos tendem a ter mais erros de coesão.' },
              { q: 'O que é a proposta de intervenção do ENEM?', a: 'É o último parágrafo da redação. Deve apresentar uma solução concreta para o problema discutido, com: agente (quem vai agir), ação (o que será feito), modo (como), efeito esperado e finalidade.' },
              { q: 'A redação do ENEM pode ser em primeira pessoa?', a: 'Tecnicamente sim, mas recomenda-se usar linguagem impessoal para transmitir objetividade e formalidade, características do texto dissertativo-argumentativo.' },
            ].map(({ q, a }) => (
              <div key={q}>
                <h3 className="font-semibold text-zinc-900 mb-2">{q}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-zinc-900 text-zinc-500 text-sm py-8 px-6 text-center mt-12">
        <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
      </footer>
    </div>
  )
}
