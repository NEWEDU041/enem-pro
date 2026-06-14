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
  const VS_SLUGS = ['descomplica','stoodi','estuda-com','me-salva','khan-academy','poliedro','gauss']

  const corePages: MetadataRoute.Sitemap = [
    { url: base, lastModified: D('2026-06-09'), changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/planos`, lastModified: D('2026-05-01'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/gabarito`, lastModified: D('2024-11-15'), changeFrequency: 'yearly', priority: 0.95 },
    { url: `${base}/temas-redacao`, lastModified: D('2026-01-01'), changeFrequency: 'yearly', priority: 0.9 },
    { url: `${base}/cronograma`, lastModified: D('2026-01-01'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/calcular-nota`, lastModified: D('2026-03-01'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/ferramentas`, lastModified: D('2026-03-01'), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/questao-do-dia`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
    { url: `${base}/questoes`, lastModified: D('2026-03-01'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/blog`, lastModified: D('2026-06-14'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/auth/login`, lastModified: D('2026-01-01'), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/auth/register`, lastModified: D('2026-01-01'), changeFrequency: 'yearly', priority: 0.7 },
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

  const blogPages: MetadataRoute.Sitemap = getAllPosts().map(post => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'yearly' as const,
    priority: post.slug.includes('gabarito') || post.slug.includes('calcular-nota') || post.slug.includes('nota-de-corte') ? 0.8 : 0.65,
  }))

  const gabaritoPages: MetadataRoute.Sitemap = [2024,2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009].map(year => ({
    url: `${base}/gabarito/${year}`,
    lastModified: D(`${year}-12-01`),
    changeFrequency: 'yearly' as const,
    priority: year >= 2022 ? 0.95 : 0.85,
  }))

  const vsPages: MetadataRoute.Sitemap = VS_SLUGS.map(slug => ({
    url: `${base}/vs/${slug}`,
    lastModified: D('2026-05-01'),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [...corePages, ...gabaritoPages, ...disciplinaLandingPages, ...disciplinePages, ...blogPages, ...vsPages]
}
