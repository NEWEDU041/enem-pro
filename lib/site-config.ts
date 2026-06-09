export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://enem-pro-eight.vercel.app'

export function canonicalUrl(path = ''): string {
  return `${SITE_URL}${path}`
}
