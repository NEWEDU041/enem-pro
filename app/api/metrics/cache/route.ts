import { NextRequest, NextResponse } from 'next/server'
import { getMetrics, getHitRate } from '@/lib/cache'
import { withErrorHandling } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/metrics/cache
 * 
 * Prometheus-compatible cache metrics endpoint.
 * Returns cache hit rate, latency, and operation counts.
 * 
 * Output format: Prometheus text format
 * Scrape interval: 15-30 seconds recommended
 */
export const GET = withErrorHandling(async () => {
  const allMetrics = getMetrics()
  
  // Build Prometheus text format output
  let prometheusText = ''
  
  // HELP lines
  prometheusText += '# HELP cache_hits_total Total cache hits\n'
  prometheusText += '# TYPE cache_hits_total counter\n'
  
  Object.entries(allMetrics).forEach(([type, metrics]) => {
    prometheusText += `cache_hits_total{cache_type="${type}"} ${metrics.hits}\n`
  })
  
  prometheusText += '\n# HELP cache_misses_total Total cache misses\n'
  prometheusText += '# TYPE cache_misses_total counter\n'
  
  Object.entries(allMetrics).forEach(([type, metrics]) => {
    prometheusText += `cache_misses_total{cache_type="${type}"} ${metrics.misses}\n`
  })
  
  prometheusText += '\n# HELP cache_sets_total Total cache sets\n'
  prometheusText += '# TYPE cache_sets_total counter\n'
  
  Object.entries(allMetrics).forEach(([type, metrics]) => {
    prometheusText += `cache_sets_total{cache_type="${type}"} ${metrics.sets}\n`
  })
  
  prometheusText += '\n# HELP cache_invalidations_total Total cache invalidations\n'
  prometheusText += '# TYPE cache_invalidations_total counter\n'
  
  Object.entries(allMetrics).forEach(([type, metrics]) => {
    prometheusText += `cache_invalidations_total{cache_type="${type}"} ${metrics.invalidations}\n`
  })
  
  prometheusText += '\n# HELP cache_errors_total Total cache errors\n'
  prometheusText += '# TYPE cache_errors_total counter\n'
  
  Object.entries(allMetrics).forEach(([type, metrics]) => {
    prometheusText += `cache_errors_total{cache_type="${type}"} ${metrics.errors}\n`
  })
  
  prometheusText += '\n# HELP cache_hit_rate Cache hit rate percentage\n'
  prometheusText += '# TYPE cache_hit_rate gauge\n'
  
  Object.entries(allMetrics).forEach(([type]) => {
    const hitRate = getHitRate(type as any)
    prometheusText += `cache_hit_rate{cache_type="${type}"} ${hitRate.toFixed(2)}\n`
  })
  
  prometheusText += '\n# HELP cache_avg_latency_ms Average cache operation latency in milliseconds\n'
  prometheusText += '# TYPE cache_avg_latency_ms gauge\n'
  
  Object.entries(allMetrics).forEach(([type, metrics]) => {
    const avgLatency = metrics.requestCount > 0 
      ? metrics.totalLatency / metrics.requestCount 
      : 0
    prometheusText += `cache_avg_latency_ms{cache_type="${type}"} ${avgLatency.toFixed(2)}\n`
  })
  
  prometheusText += '\n# HELP cache_requests_total Total cache requests\n'
  prometheusText += '# TYPE cache_requests_total counter\n'
  
  Object.entries(allMetrics).forEach(([type, metrics]) => {
    prometheusText += `cache_requests_total{cache_type="${type}"} ${metrics.requestCount}\n`
  })
  
  return new NextResponse(prometheusText, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
})
