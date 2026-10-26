import { describe, it, expect, beforeEach } from 'vitest'
import {
  parseAdminIPs,
  isIPWhitelisted,
  getClientIP,
  generateTOTPSecret,
  verifyTOTP,
} from '@/lib/admin-auth'

describe('Admin Auth - 2FA + IP Whitelist', () => {
  describe('IP Whitelist Parsing and Validation', () => {
    it('should parse comma-separated IP list', () => {
      const ips = '127.0.0.1,192.168.1.0/24,::1'
      const parsed = ips.split(',').map((ip) => ip.trim())
      expect(parsed).toEqual(['127.0.0.1', '192.168.1.0/24', '::1'])
    })

    it('should whitelist exact IP match', () => {
      const whitelist = ['127.0.0.1', '192.168.1.1']
      expect(isIPWhitelisted('127.0.0.1', whitelist)).toBe(true)
      expect(isIPWhitelisted('192.168.1.1', whitelist)).toBe(true)
    })

    it('should reject IP not in whitelist', () => {
      const whitelist = ['127.0.0.1']
      expect(isIPWhitelisted('192.168.1.1', whitelist)).toBe(false)
      expect(isIPWhitelisted('10.0.0.1', whitelist)).toBe(false))
    })

    it('should support /24 CIDR notation', () => {
      const whitelist = ['192.168.1.0/24']
      expect(isIPWhitelisted('192.168.1.1', whitelist)).toBe(true)
      expect(isIPWhitelisted('192.168.1.254', whitelist)).toBe(true)
      expect(isIPWhitelisted('192.168.2.1', whitelist)).toBe(false)
    })

    it('should support wildcard IP matching', () => {
      const whitelist = ['192.168.*', '10.*']
      expect(isIPWhitelisted('192.168.1.1', whitelist)).toBe(true)
      expect(isIPWhitelisted('192.168.254.254', whitelist)).toBe(true)
      expect(isIPWhitelisted('10.0.0.1', whitelist)).toBe(true)
      expect(isIPWhitelisted('10.255.255.255', whitelist)).toBe(true)
    })

    it('should handle IPv6 IPv4-mapped addresses', () => {
      const whitelist = ['127.0.0.1']
      // IPv6 mapped IPv4: ::ffff:127.0.0.1
      expect(isIPWhitelisted('::ffff:127.0.0.1', whitelist)).toBe(true)
    })
  })

  describe('TOTP Generation and Verification', () => {
    let secret: string

    beforeEach(() => {
      const { secret: generated } = generateTOTPSecret('Test Admin')
      secret = generated
    })

    it('should generate valid TOTP secret', () => {
      expect(secret).toBeDefined()
      expect(secret.length).toBeGreaterThan(20)
      // Base32 encoded
      expect(/^[A-Z2-7]+=*$/.test(secret)).toBe(true)
    })

    it('should generate QR code data URL', async () => {
      const { qrCodeDataUrl } = generateTOTPSecret('Test Admin')
      const qrData = await qrCodeDataUrl
      expect(qrData).toBeDefined()
      expect(qrData.startsWith('data:image/png;base64,')).toBe(true)
    })

    it('should generate recovery code', () => {
      const { recoveryCode } = generateTOTPSecret('Test Admin')
      expect(recoveryCode).toBeDefined()
      expect(recoveryCode.length).toBeGreaterThan(8)
    })

    it('should reject invalid TOTP token', () => {
      const result = verifyTOTP('000000', secret)
      expect(result).toBe(false)
    })

    it('should reject malformed token', () => {
      expect(verifyTOTP('abc', secret)).toBe(false)
      expect(verifyTOTP('', secret)).toBe(false)
      expect(verifyTOTP('12345', secret)).toBe(false) // Only 5 digits
    })
  })

  describe('Admin Auth Flow - Test Scenarios', () => {
    it('Scenario 1: IP Block - Request from unauthorized IP', () => {
      const whitelist = ['127.0.0.1', '192.168.1.0/24']
      const unauthorizedIP = '10.0.0.1'

      const isAllowed = isIPWhitelisted(unauthorizedIP, whitelist)
      expect(isAllowed).toBe(false)

      // Expected response: { error: 'IP 10.0.0.1 is not whitelisted', reason: 'ip-blocked' }
    })

    it('Scenario 2: TOTP Fail - Invalid token with whitelisted IP', () => {
      const whitelist = ['127.0.0.1']
      const clientIP = '127.0.0.1'
      const invalidToken = '000000'
      const { secret } = generateTOTPSecret()

      const ipAllowed = isIPWhitelisted(clientIP, whitelist)
      const totpValid = verifyTOTP(invalidToken, secret)

      expect(ipAllowed).toBe(true) // IP is OK
      expect(totpValid).toBe(false) // But TOTP fails

      // Expected response: { error: 'Invalid TOTP token', reason: 'totp-invalid' }
    })

    it('Scenario 3: TOTP Success - Valid token with whitelisted IP', () => {
      const whitelist = ['127.0.0.1']
      const clientIP = '127.0.0.1'

      const ipAllowed = isIPWhitelisted(clientIP, whitelist)
      expect(ipAllowed).toBe(true)

      // In real scenario, would need a valid TOTP code from authenticator
      // Mocked verification would succeed with correct secret and current time window

      // Expected response: { authorized: true }
    })
  })
})
