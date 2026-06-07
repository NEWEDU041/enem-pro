import type { MetadataRoute } from 'next'
import { getAllSlugs } from '@/lib/blog-data'

const base = 'https://enem-pro-eight.vercel.app'

const DISCIPLINES = ['matematica', 'linguagens', 'ciencias-humanas', 'ciencias-natureza']
const YEARS = [2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009]

export default function sitemap(): MetadataRoute.Sitemap {
  const corePages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/planos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/questoes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/auth/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/auth/register`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.7 },
  ]

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

  return [...corePages, ...disciplinePages, ...blogPages]
}
