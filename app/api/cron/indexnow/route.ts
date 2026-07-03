import { NextRequest, NextResponse } from 'next/server'
import { getAllSlugsLight as getAllSlugs } from '@/lib/blog-index'
import { SITE_URL } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

const KEY = '6f7796920fdc4262ac71d91b405fc939'
const HOST = new URL(SITE_URL).hostname
const BASE = SITE_URL

const STATIC_PATHS = [
  '/', '/planos', '/gabarito', '/temas-redacao', '/cronograma',
  '/calcular-nota', '/ferramentas', '/questao-do-dia', '/questoes',
  '/simulado', '/blog',
]

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const blogUrls = getAllSlugs().map(slug => `/blog/${slug}`)
  const urlList = [...STATIC_PATHS, ...blogUrls].map(p => `${BASE}${p}`)

  const body = { host: HOST, key: KEY, keyLocation: `${BASE}/${KEY}.txt`, urlList }
  const results: Record<string, number> = {}

  for (const endpoint of [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
  ]) {
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
  }

  return NextResponse.json({ submitted: urlList.length, results })
}
