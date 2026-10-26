import { NextRequest, NextResponse } from 'next/server'
import { getAllSlugsLight as getAllSlugs } from '@/lib/blog-index'
import { notifyGoogleBatch } from '@/lib/google-indexing'
import { SITE_URL } from '@/lib/site-config'
import { withErrorHandling } from '@/lib/api-helpers'
import { initLogContext, createRequestLogger, logSuccess, logError, logEvent } from '@/lib/logger'
import { validateQueryParams, SearchConsoleIndexRequestSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// POST /api/search-console-index          → indexa todos os posts
// POST /api/search-console-index?slug=x   → indexa um post específico
export const POST = withErrorHandling(async (request: NextRequest) => {
  const logContext = initLogContext(request)
  const logger = createRequestLogger(logContext)
  
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logError(logger, logContext, {
      status: 401,
      endpoint: '/api/search-console-index',
      error: 'Unauthorized',
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  
  // INPUT VALIDATION for query params
  const validation = validateQueryParams(searchParams, SearchConsoleIndexRequestSchema)
  if (!validation.ok) {
    logError(logger, logContext, {
      status: 400,
      endpoint: '/api/search-console-index',
      error: 'Validation failed',
      metadata: { details: validation.error.details },
    })
    return NextResponse.json(validation.error, { status: 400 })
  }
  const { slug } = validation.data

  let urls: string[]
  if (slug) {
    urls = [`${SITE_URL}/blog/${slug}`]
  } else {
    urls = getAllSlugs().map(s => `${SITE_URL}/blog/${s}`)
  }

  logEvent(logger, 'indexing_start', { totalUrls: urls.length, slug: slug || 'all' })

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    logError(logger, logContext, {
      status: 503,
      endpoint: '/api/search-console-index',
      error: 'GOOGLE_SERVICE_ACCOUNT_KEY not configured',
    })
    return NextResponse.json({ error: 'GOOGLE_SERVICE_ACCOUNT_KEY não configurada' }, { status: 503 })
  }

  const results = await notifyGoogleBatch(urls)
  const ok = results.filter(r => r.status === 200).length
  const fail = results.filter(r => r.status !== 200).length

  logSuccess(logger, logContext, {
    status: 200,
    endpoint: '/api/search-console-index',
    message: 'Indexing completed',
    metadata: { totalUrls: urls.length, successCount: ok, failureCount: fail },
  })

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
