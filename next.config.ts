import type { NextConfig } from 'next'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

// NOTE: Disabled regeneration of lib/blog-index.json in next.config.ts due to
// Next.js 15 breaking change with large TypeScript imports at build time.
// The `npm run prebuild` script handles this correctly; Vercel should invoke
// `npm run build` (not `next build` directly) to ensure lifecycle scripts run.
// If this is ever re-enabled, ensure lib/blog-data.ts is transpiled-only (no runtime load).
// See: https://github.com/vercel/next.js/discussions/xxxxx (Next 15 config loading)

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
