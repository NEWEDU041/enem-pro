import { NextRequest, NextResponse } from 'next/server'
import { JWT } from 'google-auth-library'
import { getAllSlugs } from '@/lib/blog-data'
import { SITE_URL } from '@/lib/site-config'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const INSPECT_API = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']
const SITE = SITE_URL + '/'

const STATIC_URLS = [
  '/',
  '/gabarito',
  '/gabarito/2024',
  '/gabarito/2023',
  '/gabarito/2022',
  '/calcular-nota',
  '/temas-redacao',
  '/questoes',
  '/questao-do-dia',
  '/simulado',
  '/planos',
  '/blog',
  '/ferramentas',
  '/cronograma',
].map(p => `${SITE_URL}${p}`)

const PRIORITY_BLOG = [
  'o-que-levar-no-dia-do-enem',
  'redacao-enem-nota-1000',
  'medicina-enem-nota-de-corte',
  'o-que-mais-cai-no-enem',
  'quantas-questoes-tem-o-enem',
  'horario-prova-enem-2026',
  'estrutura-redacao-enem',
  'cronograma-enem',
  'enem-nota-maxima',
  'cronograma-enem-3-meses',
  'cronograma-enem-6-meses',
  'questoes-matematica-enem-2022',
].map(s => `${SITE_URL}/blog/${s}`)

function getJwt(): JWT | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) return null
  try {
    const key = JSON.parse(raw)
    return new JWT({ email: key.client_email, key: key.private_key, scopes: SCOPES })
  } catch { return null }
}

type InspectResult = {
  url: string
  state: string
  crawled: string | null
  canonical: string | null
  mobile: boolean | null
}

async function inspectUrl(token: string, url: string): Promise<InspectResult> {
  try {
    const res = await fetch(INSPECT_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE }),
    })
    if (!res.ok) return { url, state: `HTTP_${res.status}`, crawled: null, canonical: null, mobile: null }
    const data = await res.json()
    const r = data.inspectionResult?.indexStatusResult
    return {
      url,
      state: r?.coverageState ?? 'UNKNOWN',
      crawled: r?.lastCrawlTime ?? null,
      canonical: r?.googleCanonical ?? null,
      mobile: r?.crawledAs === 'MOBILE' ? true : r?.crawledAs === 'DESKTOP' ? false : null,
    }
  } catch (e) {
    return { url, state: `ERROR: ${e}`, crawled: null, canonical: null, mobile: null }
  }
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mode = req.nextUrl.searchParams.get('mode') ?? 'priority'

  const jwt = getJwt()
  if (!jwt) return NextResponse.json({ error: 'SA key missing' }, { status: 500 })
  const { token } = await jwt.getAccessToken()
  if (!token) return NextResponse.json({ error: 'Token failed' }, { status: 500 })

  let urls: string[]
  if (mode === 'all-blog') {
    urls = getAllSlugs().map(s => `${SITE_URL}/blog/${s}`)
  } else if (mode === 'static') {
    urls = STATIC_URLS
  } else {
    urls = [...STATIC_URLS, ...PRIORITY_BLOG]
  }

  // Inspeciona em batches de 5 com delay para respeitar rate limit GSC
  const results: InspectResult[] = []
  const BATCH = 5
  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH)
    const batchResults = await Promise.all(batch.map(u => inspectUrl(token, u)))
    results.push(...batchResults)
    if (i + BATCH < urls.length) await new Promise(r => setTimeout(r, 500))
  }

  const indexed = results.filter(r => r.state === 'Submitted and indexed').length
  const discovered = results.filter(r => r.state.includes('not indexed')).length
  const crawled = results.filter(r => r.state.includes('Crawled')).length
  const unknown = results.filter(r => !['Submitted and indexed'].includes(r.state) && !r.state.includes('not indexed')).length

  return NextResponse.json({
    total: results.length,
    indexed,
    discovered_not_indexed: discovered,
    crawled_not_indexed: crawled,
    other: unknown,
    results,
  })
}
