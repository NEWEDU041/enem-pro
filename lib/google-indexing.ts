import { JWT } from 'google-auth-library'
import { getAllSlugsLight as getAllSlugs } from '@/lib/blog-index'
import { SITE_URL } from '@/lib/site-config'
import { YEARS as ENEM_YEARS, SLUG_TO_DISCIPLINE, disciplineToSlug } from '@/lib/enem-api'
import { fetchQuestionsByYearCached } from '@/lib/questions-cache'

const INDEXING_API = 'https://indexing.googleapis.com/v3/urlNotifications:publish'
const SCOPES = ['https://www.googleapis.com/auth/indexing']

// Drip diário: domínio novo tem crawl budget baixo, então enviamos 10 posts/dia
// em rotação ao invés de todos de uma vez. Prioriza os posts de maior valor.
const DAILY_LIMIT = 10

// Posts de maior potencial de busca — vão primeiro na rotação.
const PRIORITY_SLUGS = [
  // Leva 25/06 — informacionais alto volume, indexar primeiro
  'quantas-questoes-tem-o-enem',
  'horario-prova-enem-2026',
  'redacao-enem-quantas-linhas',
  // Leva 24/06 — alto volume sazonal, indexar primeiro
  'o-que-levar-no-dia-do-enem',
  'o-que-nao-pode-levar-no-enem',
  'quantos-acertos-para-passar-no-enem',
  'o-que-mais-cai-no-enem',
  'local-de-prova-enem-2026',
  'cartao-de-confirmacao-enem-2026',
  'bolsa-prouni-100-como-conseguir',
  'encceja-2026-certificado-ensino-medio',
  'medicina-enem-nota-de-corte',
  'redacao-enem-nota-1000',
  'estrutura-redacao-enem',
  'engenharia-nota-de-corte-enem',
  'direito-nota-de-corte-enem',
  'enem-nota-maxima',
  'cursinho-online-enem',
  'melhor-curso-pre-enem-online',
  'questoes-matematica-enem-2022',
  'questoes-matematica-enem-2021',
  'questoes-ciencias-natureza-enem-2022',
  'questoes-humanas-enem-2022',
  'questoes-linguagens-enem-2022',
]

function getJwt(): JWT | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) return null
  try {
    const key = JSON.parse(raw)
    return new JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: SCOPES,
    })
  } catch {
    return null
  }
}

export async function notifyGoogle(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'): Promise<number> {
  const jwt = getJwt()
  if (!jwt) return 0

  try {
    const res = await jwt.request({
      url: INDEXING_API,
      method: 'POST',
      data: { url, type },
    })
    return (res as { status: number }).status
  } catch {
    return 0
  }
}

export async function notifyGoogleBatch(urls: string[]): Promise<{ url: string; status: number }[]> {
  const jwt = getJwt()
  if (!jwt) return urls.map(url => ({ url, status: 0 }))

  const results: { url: string; status: number }[] = []
  // Google Indexing API: max 100 requests/day per URL, batch with small delay
  for (const url of urls) {
    const status = await notifyGoogle(url)
    results.push({ url, status })
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200))
  }
  return results
}

// Ordena: prioritários primeiro (na ordem definida), depois o resto.
function orderedSlugs(): string[] {
  const all = getAllSlugs()
  const prioritySet = new Set(PRIORITY_SLUGS)
  const priorityExisting = PRIORITY_SLUGS.filter(s => all.includes(s))
  const rest = all.filter(s => !prioritySet.has(s))
  return [...priorityExisting, ...rest]
}

// Janela do dia: cicla por toda a lista a cada N dias.
function dailyWindow(slugs: string[]): string[] {
  const dayIndex = Math.floor(Date.now() / 86_400_000) // dias desde epoch
  const windows = Math.ceil(slugs.length / DAILY_LIMIT)
  const w = dayIndex % windows
  return slugs.slice(w * DAILY_LIMIT, w * DAILY_LIMIT + DAILY_LIMIT)
}

const WEBMASTERS_SCOPE = 'https://www.googleapis.com/auth/webmasters'

// Submete o sitemap.xml ao Google Search Console.
export async function submitGscSitemap(): Promise<{ ok: boolean; status?: number; error?: string }> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) return { ok: false, error: 'GOOGLE_SERVICE_ACCOUNT_KEY não configurada' }
  try {
    const key = JSON.parse(raw)
    const jwt = new JWT({ email: key.client_email, key: key.private_key, scopes: [WEBMASTERS_SCOPE] })
    const { token } = await jwt.getAccessToken()
    const siteEncoded = encodeURIComponent(SITE_URL + '/')
    const sitemapEncoded = encodeURIComponent(`${SITE_URL}/sitemap.xml`)
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${siteEncoded}/sitemaps/${sitemapEncoded}`,
      { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
    )
    return { ok: res.ok, status: res.status }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

const QUESTION_DAILY_LIMIT = 20

// Pool de URLs de questões: listagens (não confirmadas indexadas) primeiro,
// depois a cauda longa de páginas individuais por questão.
async function buildQuestionUrlPool(): Promise<string[]> {
  const urls: string[] = []

  for (const slug of Object.keys(SLUG_TO_DISCIPLINE)) {
    for (const year of ENEM_YEARS) {
      urls.push(`${SITE_URL}/questoes/${slug}/${year}`)
    }
  }
  for (const year of ENEM_YEARS) {
    urls.push(`${SITE_URL}/gabarito/${year}`)
  }

  for (const year of ENEM_YEARS) {
    try {
      const questions = await fetchQuestionsByYearCached(year)
      for (const q of questions) {
        const slug = disciplineToSlug(q.discipline)
        if (!slug) continue
        urls.push(`${SITE_URL}/questoes/${slug}/${year}/${q.id.split('-')[1]}`)
      }
    } catch {
      // pula o ano se o fetch falhar — tenta de novo no próximo drip
    }
  }

  return urls
}

// Janela do dia, com offset próprio pra não ciclar em sincronia com o drip de blog.
function questionDailyWindow(urls: string[]): string[] {
  const dayIndex = Math.floor(Date.now() / 86_400_000) + 1000
  const windows = Math.ceil(urls.length / QUESTION_DAILY_LIMIT)
  if (windows === 0) return []
  const w = dayIndex % windows
  return urls.slice(w * QUESTION_DAILY_LIMIT, w * QUESTION_DAILY_LIMIT + QUESTION_DAILY_LIMIT)
}

// Drip diário de indexação para páginas de questões (listagens + individuais):
// 20 URLs/dia em rotação, listagens não-indexadas primeiro.
export async function dripDailyQuestionIndex() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return { error: 'GOOGLE_SERVICE_ACCOUNT_KEY não configurada', total: 0, indexed: 0, fail: 0, urls: [] as string[] }
  }

  const pool = await buildQuestionUrlPool()
  const urls = questionDailyWindow(pool)

  const results = await notifyGoogleBatch(urls)
  const indexed = results.filter(r => r.status === 200).length

  return { total: urls.length, indexed, fail: urls.length - indexed, urls }
}

// Drip diário de indexação: 10 posts/dia em rotação, prioritários primeiro.
export async function dripDailyGoogleIndex() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return { error: 'GOOGLE_SERVICE_ACCOUNT_KEY não configurada', total: 0, indexed: 0, fail: 0, urls: [] as string[] }
  }

  const slugs = orderedSlugs()
  const batch = dailyWindow(slugs)
  const urls = batch.map(s => `${SITE_URL}/blog/${s}`)

  const results = await notifyGoogleBatch(urls)
  const indexed = results.filter(r => r.status === 200).length

  return { total: urls.length, indexed, fail: urls.length - indexed, urls }
}
