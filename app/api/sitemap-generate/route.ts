/**
 * POST /api/sitemap-generate - Async sitemap generation via queue
 * GET /api/sitemap-generate/[jobId] - Check job status
 */

import { NextRequest, NextResponse } from 'next/server'
import { queueSitemapJob, getJobStatus, initSitemapQueue } from '@/lib/sitemap-queue'
import { cleanEnv } from '@/lib/utils'
import { verifySecret } from '@/lib/timing-safe-auth'
import { jsonWithSecurityHeaders, withSecurityHeaders } from '@/lib/middleware/security'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

/**
 * POST: Queue a new sitemap generation job
 * Requires x-admin-secret header
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret')
  const expectedSecret = cleanEnv(process.env.CRON_SECRET)

  if (!verifySecret(secret, expectedSecret)) {
    return jsonWithSecurityHeaders({ error: 'Unauthorized' }, 401)
  }

  try {
    const body = await request.json()
    const { type = 'sitemap:full', priority = 5 } = body

    // Initialize queue
    initSitemapQueue()

    // Queue the job
    const job = await queueSitemapJob({
      type,
      priority,
      metadata: body.metadata,
    })

    return NextResponse.json(
      {
        jobId: job.id,
        type: job.data.type,
        status: 'queued',
        message: `Sitemap generation job ${job.id} queued successfully`,
      },
      { status: 202 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to queue job',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

/**
 * GET: Check job status
 * Usage: GET /api/sitemap-generate?jobId=123
 */
export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId')

  if (!jobId) {
    return jsonWithSecurityHeaders({ error: 'Missing jobId parameter' }, 400)
  }

  try {
    const status = await getJobStatus(jobId)

    if (!status) {
      return jsonWithSecurityHeaders({ error: 'Job not found' }, 404)
    }

    return NextResponse.json(status, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get job status',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
