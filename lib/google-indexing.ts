import { JWT } from 'google-auth-library'

const INDEXING_API = 'https://indexing.googleapis.com/v3/urlNotifications:publish'
const SCOPES = ['https://www.googleapis.com/auth/indexing']

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
