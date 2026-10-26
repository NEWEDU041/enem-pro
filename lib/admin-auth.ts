import { NextRequest, NextResponse } from 'next/server'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { cleanEnv } from '@/lib/utils'

/**
 * Admin authentication with 2FA (TOTP) + IP whitelist
 * Supports:
 * - IP whitelist validation (ADMIN_IPS env var: comma-separated list)
 * - TOTP verification (speakeasy)
 * - QR code generation for setup
 * - Secret management
 */

export interface AdminAuthConfig {
  ipWhitelist: string[]
  totpSecret?: string
}

/**
 * Parse IP whitelist from environment variable
 * Format: "127.0.0.1,192.168.1.0/24,::1"
 */
export function parseAdminIPs(): string[] {
  const ips = cleanEnv(process.env.ADMIN_IPS) || '127.0.0.1'
  return ips
    .split(',')
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0)
}

/**
 * Check if request IP is in whitelist
 * Supports exact match and simple CIDR /24 notation
 */
export function isIPWhitelisted(clientIP: string, whitelist: string[]): boolean {
  // Extract actual IP (remove IPv6 prefix if present)
  const ip = clientIP.replace(/^::ffff:/, '')

  for (const allowed of whitelist) {
    // Exact match
    if (ip === allowed) return true

    // Simple /24 CIDR for IPv4
    if (allowed.includes('/24') && !ip.includes(':')) {
      const [subnet] = allowed.split('/24')
      const clientSubnet = ip.split('.').slice(0, 3).join('.')
      const allowedSubnet = subnet.split('.').slice(0, 3).join('.')
      if (clientSubnet === allowedSubnet) return true
    }

    // Wildcard match (e.g., "192.168.*")
    if (allowed.endsWith('*')) {
      const prefix = allowed.slice(0, -1)
      if (ip.startsWith(prefix)) return true
    }
  }

  return false
}

/**
 * Get client IP from request headers
 * Checks multiple header sources for proxy scenarios
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  const nextForwarded = request.headers.get('cf-connecting-ip') // Cloudflare

  const ip = forwarded?.split(',')[0] || real || nextForwarded || 'unknown'
  return ip.trim()
}

/**
 * Generate a TOTP secret with metadata
 * Returns secret and setup data for QR code generation
 */
export function generateTOTPSecret(appName: string = 'ENEM-Pro Admin'): {
  secret: string
  qrCodeDataUrl: Promise<string>
  manualEntryKey: string
  recoveryCode: string
} {
  const secret = speakeasy.generateSecret({
    name: `${appName} (ENEM-Pro)`,
    issuer: 'ENEM-Pro',
    length: 32,
  })

  const qrCodeDataUrl = QRCode.toDataURL(secret.otpauth_url || '')
  const recoveryCode = Math.random().toString(36).substring(2, 15).toUpperCase()

  return {
    secret: secret.base32,
    qrCodeDataUrl,
    manualEntryKey: secret.base32,
    recoveryCode,
  }
}

/**
 * Verify a TOTP token against a secret
 * Includes time window tolerance (±1 step)
 */
export function verifyTOTP(token: string, secret: string, options?: { window?: number }): boolean {
  try {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: options?.window ?? 1, // ±1 time step (±30 seconds)
    })

    return !!verified
  } catch (err) {
    console.error('[admin-auth] TOTP verification error:', err)
    return false
  }
}

/**
 * Main middleware: verify admin request
 * Checks IP whitelist first, then TOTP token
 *
 * Expected headers:
 * - x-admin-ip: Client IP (auto-detected if missing)
 * - x-admin-totp: 6-digit TOTP token
 */
export async function verifyAdminRequest(
  request: NextRequest,
  config: { ipWhitelist?: string[]; totpSecret?: string } = {}
): Promise<{
  authorized: boolean
  error?: string
  reason?: 'ip-blocked' | 'totp-missing' | 'totp-invalid' | 'config-missing'
}> {
  const ipWhitelist = config.ipWhitelist || parseAdminIPs()

  // Check IP whitelist
  const clientIP = getClientIP(request)
  if (!isIPWhitelisted(clientIP, ipWhitelist)) {
    console.warn(`[admin-auth] IP blocked: ${clientIP}`)
    return {
      authorized: false,
      error: `IP ${clientIP} is not whitelisted`,
      reason: 'ip-blocked',
    }
  }

  // Check TOTP secret is configured
  const secret = config.totpSecret || cleanEnv(process.env.ADMIN_TOTP_SECRET)
  if (!secret) {
    console.error('[admin-auth] ADMIN_TOTP_SECRET not configured')
    return {
      authorized: false,
      error: 'Server configuration error',
      reason: 'config-missing',
    }
  }

  // Check TOTP token
  const token = request.headers.get('x-admin-totp')
  if (!token) {
    return {
      authorized: false,
      error: 'TOTP token required',
      reason: 'totp-missing',
    }
  }

  // Verify TOTP
  if (!verifyTOTP(token, secret)) {
    console.warn(`[admin-auth] Invalid TOTP from IP: ${clientIP}`)
    return {
      authorized: false,
      error: 'Invalid TOTP token',
      reason: 'totp-invalid',
    }
  }

  console.log(`[admin-auth] Authorized: ${clientIP}`)
  return { authorized: true }
}

/**
 * Response helper for unauthorized requests
 */
export function unauthorizedResponse(error: string, statusCode: number = 401): Response {
  return NextResponse.json({ error }, { status: statusCode })
}
