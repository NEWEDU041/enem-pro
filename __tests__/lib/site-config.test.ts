import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { canonicalUrl } from '../../lib/site-config'

describe('site-config', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalEnv
  })

  describe('canonicalUrl', () => {
    it('should use default URL when env var is not set', () => {
      delete process.env.NEXT_PUBLIC_SITE_URL
      const url = canonicalUrl('/blog')
      expect(url).toBe('https://questoesenem.pro/blog')
    })

    it('should build URL with root path when no argument provided', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
      const url = canonicalUrl()
      expect(url).toBe('https://questoesenem.pro')
    })

    it('should build URL with provided path', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
      const url = canonicalUrl('/blog/post')
      expect(url).toBe('https://questoesenem.pro/blog/post')
    })

    it('should handle path with leading slash', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
      const url = canonicalUrl('/gabarito-enem')
      expect(url).toBe('https://questoesenem.pro/gabarito-enem')
    })

    it('should concatenate URL without duplicate slashes', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
      const url = canonicalUrl('/path')
      expect(url).not.toContain('example.com//')
    })

    it('should work with environment URL that has trailing slash', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://questoesenem.pro/'
      const url = canonicalUrl('/blog')
      expect(url).toMatch(/https:\/\/questoesenem\.pro\/blog/)
    })

    it('should handle empty path string', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
      const url = canonicalUrl('')
      expect(url).toBe('https://questoesenem.pro')
    })

    it('should use production URL as default', () => {
      delete process.env.NEXT_PUBLIC_SITE_URL
      const url = canonicalUrl('/test')
      expect(url).toContain('questoesenem.pro')
    })
  })
})
