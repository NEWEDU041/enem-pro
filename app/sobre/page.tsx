import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Sobre o ENEM Pro — Equipe Editorial e Missão',
  description:
    'Conheça a equipe de professores e especialistas do ENEM Pro. Missão: ajudar estudantes a conquistar a nota que precisam no ENEM com questões reais e explicações de IA.',
  alternates: { canonical: `${SITE_URL}/sobre` },
  openGraph: {
    title: 'Sobre o ENEM Pro — Equipe Editorial e Missão',
    description:
      'Equipe formada por professores com mais de 10 anos de experiência em preparação para o ENEM. Conteúdo revisado por pedagogos certificados.',
    url: `${SITE_URL}/sobre`,
    siteName: 'ENEM Pro',
    type: 'website',
  },
}

const teamSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'Sobre o ENEM Pro',
  url: `${SITE_URL}/sobre`,
  description:
    'Plataforma de preparação para o ENEM criada por professores e especialistas em educação.',
  mainEntity: {
    '@type': 'EducationalOrganization',
    name: 'ENEM Pro',
    url: SITE_URL,
    foundingDate: '2024',
    description:
      'Plataforma com mais de 176 guias de estudo, questões reais do INEP (2009–2024) e correção de redação por IA.',
    employee: [
      {
        '@type': 'Person',
        name: 'Equipe Editorial ENEM Pro',
        jobTitle: 'Professores e Especialistas em Preparação para o ENEM',
        description:
          'Time composto por professores de Matemática, Ciências da Natureza, Linguagens e Ciências Humanas com experiência em preparatórios para o ENEM.',
      },
    ],
  },
}

export default function SobrePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(teamSchema) }}
      />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 mb-4">Sobre o ENEM Pro</h1>
        <p className="text-zinc-500 text-lg mb-10">
          Criado por professores para estudantes que querem resultados reais no ENEM.
        </p>

        {/* Missão */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-zinc-900 mb-3">Nossa Missão</h2>
          <p className="text-zinc-700 leading-relaxed mb-3">
            O ENEM Pro existe para democratizar a preparação de qualidade. Reunimos mais de 176
            guias de estudo escritos por professores, questões reais do INEP de 2009 a 2024 e
            correção de redação por inteligência artificial — tudo em um só lugar.
          </p>
          <p className="text-zinc-700 leading-relaxed">
            Nossa tecnologia não substitui o professor: ela amplifica. A IA identifica seus pontos
            fracos e direciona o estudo; os professores garantem que o conteúdo é preciso, atualizado
            e alinhado com o que o INEP realmente cobra.
          </p>
        </section>

        {/* Equipe */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">Equipe Editorial</h2>

          <div className="space-y-6">
            {[
              {
                initials: 'EP',
                name: 'Equipe Editorial ENEM Pro',
                role: 'Professores e Especialistas em Preparação para o ENEM',
                bio: 'Time multidisciplinar com professores de Matemática, Ciências da Natureza, Linguagens e Ciências Humanas. Todos com experiência comprovada em preparatórios para o ENEM e cursinhos universitários.',
              },
              {
                initials: 'PE',
                name: 'Revisão Pedagógica',
                role: 'Pedagogos Certificados',
                bio: 'Cada guia publicado passa por revisão pedagógica para garantir clareza, progressão de dificuldade e alinhamento com a Matriz de Referência do ENEM (INEP).',
              },
              {
                initials: 'AT',
                name: 'Atualização Editorial',
                role: 'Atualização Contínua de Conteúdo',
                bio: 'Os guias são revisados a cada edição do ENEM. Datas, estatísticas, notas de corte e informações do SISU são atualizadas imediatamente após divulgação oficial do MEC e INEP.',
              },
            ].map((member) => (
              <div
                key={member.initials}
                className="flex gap-4 p-5 border border-zinc-200 rounded-xl bg-white"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {member.initials}
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">{member.name}</p>
                  <p className="text-sm text-indigo-600 mb-2">{member.role}</p>
                  <p className="text-sm text-zinc-600 leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Compromisso editorial */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-zinc-900 mb-3">Compromisso Editorial</h2>
          <ul className="space-y-3 text-zinc-700">
            {[
              'Todo conteúdo é baseado na Matriz de Referência oficial do INEP',
              'Gabaritos e dados são obtidos exclusivamente de fontes oficiais (INEP, MEC, SISU)',
              'Informações são atualizadas após cada edição do ENEM',
              'Nenhum gabarito ou nota de corte é estimado — apenas dados publicados oficialmente',
              'Conteúdo revisado por professores com formação específica em cada disciplina',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-indigo-600 mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Números */}
        <section className="mb-12 bg-indigo-50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-zinc-900 mb-6 text-center">ENEM Pro em Números</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: '204+', label: 'Guias de Estudo' },
              { value: '2009–2024', label: 'Questões INEP' },
              { value: '9', label: 'Categorias de Conteúdo' },
              { value: '100%', label: 'Dados Oficiais' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-indigo-700">{stat.value}</p>
                <p className="text-sm text-zinc-600 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contato */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 mb-3">Contato e Correções</h2>
          <p className="text-zinc-700 leading-relaxed">
            Encontrou um erro em algum conteúdo? Entre em contato. Levamos a precisão das informações
            a sério — erros são corrigidos em até 48 horas após identificação.
          </p>
          <p className="mt-3 text-zinc-500 text-sm">
            As informações sobre o ENEM mudam a cada edição. Sempre confirme datas, locais de prova e
            resultados no site oficial do{' '}
            <a
              href="https://enem.inep.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 underline"
            >
              INEP
            </a>
            .
          </p>
        </section>
      </main>
    </>
  )
}
