/**
 * Tracing initialization middleware for Next.js
 * Must be imported at the very top of instrumentation.ts
 */

import { initializeTracing } from './initialize';

// Initialize tracing as early as possible
if (process.env.NODE_ENV !== 'test') {
  try {
    initializeTracing();
    console.log('[tracing] OpenTelemetry initialized successfully');
  } catch (error) {
    console.error('[tracing] Failed to initialize OpenTelemetry:', error);
    // Continue without tracing on error
  }
}

export {};
