import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { jsonWithSecurityHeaders, withSecurityHeaders } from '@/lib/middleware/security'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { webhook_url, payload } = body

  if (!webhook_url || !payload) {
    return jsonWithSecurityHeaders({ error: 'webhook_url and payload are required' }, 400)
  }

  try {
    const startTime = performance.now()

    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ENEM-Signature': `sha256=test_signature`,
        'X-ENEM-Event': payload.event,
        'User-Agent': 'ENEM-Pro-Webhook/1.0',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    const latency = Math.round(performance.now() - startTime)
    const responseBody = await response.text()

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(
        Array.from(response.headers.entries()).slice(0, 20)
      ),
      body: responseBody.substring(0, 1000), // Limit body size
      latency_ms: latency,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 0,
        statusText: 'Error',
        headers: {},
        body: error.message || 'Request failed',
        latency_ms: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
