/**
 * Middleware to collect request metrics
 * Records latency, status codes, cache operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prometheusExporter } from '@/lib/monitoring/prometheus'

export function metricsMiddleware(response: NextResponse, request: NextRequest, duration: number) {
  // Extract endpoint path
  const url = new URL(request.url)
  const endpoint = url.pathname
  const method = request.method

  // Skip metrics collection for metrics endpoint itself and some noisy endpoints
  const skipEndpoints = ['/api/metrics', '/_next/', '/static/', '/favicon.ico']
  if (skipEndpoints.some(e => endpoint.startsWith(e))) {
    return response
  }

  const statusCode = response.status || 200
  
  // Record the request
  prometheusExporter.recordRequest(
    `${method} ${endpoint}`,
    duration,
    statusCode
  )

  return response
}

/**
 * Utility to record cache operations
 */
export function recordCacheOperation(isHit: boolean) {
  prometheusExporter.recordCacheHit(isHit)
}

/**
 * Utility to record database operations
 */
export function recordDbOperation(duration: number, activeConnections: number) {
  prometheusExporter.recordDbQuery(duration, activeConnections)
}

/**
 * Utility to record custom business metrics
 */
export function recordExplanationGenerated() {
  prometheusExporter.recordExplanationGenerated()
}

export function recordActiveUsers(count: number) {
  prometheusExporter.recordActiveUser(count)
}
