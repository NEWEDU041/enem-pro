import * as Sentry from '@sentry/node';

export interface ErrorContext {
  endpoint?: string;
  userId?: string;
  status?: number;
  method?: string;
  path?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

export class SentryClient {
  static captureError(
    error: Error | string,
    context: ErrorContext = {},
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'error'
  ) {
    try {
      const tags = {
        endpoint: context.endpoint || 'unknown',
        user_id: context.userId || 'anonymous',
        status: context.status?.toString() || '500',
        method: context.method || 'GET',
        environment: process.env.NODE_ENV || 'development',
      };

      const extra = {
        path: context.path,
        userAgent: context.userAgent,
        ip: context.ip,
        ...Object.entries(context)
          .filter(([key]) => !['endpoint', 'userId', 'status', 'method', 'path', 'userAgent', 'ip'].includes(key))
          .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
      };

      if (typeof error === 'string') {
        Sentry.captureMessage(error, {
          level,
          tags,
          extra,
        });
      } else {
        Sentry.captureException(error, {
          tags,
          extra,
          level,
        });
      }
    } catch (err) {
      console.error('Failed to capture error in Sentry:', err);
    }
  }

  static captureException(error: Error, context: ErrorContext = {}) {
    this.captureError(error, context, 'error');
  }

  static captureWarning(message: string, context: ErrorContext = {}) {
    this.captureError(message, context, 'warning');
  }

  static setUser(userId: string, email?: string, username?: string) {
    Sentry.setUser({
      id: userId,
      email,
      username,
    });
  }

  static clearUser() {
    Sentry.setUser(null);
  }

  static addBreadcrumb(message: string, category: string = 'info', level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info', data?: any) {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  }
}
