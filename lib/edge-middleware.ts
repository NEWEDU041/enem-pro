/**
 * Vercel Edge Function: Geolocation-based caching and routing
 * 
 * This function:
 * - Detects user geolocation via Vercel headers
 * - Routes to optimal regional endpoint
 * - Implements region-specific caching
 * - Handles cache purging per region
 */

import { geolocation } from '@vercel/edge';

export function middleware(request: Request) {
  const url = new URL(request.url);
  
  // Get geolocation from Vercel headers
  const geo = geolocation(request);
  const country = geo?.country;
  
  // Determine optimal region
  let region = 'us';
  let cacheKey = 'default';

  if (country) {
    // South America
    if (['BR', 'AR', 'CL', 'CO', 'PE', 'UY'].includes(country)) {
      region = 'sa';
      cacheKey = `sa-${country}`;
    }
    // Europe
    else if (
      ['DE', 'FR', 'IT', 'ES', 'GB', 'NL', 'BE', 'AT', 'CH', 'SE', 'DK', 'NO', 'PL'].includes(
        country
      )
    ) {
      region = 'eu';
      cacheKey = `eu-${country}`;
    }
    // Asia Pacific
    else if (['JP', 'AU', 'SG', 'IN', 'CN'].includes(country)) {
      region = 'ap';
      cacheKey = `ap-${country}`;
    }
  }

  // Add custom headers for downstream services
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-region', region);
  requestHeaders.set('x-user-country', country || 'unknown');
  requestHeaders.set('x-cache-key', cacheKey);
  requestHeaders.set('x-geo-latitude', geo?.latitude?.toString() || '');
  requestHeaders.set('x-geo-longitude', geo?.longitude?.toString() || '');
  requestHeaders.set('x-geo-timezone', geo?.timezone || '');

  // Create modified request
  return new Request(url, {
    ...request,
    headers: requestHeaders,
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
