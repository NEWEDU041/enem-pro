import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limiter';
import { handleCORSPreflight, getOriginFromRequest, addCORSHeaders } from '@/lib/cors';

export async function middleware(request: NextRequest) {
  const pathname = new URL(request.url).pathname;
  const origin = getOriginFromRequest(request);
  
  // Handle CORS preflight requests
  if (pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    return handleCORSPreflight(origin);
  }
  
  // Only apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = await withRateLimit(request, pathname);
    
    // If rate limit exceeded, return 429 response
    if (rateLimitResponse) {
      return addCORSHeaders(rateLimitResponse, origin);
    }
  }
  
  let response = NextResponse.next();
  
  // Add CORS headers to API responses
  if (pathname.startsWith('/api/')) {
    response = addCORSHeaders(response, origin);
  }
  
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
