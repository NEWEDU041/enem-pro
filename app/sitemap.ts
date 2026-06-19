import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog-data'
import { SITE_URL } from '@/lib/site-config'

const base = SITE_URL

const DISCIPLINES = ['matematica', 'linguagens', 'ciencias-humanas', 'ciencias-natureza']
const YEARS = [2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009]

// Static dates — only change when the page content actually changes
const D = (s: string) => new Date(s)

export default function sitemap(): MetadataRoute.Sitemap {
  const MATERIAS_SLUGS = ['fisica','quimica','biologia','historia','geografia','filosofia','sociologia','portugues','literatura','matematica','ingles']
  const VS_SLUGS = ['descomplica','stoodi','estuda-com','me-salva','khan-academy','poliedro','gauss','prepara-enem','estrategia']

  const corePages: MetadataRoute.Sitemap = [
    { url: base, lastModified: D('2026-06-15'), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/planos`, lastModified: D('2026-06-01'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/gabarito`, lastModified: D('2024-11-15'), changeFrequency: 'yearly', priority: 0.98 },
    { url: `${base}/temas-redacao`, lastModified: D('2026-01-01'), changeFrequency: 'yearly', priority: 0.9 },
    { url: `${base}/cronograma`, lastModified: D('2026-06-01'), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/calcular-nota`, lastModified: D('2026-03-01'), changeFrequency: 'monthly', priority: 0.92 },
    { url: `${base}/ferramentas`, lastModified: D('2026-06-01'), changeFrequency: 'monthly', priority: 0.88 },
    { url: `${base}/questao-do-dia`, lastModified: D('2026-06-15'), changeFrequency: 'daily', priority: 0.85 },
    { url: `${base}/questoes`, lastModified: D('2026-03-01'), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/simulado`, lastModified: D('2026-06-01'), changeFrequency: 'monthly', priority: 0.82 },
    { url: `${base}/blog`, lastModified: D('2026-06-19'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/sobre`, lastModified: D('2026-06-17'), changeFrequency: 'yearly', priority: 0.5 },
    ...MATERIAS_SLUGS.map(slug => ({
      url: `${base}/materias/${slug}`,
      lastModified: D('2026-03-01'),
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
      post.slug.includes('redacao-enem-conclusao') ||
      post.slug.includes('matematica-financeira') ||
      post.slug.includes('cronograma-enem') ||
      post.slug.includes('como-estudar') ||
      post.slug.includes('questoes-de') ||
      post.slug.includes('banco-de-questoes') ||
      post.slug.includes('enem-2026')
    return {
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'yearly' as const,
      priority: isHighPriority ? 0.8 : 0.65,
    }
  })

  const gabaritoPages: MetadataRoute.Sitemap = [2024,2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009].map(year => ({
    url: `${base}/gabarito/${year}`,
    lastModified: D(`${year}-12-01`),
    changeFrequency: 'yearly' as const,
    priority: year >= 2022 ? 0.95 : 0.85,
  }))

  const vsPages: MetadataRoute.Sitemap = [
    { url: `${base}/vs`, lastModified: D('2026-06-15'), changeFrequency: 'monthly' as const, priority: 0.85 },
    ...VS_SLUGS.map(slug => ({
      url: `${base}/vs/${slug}`,
      lastModified: D('2026-06-15'),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]

  return [...corePages, ...gabaritoPages, ...disciplinaLandingPages, ...disciplinePages, ...blogPages, ...vsPages]
}
