import type { NextConfig } from 'next'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Regenerate lib/blog-index.json from lib/blog-data.ts on every build startup
// (dev and prod), not just when `npm run build` triggers the `prebuild`
// lifecycle script. Vercel and other CI can invoke `next build` directly,
// which skips npm lifecycle hooks — that let this index go stale before
// (posts existed in blog-data.ts but were missing from the listing/sitemap,
// or sitemap entries 404'd because they no longer existed in blog-data.ts).
// Doing it here guarantees the index can never diverge from the source of
// truth regardless of how the build is invoked.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getAllPosts, getCategory } = require('./lib/blog-data')
  const index = getAllPosts().map((p: { slug: string; title: string; description: string; date: string; readTime: number }) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: p.date,
    readTime: p.readTime,
    category: getCategory(p.slug),
  }))
  const indexPath = join(__dirname, 'lib/blog-index.json')
  const next = JSON.stringify(index)
  const current = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : null
  if (current !== next) {
    writeFileSync(indexPath, next)
    console.log(`[blog-index] regenerated: ${index.length} posts`)
  }
} catch (err) {
  console.warn('[blog-index] failed to regenerate, using existing lib/blog-index.json', err)
}

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        source: '/(dashboard|admin|auth)/(.*)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
  async redirects() {
    // Posts duplicados (mesmo intent de busca, conteúdo quase idêntico) consolidados
    // em um canônico — ver blog-audit-report.md, Achado #4 (cannibalização).
    return [
      { source: '/blog/quando-sai-resultado-enem', destination: '/blog/resultado-enem-2025', permanent: true },
      { source: '/blog/enem-resultado-quando-sai-2026', destination: '/blog/quando-sai-resultado-enem-2026', permanent: true },
      { source: '/blog/nota-de-corte-engenharia-enem', destination: '/blog/engenharia-nota-de-corte-enem', permanent: true },
      { source: '/blog/direito-nota-de-corte-enem', destination: '/blog/nota-de-corte-direito-enem', permanent: true },
      { source: '/blog/enem-treineiro-2026', destination: '/blog/enem-treineiro', permanent: true },
    ]
  },
}

export default nextConfig
