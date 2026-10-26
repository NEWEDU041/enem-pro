import { NextRequest, NextResponse } from 'next/server'
import { JWT } from 'google-auth-library'
import { SITE_URL } from '@/lib/site-config'
import { cleanEnv } from '@/lib/utils'
import { timingSafeEqual } from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const WEBMASTERS_SCOPE = 'https://www.googleapis.com/auth/webmasters'
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`
const SITE_URL_ENCODED = encodeURIComponent(SITE_URL + '/')

function getJwt(): JWT | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) return null
  try {
    const key = JSON.parse(raw)
    return new JWT({ email: key.client_email, key: key.private_key, scopes: [WEBMASTERS_SCOPE] })
  } catch {
    return null
  }
}

// Submete o sitemap ao Google Search Console via API oficial.
// Requer que a service account esteja adicionada como usuario no GSC property.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = cleanEnv(process.env.CRON_SECRET)

  if (!secret || !authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const expectedHeader = `Bearer ${secret}`
  const expectedBuf = Buffer.from(expectedHeader)
  const actualBuf = Buffer.from(authHeader)

  const isValid = expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf)
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const jwt = getJwt()
  if (!jwt) {
    return NextResponse.json({ error: 'GOOGLE_SERVICE_ACCOUNT_KEY nao configurada' }, { status: 500 })
  }

  try {
    const token = await jwt.getAccessToken()
    const accessToken = token.token

    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${SITE_URL_ENCODED}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    if (res.ok) {
      return NextResponse.json({ ok: true, submitted: SITEMAP_URL })
    }

    const body = await res.json().catch(() => ({}))
    return NextResponse.json({ ok: false, status: res.status, detail: body }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
