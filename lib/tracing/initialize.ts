/**
 * OpenTelemetry initialization for enem-pro
 * Instruments HTTP, Redis, PostgreSQL, and custom spans
 * Exports traces to Jaeger via OTLP
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';

// Environment detection
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_STAGING = process.env.ENVIRONMENT === 'staging' || process.env.VERCEL_ENV === 'preview';
const JAEGER_ENDPOINT = process.env.JAEGER_ENDPOINT || 'http://localhost:14268/v1/traces';
const SERVICE_NAME = process.env.JAEGER_SERVICE_NAME || 'enem-pro';
const SERVICE_VERSION = process.env.PACKAGE_VERSION || '1.0.0';

/**
 * Determine sampling rate based on environment
 * Production: 10% (0.1)
 * Staging: 100% (1.0)
 * Development: 100% (1.0)
 */
function getSamplingRate(): number {
  if (IS_PRODUCTION) {
    return 0.1; // 10% in production
  }
  return 1.0; // 100% in staging/dev
}

/**
 * Create and initialize SDK
 */
export function initializeTracing() {
  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
      [SemanticResourceAttributes.SERVICE_VERSION]: SERVICE_VERSION,
      environment: IS_PRODUCTION ? 'production' : IS_STAGING ? 'staging' : 'development',
      'process.runtime.name': 'nodejs',
      'process.runtime.version': process.version,
    }),
  );

  const traceExporter = new OTLPTraceExporter({
    url: JAEGER_ENDPOINT,
    headers: {
      'User-Agent': `enem-pro/${SERVICE_VERSION}`,
    },
    // Timeout and retry settings
    concurrencyLimit: 10,
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          responseHook: (span, response) => {
            span.setAttribute('http.response_content_length', response.headers['content-length'] || 0);
          },
        },
        '@opentelemetry/instrumentation-redis': {
          enabled: true,
          responseHook: (span, cmdArgs, response) => {
            span.setAttribute('redis.command', cmdArgs?.[0] || 'unknown');
            if (response && typeof response === 'object' && 'length' in response) {
              span.setAttribute('redis.response_size', response.length);
            }
          },
        },
        '@opentelemetry/instrumentation-pg': {
          enabled: true,
          responseHook: (span, queryResult) => {
            if (queryResult?.rowCount !== undefined) {
              span.setAttribute('db.row_count', queryResult.rowCount);
            }
          },
        },
      }),
    ],
    // Override sampler
    sampler: {
      shouldSample: () => {
        const rate = getSamplingRate();
        return Math.random() < rate;
      },
      toString: () => `AlwaysSampleSampler(rate=${getSamplingRate()})`,
    },
  });

  // Start SDK (gracefully handle initialization errors)
  sdk.start().catch((err) => {
    console.error('[tracing] Failed to initialize OpenTelemetry SDK:', err);
    // Continue without tracing on error
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    try {
      await sdk.shutdown();
      console.log('[tracing] Jaeger exporter shutdown gracefully');
    } catch (error) {
      console.error('[tracing] Error during shutdown:', error);
    }
  });

  return sdk;
}

/**
 * Get or create tracer
 */
export function getTracer(name: string) {
  return require('@opentelemetry/api').trace.getTracer(name, SERVICE_VERSION);
}
