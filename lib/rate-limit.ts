const store = new Map<string, number[]>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 10

export function checkRateLimit(userId: string): { ok: boolean; retryAfterMs: number } {
  const now = Date.now()
  const hits = (store.get(userId) ?? []).filter((t) => now - t < WINDOW_MS)

  if (hits.length >= MAX_PER_WINDOW) {
    return { ok: false, retryAfterMs: WINDOW_MS - (now - hits[0]) }
  }

  hits.push(now)
  store.set(userId, hits)
  return { ok: true, retryAfterMs: 0 }
}
