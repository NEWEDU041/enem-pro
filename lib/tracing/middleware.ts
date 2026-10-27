/**
 * Instrumentation middleware for HTTP requests
 * Automatically captures latency, status codes, and errors for all API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('enem-pro.middleware', '1.0.0');

/**
 * Middleware to wrap all API responses with tracing spans
 * Used as request interceptor
 */
export async function traceHttpRequest(
  request: NextRequest,
  handler: () => Promise<NextResponse | Response>
): Promise<NextResponse | Response> {
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;

  return tracer.startActiveSpan(
    `${method} ${pathname}`,
    {
      attributes: {
        'http.method': method,
        'http.target': pathname,
        'http.scheme': 'https',
        'http.url': request.url.substring(0, 2000), // Truncate very long URLs
        'http.user_agent': request.headers.get('user-agent') || 'unknown',
        'http.host': request.headers.get('host') || 'unknown',
      },
    },
    async (span) => {
      const startTime = performance.now();

      try {
        const response = await handler();
        const duration = performance.now() - startTime;

        const status = response instanceof NextResponse ? response.status : 200;
        span.setAttributes({
          'http.status_code': status,
          'http.response_time_ms': Math.round(duration),
        });

        if (status >= 400) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `HTTP ${status}`,
          });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        span.setAttribute('http.response_time_ms', Math.round(duration));
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    }
  );
}

/**
 * Helper to add request context to spans
 */
export function setRequestContext(
  user_id?: string,
  plan?: string,
  cache_hit?: boolean
) {
  const span = trace.getActiveSpan();
  if (span) {
    if (user_id) span.setAttribute('user.id', user_id);
    if (plan) span.setAttribute('user.subscription.plan', plan);
    if (cache_hit !== undefined) span.setAttribute('cache.hit', cache_hit);
  }
}
