/**
 * Middleware de Audit para Next.js
 * Automaticamente registra todas as requisições da API
 * 
 * Usage em route handlers:
 * import { withAudit } from '@/lib/audit-middleware';
 * 
 * export const POST = withAudit(async (req, user) => {
 *   // ... handler logic
 * }, 'USER_ACTION', 'users');
 */

import { NextRequest, NextResponse } from 'next/server';
import { auditLog } from './audit-logger';
import { consentManager } from './consent-manager';

export interface AuditContext {
  user?: { id: string; email: string };
  ip?: string;
  userAgent?: string;
}

/**
 * Higher-order function to wrap API handlers with automatic audit logging
 */
export function withAudit(
  handler: (req: NextRequest, context: AuditContext) => Promise<NextResponse>,
  action: string,
  resource: string,
  options?: {
    logChanges?: boolean;
    logResponseBody?: boolean;
    excludeFields?: string[];
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Extract audit context
      const ip = req.headers.get('x-forwarded-for') ||
                 req.headers.get('x-real-ip') ||
                 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';

      // Get user from auth (simplified)
      let user: { id: string; email: string } | undefined;
      try {
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
          // Decode JWT or verify session
          // This is simplified - use your actual auth
          user = {
            id: 'user_from_token',
            email: 'email_from_token',
          };
        }
      } catch (authError) {
        // Not authenticated
      }

      // Parse request body for changes logging
      let changes: Record<string, unknown> | undefined;
      if (options?.logChanges && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        try {
          const body = await req.json();
          const filtered = { ...body };

          // Remove sensitive fields
          (options.excludeFields || []).forEach(field => {
            delete filtered[field];
          });

          changes = filtered;
        } catch {
          // Body not JSON
        }
      }

      const context: AuditContext = { user, ip, userAgent };

      // Call the actual handler
      const response = await handler(req, context);

      // Log successful action
      await auditLog.log({
        userId: user?.id || null,
        email: user?.email || null,
        action,
        resource,
        changes: changes || {},
        ip,
        userAgent,
        metadata: {
          method: req.method,
          path: req.nextUrl.pathname,
          status: response.status,
        },
      });

      return response;
    } catch (error) {
      console.error(`Error in ${action}:`, error);

      // Log error action
      const ip = req.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';

      await auditLog.log({
        userId: null,
        email: null,
        action: `${action}_ERROR`,
        resource,
        ip,
        userAgent,
        metadata: {
          method: req.method,
          path: req.nextUrl.pathname,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware for checking consent before action
 */
export async function requireConsent(
  userId: string,
  consentType: 'analytics' | 'marketing' | 'preferences' | 'third_party'
): Promise<boolean> {
  return consentManager.hasConsent(userId, consentType);
}

/**
 * Middleware for rate limiting based on audit trail
 * Prevents brute force attacks
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  maxPerMinute: number = 10
): Promise<boolean> {
  try {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const logs = await auditLog.query({
      userId,
      action,
      startDate: oneMinuteAgo,
      limit: maxPerMinute + 1,
    });

    return logs.length <= maxPerMinute;
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open on error (allow action)
    return true;
  }
}

/**
 * Example usage in a route handler
 */
export async function exampleUsage() {
  const handler = withAudit(
    async (req: NextRequest, context: AuditContext) => {
      const { user, ip, userAgent } = context;

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check consent before analytics
      const hasAnalyticsConsent = await requireConsent(user.id, 'analytics');
      if (!hasAnalyticsConsent) {
        return NextResponse.json(
          { error: 'Analytics consent required' },
          { status: 403 }
        );
      }

      // Check rate limit
      const withinLimit = await checkRateLimit(user.id, 'ANALYTICS_QUERY', 100);
      if (!withinLimit) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        );
      }

      // Actual handler logic
      return NextResponse.json({ success: true, data: [] });
    },
    'ANALYTICS_QUERY',
    'analytics_events',
    {
      logChanges: false,
      excludeFields: ['apiKey', 'password'],
    }
  );

  return handler;
}
