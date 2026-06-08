import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Materia = {
  name: string
  area: string
  areaSlug: string
  desc: string
  topics: string[]
  dicas: string[]
  numQuestoes: string
  icon: string
  color: string
}

const MATERIAS: Record<string, Materia> = {
  fisica: {
    name: 'Física',
    area: 'Ciências da Natureza',
    areaSlug: 'ciencias-natureza',
    desc: 'Questões de Física do ENEM de 2009 a 2024 com gabarito e resolução por IA. Mecânica, eletricidade, termodinâmica, óptica e ondas.',
    topics: ['Mecânica e Cinemática', 'Dinâmica (Leis de Newton)', 'Trabalho, energia e potência', 'Termodinâmica', 'Eletrostática e eletrodinâmica', 'Magnetismo e ondas eletromagnéticas', 'Óptica geométrica', 'Física moderna (relatividade, fotoelétrico)', 'Acústica e ondas mecânicas'],
    dicas: [
      'Física no ENEM sempre traz contexto — leia o enunciado com atenção antes de calcular.',
      'Fórmulas simples: o ENEM evita contas complexas. Se sua conta está longa demais, reveja a abordagem.',
      'Gráficos são frequentes. Pratique ler área sob a curva (trabalho, deslocamento).',
      'Equações dimensionais ajudam a lembrar fórmulas: verifique as unidades.',
    ],
    numQuestoes: '8–12',
    icon: '⚡',
    color: 'emerald',
  },
  quimica: {
    name: 'Química',
    area: 'Ciências da Natureza',
    areaSlug: 'ciencias-natureza',
    desc: 'Questões de Química do ENEM de 2009 a 2024. Química orgânica, estequiometria, soluções, termoquímica e mais.',
    topics: ['Estequiometria e proporções', 'Química orgânica (funções e reações)', 'Soluções e concentrações', 'Termoquímica e entalpia', 'Cinética química e equilíbrio', 'Eletroquímica (pilhas e eletrólise)', 'Tabela periódica e propriedades', 'Radioatividade', 'Química ambiental e sustentabilidade'],
    dicas: [
      'Química orgânica é o maior tema — aprenda as funções e reações de adição, substituição e eliminação.',
      'Estequiometria aparece todo ano. Pratique balanceamento e regra de três.',
      'Questões de Química quase sempre trazem contexto ambiental ou cotidiano.',
      'Não decore nomes de compostos — entenda a lógica da nomenclatura IUPAC.',
    ],
    numQuestoes: '8–12',
    icon: '🧪',
    color: 'emerald',
  },
  biologia: {
    name: 'Biologia',
    area: 'Ciências da Natureza',
    areaSlug: 'ciencias-natureza',
    desc: 'Questões de Biologia do ENEM. Genética, ecologia, evolução, citologia, fisiologia humana e biotecnologia.',
    topics: ['Citologia (célula e organelas)', 'Genética mendeliana e molecular', 'Evolução e seleção natural', 'Ecologia e biomas brasileiros', 'Fisiologia humana', 'Reprodução e embriologia', 'Botânica e reino vegetal', 'Biotecnologia e CRISPR', 'Saúde e doenças'],
    dicas: [
      'Ecologia e biomas brasileiros aparecem muito — especialmente Cerrado, Amazônia e Mata Atlântica.',
      'Genética: domine herança mendeliana e herança ligada ao sexo.',
      'Biotecnologia tem crescido: DNA recombinante, OGMs, vacinas de mRNA.',
      'Fisiologia humana sempre traz gráficos — pratique interpretação de dados.',
    ],
    numQuestoes: '8–12',
    icon: '🧬',
    color: 'emerald',
  },
  historia: {
    name: 'História',
    area: 'Ciências Humanas',
    areaSlug: 'ciencias-humanas',
    desc: 'Questões de História do ENEM. Brasil colonial, República, história contemporânea, Segunda Guerra e geopolítica.',
    topics: ['Brasil colonial e Império', 'República Velha e Era Vargas', 'Ditadura Militar (1964–1985)', 'Redemocratização e constituição', 'Revolução Francesa e Iluminismo', 'Primeira e Segunda Guerra Mundial', 'Guerra Fria e geopolítica contemporânea', 'Movimento dos direitos civis', 'Descolonização da África e Ásia'],
    dicas: [
      'O ENEM cobra interpretação histórica, não decoreba de datas.',
      'Questões de História sempre têm fonte primária (documento, imagem, charge) — leia com atenção.',
      'Brasil contemporâneo (ditadura militar, redemocratização) aparece com frequência.',
      'Relacione eventos históricos com a atualidade — o ENEM valoriza análise crítica.',
    ],
    numQuestoes: '10–14',
    icon: '🏛️',
    color: 'amber',
  },
  geografia: {
    name: 'Geografia',
    area: 'Ciências Humanas',
    areaSlug: 'ciencias-humanas',
    desc: 'Questões de Geografia do ENEM. Biomas, geopolítica, urbanização, climatologia, cartografia e desenvolvimento.',
    topics: ['Cartografia e leitura de mapas', 'Biomas e climas brasileiros', 'Urbanização e metropolização', 'Geopolítica e relações internacionais', 'Globalização e desigualdade', 'Agropecuária e meio ambiente', 'Migrações e refugiados', 'Recursos naturais e energia', 'Questões ambientais (desmatamento, aquecimento)'],
    dicas: [
      'Mapa é presença garantida — pratique localizar regiões, biomas e países.',
      'Questões ambientais aparecem todo ano: Amazônia, aquecimento global, energia renovável.',
      'Geopolítica cresce a cada edição — acompanhe conflitos e acordos internacionais recentes.',
      'Urbanização no Brasil: conheça as regiões metropolitanas e o processo de favelização.',
    ],
    numQuestoes: '10–14',
    icon: '🌎',
    color: 'amber',
  },
  filosofia: {
    name: 'Filosofia',
    area: 'Ciências Humanas',
    areaSlug: 'ciencias-humanas',
    desc: 'Questões de Filosofia do ENEM. Ética, política, epistemologia, filosofia grega e moderna com resolução comentada.',
    topics: ['Filosofia grega (Sócrates, Platão, Aristóteles)', 'Filosofia moderna (Descartes, Locke, Rousseau)', 'Ética e moral', 'Filosofia política (Hobbes, Maquiavel, Marx)', 'Epistemologia e teoria do conhecimento', 'Existencialismo', 'Filosofia contemporânea', 'Direitos humanos e cidadania'],
    dicas: [
      'Filosofia no ENEM traz excertos de textos filosóficos — leia com foco na ideia central.',
      'Associe filósofos com suas teses principais (Rousseau = bem do homem natural; Hobbes = guerra de todos).',
      'Ética e política são os temas mais recorrentes no ENEM.',
      'Você não precisa memorizar o texto completo — entenda as diferenças entre correntes.',
    ],
    numQuestoes: '6–10',
    icon: '🧠',
    color: 'amber',
  },
  sociologia: {
    name: 'Sociologia',
    area: 'Ciências Humanas',
    areaSlug: 'ciencias-humanas',
    desc: 'Questões de Sociologia do ENEM. Emile Durkheim, Max Weber, Marx, desigualdade social, cultura e movimentos sociais.',
    topics: ['Durkheim: fato social e solidariedade', 'Max Weber: ação social e burocracia', 'Marx: classes sociais e capitalismo', 'Cultura e diversidade cultural', 'Desigualdade social no Brasil', 'Movimentos sociais e democracia', 'Mídia, comunicação e sociedade', 'Trabalho e precarização'],
    dicas: [
      'Os três clássicos (Durkheim, Weber, Marx) sempre aparecem — conheça os conceitos centrais de cada um.',
      'Sociologia e Filosofia costumam se cruzar em questões sobre ética e política.',
      'Questões sobre desigualdade racial e gênero têm crescido no ENEM.',
      'Textos sociológicos exigem atenção ao vocabulário técnico (anomia, alienação, habitus).',
    ],
    numQuestoes: '6–10',
    icon: '👥',
    color: 'amber',
  },
  portugues: {
    name: 'Português',
    area: 'Linguagens',
    areaSlug: 'linguagens',
    desc: 'Questões de Língua Portuguesa do ENEM. Interpretação de texto, gramática, gêneros textuais, literatura e variação linguística.',
    topics: ['Interpretação de texto', 'Coesão e coerência textual', 'Gramática e norma culta', 'Variação linguística', 'Gêneros e tipos textuais', 'Literatura brasileira (Modernismo, Realismo)', 'Figuras de linguagem', 'Publicidade e multimodalidade', 'Intertextualidade'],
    dicas: [
      'Interpretação é 80% do que cai em Linguagens — treine ler o texto antes das alternativas.',
      'As alternativas erradas geralmente extrapolam ou contradizem o texto — desconfie delas.',
      'Literatura: conheça os movimentos (Romantismo, Realismo, Modernismo) e seus principais autores.',
      'Variação linguística (dialeto, registro formal/informal) sempre cai — sem preconceito linguístico.',
    ],
    numQuestoes: '15–20',
    icon: '📝',
    color: 'violet',
  },
  literatura: {
    name: 'Literatura',
    area: 'Linguagens',
    areaSlug: 'linguagens',
    desc: 'Questões de Literatura do ENEM. Modernismo, Realismo, Romantismo, autores clássicos e interpretação de textos literários.',
    topics: ['Romantismo brasileiro', 'Realismo e Naturalismo', 'Parnasianismo e Simbolismo', 'Pré-Modernismo (Euclides, Lima Barreto)', 'Modernismo de 1922 (Oswald, Mário de Andrade)', 'Segunda e Terceira fases do Modernismo', 'Literatura portuguesa', 'Tendências contemporâneas'],
    dicas: [
      'O ENEM traz excertos de textos literários — você não precisa ter lido o livro completo.',
      'Identifique o movimento literário pelas características do texto (linguagem, temas, estilo).',
      'Machado de Assis e Clarice Lispector são os mais cobrados.',
      'Ironia e intertextualidade são recursos frequentes nas questões de literatura.',
    ],
    numQuestoes: '5–8',
    icon: '📚',
    color: 'violet',
  },
  matematica: {
    name: 'Matemática',
    area: 'Matemática',
    areaSlug: 'matematica',
    desc: 'Questões de Matemática do ENEM de 2009 a 2024. Funções, geometria, estatística, probabilidade e álgebra com resolução completa.',
    topics: ['Funções do 1º e 2º grau', 'Funções exponencial e logarítmica', 'Progressões (PA e PG)', 'Geometria plana (áreas e perímetros)', 'Geometria espacial (volumes)', 'Geometria analítica', 'Estatística e probabilidade', 'Trigonometria', 'Matrizes e sistemas lineares', 'Análise combinatória'],
    dicas: [
      'Matemática no ENEM é sempre contextualizada — nunca é questão solta sem enunciado.',
      'Se a conta está complexa demais, você provavelmente está no caminho errado — simplifique.',
      'Funções e geometria respondem por mais de 50% da prova.',
      'Leia os dados do problema duas vezes antes de montar a equação.',
    ],
    numQuestoes: '45',
    icon: '📐',
    color: 'indigo',
  },
  ingles: {
    name: 'Inglês',
    area: 'Linguagens',
    areaSlug: 'linguagens',
    desc: 'Questões de Inglês do ENEM. Interpretação de textos em inglês, vocabulário em contexto e compreensão de gêneros textuais.',
    topics: ['Interpretação de texto em inglês', 'Vocabulário em contexto', 'Gêneros textuais em inglês', 'Elementos coesivos', 'Intertextualidade', 'Linguagem informal e formal'],
    dicas: [
      'Você não precisa falar inglês fluente — o ENEM cobra interpretação, não gramática isolada.',
      'O vocabulário do contexto ajuda a entender palavras desconhecidas.',
      'Se não entender uma palavra, leia o parágrafo todo — o sentido costuma ficar claro.',
      'Treine leitura de artigos de divulgação científica e notícias em inglês.',
    ],
    numQuestoes: '5–7',
    icon: '🌐',
    color: 'violet',
  },
}

const COLOR_MAP: Record<string, { bg: string; text: string; badge: string; button: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', button: 'bg-emerald-600 hover:bg-emerald-700' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', button: 'bg-amber-600 hover:bg-amber-700' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700', button: 'bg-violet-600 hover:bg-violet-700' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700', button: 'bg-indigo-600 hover:bg-indigo-700' },
}

export async function generateStaticParams() {
  return Object.keys(MATERIAS).map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const m = MATERIAS[slug]
  if (!m) return {}
  return {
    title: `${m.name} no ENEM — O que Cai, Dicas e Questões | ENEM Pro`,
    description: m.desc,
    alternates: { canonical: `https://enem-pro-eight.vercel.app/materias/${slug}` },
    openGraph: { title: `${m.name} no ENEM`, description: m.desc },
  }
}

export default async function MateriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const m = MATERIAS[slug]
  if (!m) notFound()

  const c = COLOR_MAP[m.color]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `${m.name} para o ENEM`,
    description: m.desc,
    provider: { '@type': 'Organization', name: 'ENEM Pro', url: 'https://enem-pro-eight.vercel.app' },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      inLanguage: 'pt-BR',
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-zinc-50">
        <header className="bg-white border-b border-zinc-200 px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <Link href="/auth/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            Criar conta grátis
          </Link>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-10">
          <div className="mb-2">
            <Link href="/disciplinas/{m.areaSlug}" className="text-xs text-zinc-500 hover:underline">
              ← {m.area}
            </Link>
          </div>

          <div className={`${c.bg} rounded-2xl p-8 mb-8`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{m.icon}</span>
              <div>
                <span className={`text-xs font-semibold ${c.badge} px-2 py-0.5 rounded-full`}>{m.area}</span>
                <h1 className={`text-3xl font-bold ${c.text} mt-1`}>{m.name} no ENEM</h1>
              </div>
            </div>
            <p className="text-zinc-700 text-lg">{m.desc}</p>
            <p className="text-sm text-zinc-500 mt-2">Aparece em <strong>{m.numQuestoes} questões</strong> por prova</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <h2 className="font-bold text-zinc-900 mb-4">O que cai em {m.name}?</h2>
              <ul className="space-y-2">
                {m.topics.map(t => (
                  <li key={t} className="flex items-start gap-2 text-sm text-zinc-700">
                    <span className={`mt-0.5 ${c.text}`}>•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <h2 className="font-bold text-zinc-900 mb-4">Dicas para {m.name}</h2>
              <ul className="space-y-3">
                {m.dicas.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                    <span className={`font-bold ${c.text} shrink-0`}>{i + 1}.</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={`${c.bg} border border-zinc-200 rounded-2xl p-6 text-center mb-8`}>
            <p className={`text-xl font-bold ${c.text} mb-2`}>Pratique questões reais de {m.name}</p>
            <p className="text-zinc-600 text-sm mb-5">
              O ENEM Pro reúne todas as questões de {m.name} de 2009 a 2024 — com gabarito e explicação da IA para cada erro.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href={`/questoes/${m.areaSlug}`} className={`${c.button} text-white font-bold px-6 py-3 rounded-xl transition-colors`}>
                Ver questões de {m.name}
              </Link>
              <Link href="/auth/register" className="bg-white border border-zinc-300 text-zinc-700 font-semibold px-6 py-3 rounded-xl hover:bg-zinc-50 transition-colors">
                Criar conta grátis
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h2 className="font-bold text-zinc-900 mb-4">Questões por Ano — {m.name}</h2>
            <div className="flex flex-wrap gap-2">
              {[2024,2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009].map(year => (
                <Link
                  key={year}
                  href={`/questoes/${m.areaSlug}/${year}`}
                  className="text-sm px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                >
                  {year}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link href={`/disciplinas/${m.areaSlug}`} className="text-indigo-600 hover:underline">← Voltar para {m.area}</Link>
            <Link href="/calcular-nota" className="text-indigo-600 hover:underline">Calculadora de nota ENEM →</Link>
            <Link href="/cronograma" className="text-indigo-600 hover:underline">Montar cronograma →</Link>
          </div>
        </main>
      </div>
    </>
  )
}
