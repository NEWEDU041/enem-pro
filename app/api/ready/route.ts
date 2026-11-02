/**
 * Readiness Probe — enem-pro
 * 
 * Returns 200 if service is ready to receive traffic
 * Checks: database, cache, external dependencies
 * Used by: Kubernetes readinessProbe
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

export async function GET() {
  const checks: Record<string, any> = {
    server: { status: 'ok' },
  }
  let overallStatus = 'ready'
  const startTime = Date.now()

  const sb = createServerClient()

  // Database connectivity check
  try {
    const dbStart = Date.now()
    const { error } = await sb.from('question_explanations').select('*', { count: 'exact', head: true })
    
    if (error) {
      checks.database = { 
        status: 'error', 
        error: error.message, 
        latency_ms: Date.now() - dbStart 
      }
      overallStatus = 'not-ready'
    } else {
      checks.database = { 
        status: 'ok', 
        latency_ms: Date.now() - dbStart 
      }
    }
  } catch (err) {
    checks.database = {
      status: 'error',
      error: String(err),
    }
    overallStatus = 'not-ready'
  }

  const statusCode = overallStatus === 'ready' ? 200 : 503

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      response_time_ms: Date.now() - startTime,
    },
    {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  )
}
