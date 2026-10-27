import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { withErrorHandling } from '@/lib/api-helpers'
import { initLogContext, createRequestLogger, logSuccess, logError } from '@/lib/logger'
import { getJobStatus } from '@/lib/checkout-queue'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const logContext = initLogContext(request)
  const logger = createRequestLogger(logContext)

  // Extract jobId from URL path
  const pathSegments = request.nextUrl.pathname.split('/')
  const jobId = pathSegments[pathSegments.length - 1]

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID is required' },
      { status: 400 }
    )
  }

  // Optional: Require authentication
  // Uncomment if you want to ensure only the user who created the job can check its status
  /*
  const auth = await requireAuth(request)
  if (!auth.ok) {
    return auth.response
  }
  const { userId } = auth
  */

  try {
    const result = await getJobStatus(jobId)

    if (!result) {
      logError(logger, logContext, {
        status: 404,
        endpoint: `/api/checkout/status/${jobId}`,
        error: 'Job not found',
      })

      return NextResponse.json(
        { error: 'Checkout job not found', jobId },
        { status: 404 }
      )
    }

    logSuccess(logger, logContext, {
      status: 200,
      endpoint: `/api/checkout/status/${jobId}`,
      message: 'Checkout job status retrieved',
      metadata: {
        jobId,
        status: result.status,
        sessionUrl: result.sessionUrl ? '[redacted]' : undefined,
      },
    })

    // Return appropriate status code based on job state
    const statusCode = result.status === 'completed' ? 200 : result.status === 'failed' ? 400 : 202

    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logError(logger, logContext, {
      status: 500,
      endpoint: `/api/checkout/status/${jobId}`,
      error: 'Failed to retrieve job status',
      metadata: { details: errorMsg },
    })

    return NextResponse.json(
      { error: 'Failed to retrieve checkout status' },
      { status: 500 }
    )
  }
})
