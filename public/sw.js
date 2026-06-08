const CACHE = 'enem-pro-v1'
const PRECACHE = ['/', '/planos', '/blog', '/questoes', '/simulado']

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {})))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // Bypass: API, auth, Supabase, non-GET
  if (
    e.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('anthropic.com')
  ) return

  // Network-first for HTML navigation
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
          return res
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match('/')))
    )
    return
  }

  // Cache-first for static assets (_next/static)
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached
        return fetch(e.request).then((res) => {
          caches.open(CACHE).then((c) => c.put(e.request, res.clone()))
          return res
        })
      })
    )
    return
  }
})
