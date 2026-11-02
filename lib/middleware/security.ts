// From: security-review + api-security-hardening skills
import { NextResponse } from 'next/server';

export function withSecurityHeaders(response: NextResponse) {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection in older browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Disable referrer info
  response.headers.set('Referrer-Policy', 'no-referrer');
  
  // Content Security Policy (strict)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );
  
  // HSTS (force HTTPS after first visit)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  return response;
}

/**
 * Helper to apply security headers to a JSON response
 */
export function jsonWithSecurityHeaders(
  data: any,
  status: number = 200,
  headers?: Record<string, string>
) {
  const response = NextResponse.json(data, { status, headers });
  return withSecurityHeaders(response);
}

/**
 * Helper to apply security headers to a custom response
 */
export function responseWithSecurityHeaders(
  body: BodyInit | null,
  init: ResponseInit = {}
) {
  const response = new NextResponse(body, init);
  return withSecurityHeaders(response);
}
