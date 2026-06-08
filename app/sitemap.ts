import type { MetadataRoute } from 'next'
import { getAllSlugs } from '@/lib/blog-data'

const base = 'https://enem-pro-eight.vercel.app'

const DISCIPLINES = ['matematica', 'linguagens', 'ciencias-humanas', 'ciencias-natureza']
const YEARS = [2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009]

export default function sitemap(): MetadataRoute.Sitemap {
  const MATERIAS_SLUGS = ['fisica','quimica','biologia','historia','geografia','filosofia','sociologia','portugues','literatura','matematica','ingles']

  const corePages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/planos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/gabarito`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.95 },
    { url: `${base}/temas-redacao`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.9 },
    { url: `${base}/cronograma`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/calcular-nota`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/ferramentas`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/questao-do-dia`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
    { url: `${base}/questoes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/auth/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/auth/register`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.7 },
    ...MATERIAS_SLUGS.map(slug => ({
      url: `${base}/materias/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    })),
  ]

  const disciplinaLandingPages: MetadataRoute.Sitemap = DISCIPLINES.map(slug => ({
    url: `${base}/disciplinas/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }))

  const disciplinePages: MetadataRoute.Sitemap = DISCIPLINES.flatMap(discipline =>
    YEARS.map(year => ({
      url: `${base}/questoes/${discipline}/${year}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    }))
  )

  const blogPages: MetadataRoute.Sitemap = getAllSlugs().map(slug => ({
    url: `${base}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const gabaritoPages: MetadataRoute.Sitemap = [2024,2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009].map(year => ({
    url: `${base}/gabarito/${year}`,
    lastModified: new Date(),
    changeFrequency: 'yearly' as const,
    priority: 0.9,
  }))

  return [...corePages, ...gabaritoPages, ...disciplinaLandingPages, ...disciplinePages, ...blogPages]
}
