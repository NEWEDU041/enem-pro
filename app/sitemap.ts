import type { MetadataRoute } from 'next'
import { getAllPostsLight as getAllPosts } from '@/lib/blog-index'
import { SITE_URL } from '@/lib/site-config'
import { fetchQuestionsByYearCached } from '@/lib/questions-cache'
import { disciplineToSlug, YEARS } from '@/lib/enem-api'

const base = SITE_URL

const DISCIPLINES = ['matematica', 'linguagens', 'ciencias-humanas', 'ciencias-natureza']

// Static dates — only change when the page content actually changes
const D = (s: string) => new Date(s)

export const revalidate = 3600 // 1 hora — permite reindexação mais rápida
export const maxDuration = 60

async function getQuestionPages(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = []
  for (const year of YEARS) {
    let questions: Awaited<ReturnType<typeof fetchQuestionsByYearCached>> = []
    try {
      questions = await fetchQuestionsByYearCached(year)
    } catch {
      continue
    }
    for (const q of questions) {
      const slug = disciplineToSlug(q.discipline)
      if (!slug) continue
      pages.push({
        url: `${base}/questoes/${slug}/${year}/${q.id.split('-')[1]}`,
        lastModified: D(`${year}-12-01`),
        changeFrequency: 'yearly' as const,
        priority: year >= 2022 ? 0.6 : 0.5,
      })
    }
  }
  return pages
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const MATERIAS_SLUGS = ['fisica','quimica','biologia','historia','geografia','filosofia','sociologia','portugues','literatura','matematica','ingles']
  const VS_SLUGS = ['descomplica','stoodi','estuda-com','me-salva','khan-academy','poliedro','prepara-enem','estrategia']

  const corePages: MetadataRoute.Sitemap = [
    { url: base, lastModified: D('2026-07-20'), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/planos`, lastModified: D('2026-07-20'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/gabarito`, lastModified: D('2026-07-20'), changeFrequency: 'yearly', priority: 0.90 },
    { url: `${base}/temas-redacao`, lastModified: D('2026-01-01'), changeFrequency: 'yearly', priority: 0.9 },
    { url: `${base}/cronograma`, lastModified: D('2026-07-20'), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/calcular-nota`, lastModified: D('2026-03-01'), changeFrequency: 'monthly', priority: 0.90 },
    { url: `${base}/ferramentas`, lastModified: D('2026-06-01'), changeFrequency: 'monthly', priority: 0.88 },
    { url: `${base}/questao-do-dia`, lastModified: D('2026-06-15'), changeFrequency: 'daily', priority: 0.85 },
    { url: `${base}/questoes`, lastModified: D('2026-07-20'), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${base}/simulado`, lastModified: D('2026-07-20'), changeFrequency: 'monthly', priority: 0.95 },
    { url: `${base}/blog`, lastModified: D('2026-07-20'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/sobre`, lastModified: D('2026-07-20'), changeFrequency: 'yearly', priority: 0.5 },
    ...MATERIAS_SLUGS.map(slug => ({
      url: `${base}/materias/${slug}`,
      lastModified: D('2026-07-20'),
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    })),
  ]

  const disciplinaLandingPages: MetadataRoute.Sitemap = DISCIPLINES.map(slug => ({
    url: `${base}/disciplinas/${slug}`,
    lastModified: D('2026-03-01'),
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }))

  const disciplinePages: MetadataRoute.Sitemap = DISCIPLINES.flatMap(discipline =>
    YEARS.map(year => ({
      url: `${base}/questoes/${discipline}/${year}`,
      lastModified: D(`${year}-12-01`),
      changeFrequency: 'yearly' as const,
      priority: year >= 2022 ? 0.8 : 0.65,
    }))
  )

  const RECENTLY_UPDATED = new Set([
    'questoes-matematica-enem-2022', 'questoes-matematica-enem-2021', 'questoes-matematica-enem-2020',
    'questoes-ciencias-natureza-enem-2022', 'questoes-ciencias-natureza-enem-2021', 'questoes-ciencias-natureza-enem-2020',
    'questoes-humanas-enem-2022', 'questoes-humanas-enem-2021', 'questoes-humanas-enem-2020',
    'questoes-linguagens-enem-2022', 'questoes-linguagens-enem-2021', 'questoes-linguagens-enem-2020',
  ])

  const blogPages: MetadataRoute.Sitemap = getAllPosts().map(post => {
    const isHighPriority =
      post.slug.includes('gabarito') ||
      post.slug.includes('nota-de-corte') ||
      post.slug.includes('resultado-enem') ||
      post.slug.includes('quando-sai') ||
      post.slug.includes('medicina') ||
      post.slug.includes('sisu') ||
      post.slug.includes('prouni') ||
      post.slug.includes('redacao-enem') ||
      post.slug.includes('matematica-financeira') ||
      post.slug.includes('cronograma-enem') ||
      post.slug.includes('como-estudar') ||
      post.slug.includes('questoes-de') ||
      post.slug.includes('banco-de-questoes') ||
      post.slug.includes('enem-2026') ||
      post.slug.includes('enem-2025') ||
      post.slug.includes('analise-prova')
    return {
      url: `${base}/blog/${post.slug}`,
      lastModified: RECENTLY_UPDATED.has(post.slug) ? D('2026-06-23') : new Date(post.date),
      changeFrequency: 'yearly' as const,
      priority: isHighPriority ? 0.8 : 0.65,
    }
  })

  const gabaritoPages: MetadataRoute.Sitemap = YEARS.map(year => ({
    url: `${base}/gabarito/${year}`,
    lastModified: D(`${year}-12-01`),
    changeFrequency: 'yearly' as const,
    priority: year >= 2022 ? 0.95 : 0.85,
  }))

  const vsPages: MetadataRoute.Sitemap = [
    { url: `${base}/vs`, lastModified: D('2026-07-20'), changeFrequency: 'monthly' as const, priority: 0.80 },
    ...VS_SLUGS.map(slug => ({
      url: `${base}/vs/${slug}`,
      lastModified: D('2026-07-20'),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
  ]

  const questionPages = await getQuestionPages()

  return [...corePages, ...gabaritoPages, ...disciplinaLandingPages, ...disciplinePages, ...questionPages, ...blogPages, ...vsPages]
}
