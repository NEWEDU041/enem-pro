import type { MetadataRoute } from 'next'

const base = 'https://enem-pro-eight.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/planos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/auth/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/auth/register`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.7 },
    { url: `${base}/questoes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ]
}
