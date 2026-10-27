/**
 * Optional low-overhead tracing helpers for API routes
 * Import and call these functions in API handlers to add tracing spans
 */

import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('enem-pro', '1.0.0');

export interface SpanAttrs {
  user_id?: string;
  plan?: string;
  cache_hit?: boolean;
  cache_source?: 'redis' | 'db';
  question_id?: string;
  status_code?: number;
  error?: string;
  latency_ms?: number;
}

/**
 * Wrap an async function with a span
 * Usage: await withSpan('operation_name', { user_id }, async () => { ... })
 */
export async function withSpan<T>(
  operationName: string,
  attrs: SpanAttrs,
  fn: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(operationName, { attributes: attrs }, async (span) => {
    const startTime = performance.now();
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      const duration = Math.round(performance.now() - startTime);
      span.setAttribute('duration_ms', duration);
    }
  });
}

/**
 * Add attributes to current active span
 */
export function addSpanAttributes(attrs: SpanAttrs) {
  const span = trace.getActiveSpan();
  if (span) {
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== undefined) {
        span.setAttribute(key, value);
      }
    });
  }
}

/**
 * Record cache hit/miss on current span
 */
export function recordCacheHit(hit: boolean, source?: 'redis' | 'db') {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute('cache.hit', hit);
    if (source) {
      span.setAttribute('cache.source', source);
    }
  }
}

/**
 * Record error on current span
 */
export function recordError(error: Error | string) {
  const span = trace.getActiveSpan();
  if (span) {
    if (typeof error === 'string') {
      span.recordException(new Error(error));
    } else {
      span.recordException(error);
    }
    span.setStatus({ code: SpanStatusCode.ERROR });
  }
}
