import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  const environment = process.env.NODE_ENV || 'development';
  const sentryDsn = process.env.SENTRY_DSN;
  
  if (!sentryDsn && environment === 'production') {
    console.warn('⚠️  SENTRY_DSN not set in production');
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: environment,
    release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    enabled: !!sentryDsn,
    
    // Performance monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Integrations
    integrations: [
      nodeProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
    
    // Before sending to Sentry
    beforeSend: (event, hint) => {
      // Filter out 404s and other non-critical errors
      if (event.response?.status === 404) {
        return null;
      }
      // Always send errors, but with lower sampling for warnings
      if (hint.originalException instanceof Error) {
        if (hint.originalException.message.includes('Network Error')) {
          return null;
        }
      }
      return event;
    },
    
    // Ignore errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Random plugins/extensions
      'chrome-extension://',
      'moz-extension://',
    ],
  });

  if (environment === 'production') {
    console.log('✅ Sentry initialized for error tracking');
  }
}
