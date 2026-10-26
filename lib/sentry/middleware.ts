import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as Sentry from '@sentry/node';

export function withSentryErrorTracking(handler: Function) {
  return async (req: NextRequest) => {
    const startTime = Date.now();
    const endpoint = req.nextUrl.pathname;
    const method = req.method;

    // Extract user info from headers or session
    let userId = 'anonymous';
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      // This is a simplified extraction - adjust based on your auth method
      userId = authHeader.substring(0, 20); // First 20 chars as user identifier
    }

    try {
      // Call the handler
      let response = await handler(req);

      // Track response time
      const duration = Date.now() - startTime;
      const status = response.status || 200;

      // Log slow requests
      if (duration > 1000) {
        Sentry.captureMessage(`Slow request detected: ${endpoint}`, {
          level: 'warning',
          tags: {
            endpoint,
            method,
            status: status.toString(),
            duration_ms: duration.toString(),
            user_id: userId,
          },
        });
      }

      // Capture 5xx errors
      if (status >= 500) {
        Sentry.captureMessage(`Server error: ${endpoint}`, {
          level: 'error',
          tags: {
            endpoint,
            method,
            status: status.toString(),
            user_id: userId,
          },
        });
      }

      // Add timing header
      const newHeaders = new Headers(response.headers);
      newHeaders.set('X-Response-Time', `${duration}ms`);

      return new NextResponse(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      Sentry.captureException(error, {
        tags: {
          endpoint,
          method,
          user_id: userId,
          status: '500',
          duration_ms: duration.toString(),
        },
        extra: {
          url: req.url,
          userAgent: req.headers.get('user-agent'),
        },
      });

      // Return error response
      return NextResponse.json(
        { 
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware wrapper for Sentry in Next.js middleware
 * Use in middleware.ts to track all API requests
 */
export function withSentryMiddleware(response: NextResponse) {
  return response;
}
