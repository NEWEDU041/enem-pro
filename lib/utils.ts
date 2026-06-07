export const FREE_DAILY_LIMIT = 10
export const FREE_DAILY_EXPLANATIONS = 1
export const ENEM_DATE = new Date('2025-11-09')

export function cleanEnv(val: string | undefined): string {
  return (val || '').replace(new RegExp(String.fromCharCode(65279), 'g'), '').replace(/[\r\n]/g, '').trim()
}

export function isPro(sub: { plan: string; expires_at: string | null } | null | undefined): boolean {
  return !!(sub?.plan === 'pro' && sub?.expires_at && new Date(sub.expires_at) > new Date())
}

export function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86400000)
}
