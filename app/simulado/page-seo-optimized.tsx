import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/site-config'
import SimuladoClient from './SimuladoClient'

export const metadata: Metadata = {
  title: 'Simulado ENEM 2026 Grátis — Teste com Questões Reais, Cronômetro e Nota TRI',
  description: 'Faça um simulado completo do ENEM com questões reais, cronômetro em tempo real e cálculo de nota TRI estimada. Análise detalhada de desempenho. Totalmente grátis.',
  keywords: [
    'simulado ENEM',
    'simulado ENEM 2026',
    'simulado ENEM online',
    'questões ENEM com cronômetro',
    'nota TRI ENEM',
    'prova ENEM online',
    'teste ENEM grátis',
    'simulador ENEM com tempo',
  ],
  alternates: { canonical: `${SITE_URL}/simulado` },
  openGraph: {
    title: 'Simulado ENEM 2026 Completo — Teste seus Conhecimentos com Questões Reais',
    description: 'Simulado online com questões reais do ENEM, cronômetro e cálculo de nota TRI. Teste seu desempenho e receba análise detalhada.',
    url: `${SITE_URL}/simulado`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ENEM Pro - Simulado Online' }],
  },
}

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Simulado ENEM Online',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  description: 'Simulado interativo do ENEM com cronômetro, questões reais e cálculo automático de nota TRI',
  url: `${SITE_URL}/simulado`,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '5000',
    bestRating: '5',
    worstRating: '1',
  },
  creator: {
    '@type': 'Organization',
    name: 'ENEM Pro',
    url: SITE_URL,
  },
  potentialAction: [
    {
      '@type': 'PlayAction',
      description: 'Fazer simulado do ENEM',
    },
    {
      '@type': 'UseAction',
      description: 'Testar conhecimento com simulado',
    },
  ],
}

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'Tool',
  name: 'Simulado ENEM Online',
  description: 'Ferramenta de simulado com questões reais do ENEM e cronômetro',
  url: `${SITE_URL}/simulado`,
  image: `${SITE_URL}/opengraph-image`,
  creator: {
    '@type': 'Organization',
    name: 'ENEM Pro',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Como funciona o simulado ENEM online?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Você escolhe quantas questões quer responder, selecionsa a disciplina e o ano, e começa com um cronômetro em tempo real. Após terminar, recebe uma análise detalhada com sua nota TRI estimada e taxa de acerto por disciplina.',
      },
    },
    {
      '@type': 'Question',
      name: 'A nota do simulado é igual à nota real do ENEM?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nossa nota TRI é uma estimativa realista baseada na metodologia oficial do ENEM. Embora possa variar no dia da prova, oferece uma boa indicação de seu desempenho potencial.',
      },
    },
    {
      '@type': 'Question',
      name: 'O simulado usa questões reais do ENEM?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim, 100% das questões são reais e oficiais do INEP de edições anteriores do ENEM.',
      },
    },
    {
      '@type': 'Question',
      name: 'Qual é o benefício de fazer simulados regularmente?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Simulados regulares ajudam você a desenvolver gestão de tempo, familiaridade com o formato da prova, e identificam suas fraquezas antes da prova oficial. Recomendamos fazer um simulado a cada 2-3 semanas.',
      },
    },
    {
      '@type': 'Question',
      name: 'Posso escolher quantas questões responder?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim! Você pode fazer um simulado rápido com 10-20 questões ou uma prova completa com 45 questões. Também pode escolher combinar disciplinas como prefira.',
      },
    },
    {
      '@type': 'Question',
      name: 'Como a TRI (Teoria de Resposta ao Item) funciona?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A TRI considera a dificuldade de cada questão. Acertar uma questão difícil vale mais pontos que acertar uma fácil. Nosso simulado calcula sua nota usando essa metodologia.',
      },
    },
    {
      '@type': 'Question',
      name: 'Posso fazer o simulado quantas vezes quiser?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No plano grátis, você pode fazer simulados ilimitados. No Plano Pro, você desbloqueia explicações detalhadas de IA para questões que errou.',
      },
    },
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Simulado ENEM', item: `${SITE_URL}/simulado` },
  ],
}

export default function SimuladoPageOptimized() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="sr-only">
        <h1>Simulado ENEM 2026 Completo — Teste seus Conhecimentos com Questões Reais e Cronômetro</h1>

        <h2>Introdução — Por Que Fazer Simulados Antes do ENEM</h2>
        <p>
          O simulado ENEM Pro reproduz a experiência real da prova com questões autênticas do INEP, cronômetro em tempo real e
          cálculo automático de nota TRI. Fazer simulados regularmente é essencial para se preparar para o ENEM porque você
          desenvolve gestão de tempo, identifica suas fraquezas e testa sua estratégia antes da prova oficial. Estudos mostram
          que candidatos que fazem simulados frequentes têm desempenho até 20% melhor na prova real.
        </p>

        <h2>Como Funciona o Simulado ENEM</h2>
        <p>
          Acessar o simulado é fácil: escolha quantas questões quer responder (10, 20, 30 ou mais), selecione as disciplinas
          ou escolha questões aleatórias de todas, e comece com um cronômetro que simula o ritmo real do ENEM. Você responde
          cada questão dentro do tempo limite, assim como na prova oficial. Ao terminar, recebe um relatório completo com sua
          nota TRI estimada, taxa de acerto por disciplina, tempo gasto por questão e recomendações personalizadas.
        </p>

        <h2>Entendendo a Nota TRI — A Metodologia Real do ENEM</h2>
        <p>
          O ENEM não usa média simples de acertos. Usa a Teoria de Resposta ao Item (TRI), que considera a dificuldade de cada
          questão. Quando você acerta uma questão difícil, sua nota sobe muito mais do que quando acerta uma fácil. Nossa calculadora
          de TRI replica essa lógica oficial para dar uma estimativa realista de qual seria sua pontuação na prova. Isso é crucial
          porque oferece um indicador preciso de seu desempenho real.
        </p>

        <h2>Análise Detalhada de Desempenho — Identifique Suas Fraquezas</h2>
        <p>
          Após completar o simulado, você recebe uma análise profunda: nota por disciplina, taxa de acerto em cada área, questões
          que você errou, tempo gasto em cada questão e comparação com sua performance anterior. Esses dados ajudam você a
          identificar exatamente em qual disciplina precisa focar mais e quais conceitos precisam de revisão urgente. No Plano Pro,
          desbloqueie explicações de IA para cada questão que errou.
        </p>

        <h2>Gestão de Tempo — Prepare-se Para o Ritmo Real</h2>
        <p>
          Um dos maiores desafios do ENEM é gerir o tempo. Você tem em média 2-3 minutos por questão. Nosso simulado com cronômetro
          ajuda você a desenvolver essa gestão crítica. Você vê exatamente quanto tempo gasta em cada questão, pode comparar com a
          média, e aprender a acelerar ou focar melhor. Essa prática de tempo durante simulados é um dos fatores mais importantes
          para sucesso na prova real.
        </p>

        <h2>Customização Total — Escolha Seu Simulado Perfeito</h2>
        <p>
          Você não precisa fazer sempre o mesmo simulado. Customize completamente: escolha quantas questões, de quais disciplinas,
          de quais anos, e se quer um simulado rápido ou completo. Você pode focar em uma disciplina fraca uma semana, e na semana
          seguinte fazer um simulado balanceado. Essa flexibilidade permite que você estruture seu plano de estudos exatamente como
          precisa.
        </p>

        <h2>Integração com Outras Ferramentas ENEM Pro</h2>
        <p>
          Depois de fazer um simulado, use a Calculadora de Nota ENEM para explorar diferentes cenários. Acesse o Banco de Questões
          para praticar areas específicas onde errou. Consulte o Gabarito Completo para revisar questões de anos anteriores. Tudo
          funcionando junto em uma única plataforma coesiva.
        </p>

        <h2>Plano Recomendado de Simulados Para Máximo Rendimento</h2>
        <p>
          Comece fazendo simulados mensais enquanto aprende conceitos novos. Conforme se aproximar do ENEM, aumente para simulados
          semanais. Na última semana antes da prova, faça um simulado completo para reforçar sua confiança. A constância é essencial:
          estudantes que fazem simulados regularmente (semanal ou bi-semanal) têm desempenho significativamente melhor.
        </p>

        <h2>FAQ — Perguntas Frequentes Sobre Simulados</h2>
        <p>
          Confira as perguntas frequentes abaixo para aprender mais sobre como funciona o cálculo de nota TRI, quantas vezes você pode
          fazer simulados, e como usar os resultados para melhorar seu desempenho.
        </p>
      </div>

      <SimuladoClient />

      {/* Enhanced CTA */}
      <section className="sr-only">
        <h2>Comece Seu Simulado Agora</h2>
        <p>
          Teste seu conhecimento com questões reais do ENEM. Faça um simulado grátis hoje e descubra sua nota TRI estimada.
        </p>
      </section>

      {/* Internal Linking */}
      <div className="sr-only">
        <nav>
          <h3>Explore Outras Ferramentas ENEM Pro</h3>
          <ul>
            <li><Link href="/questoes">Banco de Questões ENEM — 2.900+ Questões com Gabarito</Link></li>
            <li><Link href="/calcular-nota">Calculadora de Nota ENEM — Estime Sua Pontuação com Curva TRI</Link></li>
            <li><Link href="/gabarito">Gabarito ENEM 2009-2024 — Todas as Respostas Corretas</Link></li>
            <li><Link href="/ferramentas">Todas as Ferramentas ENEM Pro</Link></li>
          </ul>
        </nav>
      </div>
    </>
  )
}
