import { NextRequest, NextResponse } from 'next/server'

/**
 * CORS Security Helper
 * Implements whitelist-based CORS instead of allowing '*'
 * 
 * Reads allowed origins from env var ALLOWED_ORIGINS (comma-separated)
 * Falls back to hardcoded defaults if not set
 */

// Default allowed origins (localhost for dev, your domain for prod)
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8000',
  'https://enemspot.com.br', // Change to your actual domain
]

/**
 * Get allowed origins from environment or use defaults
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS
  
  if (envOrigins) {
    return envOrigins
      .split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0)
  }
  
  return DEFAULT_ALLOWED_ORIGINS
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  
  const allowedOrigins = getAllowedOrigins()
  return allowedOrigins.includes(origin)
}

/**
 * Middleware to add secure CORS headers
 */
export function addCORSHeaders(
  response: NextResponse,
  origin: string | null
): NextResponse {
  if (isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    )
    response.headers.set('Access-Control-Max-Age', '3600')
  }
  
  return response
}

/**
 * Handle CORS preflight requests (OPTIONS)
 */
export function handleCORSPreflight(origin: string | null): NextResponse {
  if (!isOriginAllowed(origin)) {
    return new NextResponse(null, {
      status: 403,
      statusText: 'Forbidden',
    })
  }
  
  const response = new NextResponse(null, { status: 204 })
  return addCORSHeaders(response, origin)
}

/**
 * Get origin from request headers
 */
export function getOriginFromRequest(request: NextRequest): string | null {
  return request.headers.get('origin')
}

/**
 * Main CORS wrapper for API handlers
 * Usage: export const POST = withCORS(async (req) => { ... })
 */
export function withCORS<T extends NextRequest>(
  handler: (req: T) => Promise<NextResponse>
) {
  return async (req: T): Promise<NextResponse> => {
    const origin = getOriginFromRequest(req)
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return handleCORSPreflight(origin)
    }
    
    // Execute handler
    const response = await handler(req)
    
    // Add CORS headers to response
    return addCORSHeaders(response, origin)
  }
}
