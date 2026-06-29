import { getAllSlugs } from '@/lib/blog-data'
import { SITE_URL } from '@/lib/site-config'

const KEY = '6f7796920fdc4262ac71d91b405fc939'
const HOST = new URL(SITE_URL).hostname

const STATIC_PATHS = [
  '/', '/planos', '/gabarito', '/temas-redacao', '/cronograma',
  '/calcular-nota', '/ferramentas', '/questao-do-dia', '/questoes',
  '/simulado', '/blog',
]

const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
]

export async function submitIndexNow(): Promise<{ submitted: number; results: Record<string, number> }> {
  const blogUrls = getAllSlugs().map(slug => `/blog/${slug}`)
  const urlList = [...STATIC_PATHS, ...blogUrls].map(p => `${SITE_URL}${p}`)
  const body = { host: HOST, key: KEY, keyLocation: `${SITE_URL}/${KEY}.txt`, urlList }
  const results: Record<string, number> = {}

  await Promise.allSettled(
    ENDPOINTS.map(async (endpoint) => {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(body),
        })
        results[endpoint] = res.status
      } catch {
        results[endpoint] = 0
      }
    })
  )

  return { submitted: urlList.length, results }
}
