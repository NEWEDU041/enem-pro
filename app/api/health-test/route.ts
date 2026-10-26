import { NextRequest, NextResponse } from 'next/server';
import { SentryClient } from '@/lib/sentry/client';

/**
 * Health check endpoint for rate limiting testing
 * GET /api/health-test
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    SentryClient.addBreadcrumb('Health check called', 'monitoring', 'info');
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Server is running',
        responseTime: duration,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Response-Time': `${duration}ms`,
        },
      }
    );
  } catch (error) {
    SentryClient.captureException(error as Error, {
      endpoint: '/api/health-test',
      status: 500,
      method: 'GET',
      path: request.url,
    });
    
    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for testing
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Simulate a test error if ?error=true is passed
    const { searchParams } = new URL(request.url);
    if (searchParams.get('error') === 'true') {
      throw new Error('Test error triggered via query parameter');
    }
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        method: 'POST',
        responseTime: duration,
      },
      { 
        status: 200,
        headers: {
          'X-Response-Time': `${duration}ms`,
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    
    SentryClient.captureException(error as Error, {
      endpoint: '/api/health-test',
      status: 500,
      method: 'POST',
      duration: duration,
      path: request.url,
    });
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
