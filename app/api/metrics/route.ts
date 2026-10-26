import { NextRequest, NextResponse } from 'next/server'
import { prometheusExporter } from '@/lib/monitoring/prometheus'
import { cleanEnv } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

/**
 * GET /api/metrics - Prometheus metrics endpoint
 * Returns metrics in Prometheus text format
 * Requires x-admin-secret header for security
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret')
  if (!secret || secret !== cleanEnv(process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const metrics = prometheusExporter.generateMetrics()
  
  return new NextResponse(metrics, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}

/**
 * GET /api/metrics/debug - JSON format for debugging
 */
export async function OPTIONS(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret')
  if (!secret || secret !== cleanEnv(process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = prometheusExporter.getMetricsJSON()
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
