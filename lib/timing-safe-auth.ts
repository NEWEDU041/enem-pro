/**
 * Timing-safe authentication helpers
 * Prevents timing attacks by using crypto.timingSafeEqual
 */

import { timingSafeEqual } from 'crypto'

/**
 * Compare two strings in constant time to prevent timing attacks
 * @param expected - Expected value (e.g., Bearer token)
 * @param actual - Actual value from request
 * @returns true if equal, false otherwise
 */
export function timingSafeStringEqual(expected: string, actual: string): boolean {
  try {
    const expectedBuf = Buffer.from(expected)
    const actualBuf = Buffer.from(actual)
    
    // First check: lengths must match
    if (expectedBuf.length !== actualBuf.length) {
      return false
    }
    
    // Second check: use timing-safe comparison
    return timingSafeEqual(expectedBuf, actualBuf)
  } catch {
    // If buffer conversion fails, fail closed
    return false
  }
}

/**
 * Verify Bearer token authentication
 * @param authHeader - Authorization header value (e.g., "Bearer token123")
 * @param expectedToken - Expected token value
 * @returns true if valid, false otherwise
 */
export function verifyBearerToken(authHeader: string | null, expectedToken: string | null): boolean {
  if (!authHeader || !expectedToken) {
    return false
  }

  const expectedFull = `Bearer ${expectedToken}`
  return timingSafeStringEqual(expectedFull, authHeader)
}

/**
 * Verify secret authentication (simple token comparison)
 * @param actualSecret - Secret from request header
 * @param expectedSecret - Expected secret from environment
 * @returns true if valid, false otherwise
 */
export function verifySecret(actualSecret: string | null, expectedSecret: string | null): boolean {
  if (!actualSecret || !expectedSecret) {
    return false
  }

  return timingSafeStringEqual(expectedSecret, actualSecret)
}
