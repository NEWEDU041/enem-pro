import { NextRequest, NextResponse } from 'next/server'
import { generateTOTPSecret } from '@/lib/admin-auth'
import { withErrorHandling } from '@/lib/api-helpers'
import { cleanEnv } from '@/lib/utils'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/2fa-setup
 * Generates a TOTP secret and QR code for initial setup
 *
 * Security: Only works with a setup token (one-time use)
 * Header: x-setup-token (must match ADMIN_SETUP_TOKEN)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const setupToken = request.headers.get('x-setup-token')
  const envSetupToken = cleanEnv(process.env.ADMIN_SETUP_TOKEN)

  if (!envSetupToken || !setupToken) {
    return NextResponse.json({ error: 'Setup token required' }, { status: 401 })
  }

  if (setupToken !== envSetupToken) {
    return NextResponse.json({ error: 'Invalid setup token' }, { status: 403 })
  }

  try {
    const { secret, qrCodeDataUrl, manualEntryKey, recoveryCode } = generateTOTPSecret()

    const qrDataUrl = await qrCodeDataUrl

    return NextResponse.json({
      success: true,
      secret: manualEntryKey,
      qrCode: qrDataUrl,
      recoveryCode,
      instructions: {
        step1: 'Save the recovery code in a secure location',
        step2: 'Scan the QR code with an authenticator app (Google Authenticator, Authy, Microsoft Authenticator)',
        step3: 'Or manually enter the secret key into your authenticator app',
        step4: 'Set ADMIN_TOTP_SECRET to the secret value in your environment',
        step5: 'Include x-admin-totp header with 6-digit code in admin requests',
      },
    })
  } catch (err) {
    console.error('[admin/2fa-setup] Error:', err)
    return NextResponse.json({ error: 'Failed to generate TOTP secret' }, { status: 500 })
  }
})

/**
 * GET /api/admin/2fa-setup
 * Returns current setup status (for verification)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const setupToken = request.headers.get('x-setup-token')
  const envSetupToken = cleanEnv(process.env.ADMIN_SETUP_TOKEN)

  if (!envSetupToken || !setupToken) {
    return NextResponse.json({ error: 'Setup token required' }, { status: 401 })
  }

  if (setupToken !== envSetupToken) {
    return NextResponse.json({ error: 'Invalid setup token' }, { status: 403 })
  }

  const totpConfigured = !!cleanEnv(process.env.ADMIN_TOTP_SECRET)
  const ipWhitelistConfigured = !!cleanEnv(process.env.ADMIN_IPS)

  return NextResponse.json({
    status: {
      totp_configured: totpConfigured,
      ip_whitelist_configured: ipWhitelistConfigured,
      admin_endpoints: [
        '/api/admin/stats (GET)',
        '/api/admin/upgrade (POST)',
        '/api/admin/warm-cache (POST)',
      ],
      required_headers: ['x-admin-totp', 'x-admin-ip (optional, auto-detected)'],
    },
  })
})
