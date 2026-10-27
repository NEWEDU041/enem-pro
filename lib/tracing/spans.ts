/**
 * Custom span utilities for enem-pro
 * Provides typed span helpers for key operations
 */

import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api';

const tracer = trace.getTracer('enem-pro', '1.0.0');

/**
 * Span attributes for different operations
 */
export interface ExplicarSpanAttrs {
  question_id: string;
  selected_alternative: string;
  cache_source?: 'redis' | 'db' | 'ai';
  user_id?: string;
  latency_ms?: number;
}

export interface CheckoutSpanAttrs {
  user_id: string;
  plan: 'monthly' | 'annual';
  price_id: string;
  cache_hit?: boolean;
  job_id?: string;
  status_code?: number;
}

export interface PortalSpanAttrs {
  user_id: string;
  cache_hit?: boolean;
  customer_id?: string;
  status_code?: number;
}

export interface DbQuerySpanAttrs {
  query: string;
  table?: string;
  operation?: 'select' | 'insert' | 'update' | 'delete';
  row_count?: number;
  duration_ms?: number;
}

export interface CacheOpSpanAttrs {
  key: string;
  operation: 'get' | 'set' | 'del';
  hit?: boolean;
  size_bytes?: number;
  ttl_seconds?: number;
}

/**
 * Wrapper: /api/explicar endpoint
 */
export async function traceExplicar<T>(
  attrs: ExplicarSpanAttrs,
  fn: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(
    'http.server.explicar',
    {
      attributes: {
        'http.method': 'POST',
        'http.target': '/api/explicar',
        'http.scheme': 'https',
        'faas.coldstart': false,
        ...attrs,
      },
    },
    async (span) => {
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
      }
    }
  );
}

/**
 * Wrapper: /api/checkout endpoint
 */
export async function traceCheckout<T>(
  attrs: CheckoutSpanAttrs,
  fn: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(
    'http.server.checkout',
    {
      attributes: {
        'http.method': 'POST',
        'http.target': '/api/checkout',
        'http.scheme': 'https',
        'faas.coldstart': false,
        ...attrs,
      },
    },
    async (span) => {
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
      }
    }
  );
}

/**
 * Wrapper: /api/portal endpoint
 */
export async function tracePortal<T>(
  attrs: PortalSpanAttrs,
  fn: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(
    'http.server.portal',
    {
      attributes: {
        'http.method': 'POST',
        'http.target': '/api/portal',
        'http.scheme': 'https',
        'faas.coldstart': false,
        ...attrs,
      },
    },
    async (span) => {
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
      }
    }
  );
}

/**
 * Wrapper: Database queries
 */
export async function traceDbQuery<T>(
  attrs: DbQuerySpanAttrs,
  fn: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(
    `db.query.${attrs.operation || 'unknown'}`,
    {
      attributes: {
        'db.system': 'postgresql',
        'db.statement': attrs.query.substring(0, 200), // Truncate long queries
        ...attrs,
      },
    },
    async (span) => {
      const startTime = performance.now();
      try {
        const result = await fn();
        const duration = Math.round(performance.now() - startTime);
        span.setAttribute('db.duration_ms', duration);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        const duration = Math.round(performance.now() - startTime);
        span.setAttribute('db.duration_ms', duration);
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
 * Wrapper: Cache operations (Redis/in-memory)
 */
export async function traceCacheOp<T>(
  attrs: CacheOpSpanAttrs,
  fn: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(
    `cache.${attrs.operation}`,
    {
      attributes: {
        'cache.system': 'redis',
        'cache.hit': attrs.hit ?? false,
        ...attrs,
      },
    },
    async (span) => {
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
      }
    }
  );
}

/**
 * Add event to current span
 */
export function recordEvent(
  name: string,
  attributes?: Record<string, string | number | boolean>
) {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Record exception on current span
 */
export function recordException(error: Error | string) {
  const span = trace.getActiveSpan();
  if (span) {
    if (typeof error === 'string') {
      span.recordException(new Error(error));
    } else {
      span.recordException(error);
    }
  }
}

/**
 * Set attribute on current span
 */
export function setAttribute(key: string, value: string | number | boolean | undefined) {
  const span = trace.getActiveSpan();
  if (span && value !== undefined) {
    span.setAttribute(key, value);
  }
}
