import { NextRequest, NextResponse } from 'next/server'
import { submitIndexNow, pingGoogleSitemap } from '@/lib/indexnow'
import { cleanEnv } from '@/lib/utils'
import { withErrorHandling } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const secret = cleanEnv(process.env.CRON_SECRET)
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [{ submitted, results }, googlePingStatus] = await Promise.all([
    submitIndexNow(),
    pingGoogleSitemap(),
  ])

  return NextResponse.json({
    submitted,
    results: { ...results, google_sitemap_ping: googlePingStatus },
    hint: 'Para indexação no Google Search Console, acesse: https://search.google.com/search-console e submeta o sitemap manualmente.',
  })
})
