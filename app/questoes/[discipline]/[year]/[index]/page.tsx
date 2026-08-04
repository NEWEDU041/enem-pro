import { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { fetchSingleQuestionCached } from '@/lib/questions-cache'
import { SITE_URL } from '@/lib/site-config'
import { previewText } from '@/lib/text-preview'
import { SLUG_TO_DISCIPLINE, disciplineToSlug, YEARS as VALID_YEARS } from '@/lib/enem-api'
import { createServerClient } from '@/lib/supabase'
import QuestionText from '@/components/QuestionText'
import RelatedContent from '@/components/RelatedContent'
import { getRelatedBlogPostsForQuestions } from '@/lib/related-content'

export const revalidate = 86400

type Params = { discipline: string; year: string; index: string }

async function getQuestion(year: string, index: string) {
  const yearNum = parseInt(year)
  const idxNum = parseInt(index)
  if (!VALID_YEARS.includes(yearNum) || !Number.isInteger(idxNum) || idxNum < 1) return null
  try {
    return await fetchSingleQuestionCached(yearNum, idxNum)
  } catch {
    return null
  }
}

// Truncate `s` so it plus every char of `fixedPartsLength` fits within `max`.
function truncateToBudget(s: string, fixedPartsLength: number, max: number): string {
  const budget = Math.max(20, max - fixedPartsLength)
  if (s.length <= budget) return s
  return s.slice(0, budget - 1).trimEnd() + '…'
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { discipline, year, index } = await params
  const disc = SLUG_TO_DISCIPLINE[discipline]
  if (!disc) return {}
  const question = await getQuestion(year, index)
  if (!question) return {}

  const snippet = previewText(question.alternativesIntroduction) || previewText(question.context) || question.title
  const shortDisc = disc.split(',')[0]

  // Persuasive title: include numbers, year, emotional hook
  // Keep under ~60 chars (Google's SERP truncation)
  const titleSuffix = ` | ENEM ${year} Resolvida`
  const titleSnippet = truncateToBudget(snippet, titleSuffix.length, 60)
  const persuasiveTitle = `${titleSnippet}${titleSuffix}`

  // Persuasive description: urgency, value proposition, CTA
  // Keep under ~155 chars
  const isOldExam = parseInt(year) <= 2015
  const descPrefix = isOldExam
    ? `✅ Questão ${shortDisc} ENEM ${year} com gabarito + explicação grátis de IA: `
    : `🎯 Questão ${shortDisc} ENEM ${year} — Aprenda resolvendo agora: `
  const descSuffix = isOldExam
    ? ` Resposta: ${question.correctAlternative}. Entenda o conceito!`
    : ` Resposta: ${question.correctAlternative}. Veja explicação completa.`
  const descSnippet = truncateToBudget(snippet, descPrefix.length + descSuffix.length, 155)
  const persuasiveDesc = `${descPrefix}${descSnippet}${descSuffix}`

  return {
    title: persuasiveTitle,
    description: persuasiveDesc,
    alternates: { canonical: `${SITE_URL}/questoes/${discipline}/${year}/${index}` },
    openGraph: {
      title: `${shortDisc} ENEM ${year} | Questão Resolvida com IA`,
      description: `Gabarito + explicação. Aprenda a resolver: ${snippet.substring(0, 80)}...`,
    },
  }
}

export default async function QuestionDetailPage({ params }: { params: Promise<Params> }) {
  const { discipline, year, index } = await params
  const disc = SLUG_TO_DISCIPLINE[discipline]
  if (!disc) notFound()

  const question = await getQuestion(year, index)
  if (!question) notFound()

  // Canonicalize: the API index is global per year, not per discipline —
  // redirect to the correct discipline slug if the URL guessed wrong.
  const correctSlug = disciplineToSlug(question.discipline)
  if (correctSlug && correctSlug !== discipline) {
    redirect(`/questoes/${correctSlug}/${year}/${index}`)
  }

  const shortDisc = disc.split(',')[0]
  const correctAlt = question.alternatives?.find(a => a.letter === question.correctAlternative)
  const enunciado = question.alternativesIntroduction || question.context || question.title
  const enunciadoPreview = previewText(enunciado)

  const supabase = createServerClient()
  const { data: explanationRow } = await supabase
    .from('question_explanations')
    .select('explanation')
    .eq('question_id', question.id)
    .maybeSingle()
  const explanation = explanationRow?.explanation as string | undefined

  // Years 2009-2015: show full explanation (SEO anchor). Years 2016-2024: paywall with larger teaser
  const yearNum = parseInt(year)
  const teaserMaxLength = yearNum <= 2015 ? Infinity : 750
  const explanationTeaser = explanation
    ? (explanation.length > teaserMaxLength ? explanation.slice(0, teaserMaxLength) + '…' : explanation)
    : null

  const pageUrl = `${SITE_URL}/questoes/${discipline}/${year}/${index}`
  const questionName = enunciadoPreview.length > 110 ? enunciadoPreview.slice(0, 107) + '...' : enunciadoPreview

  // Add FAQ Schema for better SERP appearance
  const faqItems = [
    {
      '@type': 'Question',
      name: `Qual é a resposta correta da questão ${index}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `A resposta correta é a alternativa ${question.correctAlternative}. ${previewText(correctAlt?.text)}`,
      },
    },
    {
      '@type': 'Question',
      name: `Como resolver essa questão de ${shortDisc}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Veja a explicação completa por IA. A questão trata sobre ${question.title}.`,
      },
    },
    {
      '@type': 'Question',
      name: `Essa questão é fácil ou difícil?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Questão do ENEM ${year}. Nível de dificuldade médio. Pratique com explicação de IA.`,
      },
    },
  ]

  const qaLd = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: questionName || question.title,
      text: enunciadoPreview || question.title,
      answerCount: 1,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Alternativa correta: ${question.correctAlternative}) ${previewText(correctAlt?.text)}`.trim(),
      },
    },
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems,
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: shortDisc, item: `${SITE_URL}/questoes/${discipline}/${year}` },
      { '@type': 'ListItem', position: 3, name: `Questão ${index}`, item: pageUrl },
    ],
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(qaLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <nav className="sticky top-0 z-50 bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-zinc-600 hover:text-zinc-900">Entrar</Link>
            <Link href="/auth/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <nav className="text-xs text-zinc-500 mb-6">
          <Link href="/" className="hover:text-zinc-700">Início</Link>
          {' / '}
          <Link href={`/questoes/${discipline}/${year}`} className="hover:text-zinc-700">{shortDisc} {year}</Link>
          {' / '}
          <span className="text-zinc-600">Questão {index}</span>
        </nav>

        <h1 className="text-2xl font-bold text-zinc-900 mb-1">
          Questão {index} — ENEM {year} — {shortDisc}
        </h1>
        <p className="text-sm text-zinc-500 mb-6">
          Gabarito oficial com explicação por IA — fonte:{' '}
          <a
            href={`https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/${year}`}
            target="_blank"
            rel="noopener nofollow"
            className="text-indigo-600 hover:underline"
          >
            INEP — Provas e Gabaritos ENEM {year}
          </a>
        </p>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
          {question.context && <QuestionText text={question.context} />}
          {question.alternativesIntroduction && (
            <div className="mt-3">
              <QuestionText text={question.alternativesIntroduction} />
            </div>
          )}

          <div className="mt-5 space-y-2">
            {question.alternatives?.map(alt => {
              const isCorrect = alt.letter === question.correctAlternative
              return (
                <div
                  key={alt.letter}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${isCorrect ? 'border-green-300 bg-green-50' : 'border-zinc-200'}`}
                >
                  <span className={`shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isCorrect ? 'bg-green-600 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                    {alt.letter}
                  </span>
                  <div className="flex-1 min-w-0">
                    {alt.text ? (
                      <QuestionText text={alt.text} />
                    ) : alt.file ? (
                      <QuestionText text={`![](${alt.file})`} />
                    ) : (
                      <span className="italic text-zinc-500">Conteúdo desta alternativa indisponível</span>
                    )}
                  </div>
                  {isCorrect && <span className="text-xs font-semibold text-green-700 shrink-0">Correta</span>}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
          <h2 className="font-bold text-zinc-900 mb-2">Explicação por IA</h2>
          {explanationTeaser ? (
            <>
              <p className="text-sm text-zinc-700 leading-relaxed">{explanationTeaser}</p>
              {explanation && explanation.length > teaserMaxLength && (
                <Link href="/auth/register" className="inline-block mt-3 text-sm font-semibold text-indigo-600 hover:underline">
                  Desbloqueie explicação completa + simulados, cronograma e correção de redação →
                </Link>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-500">
              Explicações completas com simulados, cronograma de estudo e correção de redação disponíveis no{' '}
              <Link href="/planos" className="text-indigo-600 font-semibold hover:underline">Plano Pro</Link>.
            </p>
          )}
        </div>

        <RelatedContent
          title="📚 Saiba mais sobre esse tema"
          items={getRelatedBlogPostsForQuestions(question.discipline)}
        />

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/questoes/${discipline}/${year}`}
            className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            ← Todas as questões de {shortDisc} {year}
          </Link>
          <Link
            href={`/gabarito/${year}`}
            className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            Gabarito completo ENEM {year}
          </Link>
        </div>
      </main>

      <footer className="bg-zinc-900 text-zinc-400 text-sm py-8 px-6 text-center mt-16">
        <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
      </footer>
    </div>
  )
}
