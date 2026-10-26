import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute globally
};

const SENSITIVE_ENDPOINTS_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute for sensitive endpoints
};

// In-memory store for rate limiting (IP -> requests array)
const rateLimitStore = new Map<string, number[]>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const cutoff = now - 60 * 1000; // Keep entries from last minute
  
  rateLimitStore.forEach((timestamps, ip) => {
    const recentTimestamps = timestamps.filter(t => t > cutoff);
    if (recentTimestamps.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, recentTimestamps);
    }
  });
}, 30 * 1000); // Clean every 30 seconds

/**
 * Extract client IP from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Check rate limit for a given IP and config
 */
function checkRateLimit(ip: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  let timestamps = rateLimitStore.get(ip) || [];
  
  // Filter out old timestamps outside the window
  timestamps = timestamps.filter(t => t > windowStart);
  
  // Check if limit exceeded
  if (timestamps.length >= config.maxRequests) {
    return false; // Limit exceeded
  }
  
  // Add current request
  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);
  
  return true; // Limit not exceeded
}

/**
 * Determine if endpoint is sensitive (admin, cron, checkout)
 */
function isSensitiveEndpoint(pathname: string): boolean {
  const sensitivePatterns = [
    '/api/admin',
    '/api/checkout',
    '/api/webhook',
    '/api/cron',
  ];
  
  return sensitivePatterns.some(pattern => pathname.startsWith(pattern));
}

/**
 * Main rate limiter middleware function
 */
export async function withRateLimit(
  request: NextRequest,
  pathname: string
): Promise<NextResponse | null> {
  const ip = getClientIP(request);
  const config = isSensitiveEndpoint(pathname) ? SENSITIVE_ENDPOINTS_CONFIG : DEFAULT_CONFIG;
  
  const allowed = checkRateLimit(ip, config);
  
  if (!allowed) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: config.windowMs / 1000,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(config.windowMs / 1000),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(new Date(Date.now() + config.windowMs).toISOString()),
        },
      }
    );
  }
  
  return null; // Request allowed, continue processing
}

/**
 * Get rate limit status for debugging
 */
export function getRateLimitStatus(ip?: string) {
  if (ip) {
    const timestamps = rateLimitStore.get(ip) || [];
    return {
      ip,
      requests: timestamps.length,
      timestamps,
    };
  }
  
  return {
    storeSize: rateLimitStore.size,
    entries: Array.from(rateLimitStore.entries()).map(([ip, timestamps]) => ({
      ip,
      requests: timestamps.length,
    })),
  };
}
