/**
 * Liveness Probe — enem-pro
 * 
 * Returns 200 if service is alive
 * Lightweight check: no DB queries
 * Used by: Kubernetes livenessProbe
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 5

const serviceStartTime = Date.now()

export async function GET() {
  const uptime = Date.now() - serviceStartTime

  return NextResponse.json(
    {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime_ms: uptime,
      version: process.env.APP_VERSION || '0.0.0',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  )
}
