import { NextRequest, NextResponse } from 'next/server';

/**
 * Health check endpoint for rate limiting testing
 * GET /api/health-test
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Server is running',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}

/**
 * POST handler for testing
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      method: 'POST',
    },
    { status: 200 }
  );
}
