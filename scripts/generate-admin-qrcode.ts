#!/usr/bin/env node

/**
 * Generate and display example QR code for Admin 2FA setup
 */

import { generateTOTPSecret } from '../lib/admin-auth'

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║           Admin 2FA Setup - QR Code Example                    ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')

  const { secret, qrCodeDataUrl, manualEntryKey, recoveryCode } = generateTOTPSecret('enem-pro@example.com')

  const qrDataUrl = await qrCodeDataUrl

  console.log('📋 SECRET INFORMATION:')
  console.log(`├─ Base32 Secret: ${secret}`)
  console.log(`├─ Recovery Code: ${recoveryCode}`)
  console.log(`├─ Issuer: ENEM-Pro`)
  console.log(`└─ Account: enem-pro@example.com`)

  console.log('\n📱 SETUP INSTRUCTIONS:')
  console.log('├─ 1. Open Google Authenticator, Authy, or Microsoft Authenticator')
  console.log('├─ 2. Tap "+" to add a new account')
  console.log('├─ 3. Choose "Scan QR code"')
  console.log('├─ 4. Scan the QR code below')
  console.log('├─ 5. Save ADMIN_TOTP_SECRET to your environment: ' + secret)
  console.log('└─ 6. Save recovery code securely')

  console.log('\n🔳 QR CODE (Data URL):')
  console.log(qrDataUrl.substring(0, 100) + '...')

  // Save QR code to file
  const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')

  const fs = require('fs')
  const path = require('path')

  // Create .docs directory if doesn't exist
  const docsDir = path.join(__dirname, '../.claude/docs/qr-codes')
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true })
  }

  const qrPath = path.join(docsDir, `admin-2fa-example-${Date.now()}.png`)
  fs.writeFileSync(qrPath, buffer)

  console.log(`\n💾 QR Code saved to: ${qrPath}`)

  console.log('\n✅ ENVIRONMENT CONFIGURATION:')
  console.log(`
# Add to .env.local or deployment environment:
ADMIN_IPS=127.0.0.1,192.168.1.0/24
ADMIN_TOTP_SECRET=${secret}
ADMIN_SETUP_TOKEN=your-random-setup-token-here
  `)

  console.log('\n📚 EXAMPLE API CALLS:')
  console.log(`
# 1. Setup - Generate new secret
curl -X POST http://localhost:3000/api/admin/2fa-setup \\
  -H "x-setup-token: your-random-setup-token-here"

# 2. Check setup status
curl -X GET http://localhost:3000/api/admin/2fa-setup \\
  -H "x-setup-token: your-random-setup-token-here"

# 3. Get admin stats (with TOTP code from authenticator)
TOTP=$(python3 -c "
import pyotp
import base64
secret = '${secret}'
totp = pyotp.TOTP(secret)
print(totp.now())
")

curl -X GET http://localhost:3000/api/admin/stats \\
  -H "x-admin-totp: \${TOTP}"

# 4. Upgrade user to PRO
curl -X POST http://localhost:3000/api/admin/upgrade \\
  -H "x-admin-totp: \${TOTP}" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","months":3}'

# 5. Warm cache
curl -X POST http://localhost:3000/api/admin/warm-cache \\
  -H "x-admin-totp: \${TOTP}"
  `)

  console.log('\n✨ RECOVERY CHECKLIST:')
  console.log(`
□ Save Base32 Secret:     ${secret}
□ Save Recovery Code:     ${recoveryCode}
□ Save in Password Manager: Yes
□ Scan QR in Authenticator: Yes
□ Set ADMIN_TOTP_SECRET: Yes
□ Set ADMIN_IPS: Yes
□ Set ADMIN_SETUP_TOKEN: Yes
□ Test auth with curl: Yes
□ Deploy to production: Yes
  `)

  console.log('\n')
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
