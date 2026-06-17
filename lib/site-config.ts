export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://questoesenem.pro'

export function canonicalUrl(path = ''): string {
  return `${SITE_URL}${path}`
}
