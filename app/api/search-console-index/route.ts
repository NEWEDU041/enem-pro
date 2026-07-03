import { NextRequest, NextResponse } from 'next/server'
import { getAllSlugsLight as getAllSlugs } from '@/lib/blog-index'
import { notifyGoogleBatch } from '@/lib/google-indexing'
import { SITE_URL } from '@/lib/site-config'
import { withErrorHandling } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

// POST /api/search-console-index          → indexa todos os posts
// POST /api/search-console-index?slug=x   → indexa um post específico
export const POST = withErrorHandling(async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  let urls: string[]
  if (slug) {
    urls = [`${SITE_URL}/blog/${slug}`]
  } else {
    urls = getAllSlugs().map(s => `${SITE_URL}/blog/${s}`)
  }

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return NextResponse.json({ error: 'GOOGLE_SERVICE_ACCOUNT_KEY não configurada' }, { status: 503 })
  }

  const results = await notifyGoogleBatch(urls)
  const ok = results.filter(r => r.status === 200).length
  const fail = results.filter(r => r.status !== 200).length

  return NextResponse.json({ total: urls.length, ok, fail, results })
})

// GET: indexa os 12 posts expandidos recentemente (uso manual/admin)
export const GET = withErrorHandling(async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const PRIORITY_SLUGS = [
    'questoes-matematica-enem-2022', 'questoes-matematica-enem-2021', 'questoes-matematica-enem-2020',
    'questoes-ciencias-natureza-enem-2022', 'questoes-ciencias-natureza-enem-2021', 'questoes-ciencias-natureza-enem-2020',
    'questoes-humanas-enem-2022', 'questoes-humanas-enem-2021', 'questoes-humanas-enem-2020',
    'questoes-linguagens-enem-2022', 'questoes-linguagens-enem-2021', 'questoes-linguagens-enem-2020',
  ]

  const urls = PRIORITY_SLUGS.map(s => `${SITE_URL}/blog/${s}`)

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return NextResponse.json({ error: 'GOOGLE_SERVICE_ACCOUNT_KEY não configurada' }, { status: 503 })
  }

  const results = await notifyGoogleBatch(urls)
  const ok = results.filter(r => r.status === 200).length

  return NextResponse.json({ total: urls.length, ok, results })
})
