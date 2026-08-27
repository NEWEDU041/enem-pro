/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  fallbacks: {
    image: '/images/fallback.png',
    document: '/offline.html',
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/questoesenem\.pro\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60,
        },
      },
    },
    {
      urlPattern: /^https:\/\/questoesenem\.pro\/images\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https:\/\/questoesenem\.pro\/blog\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'blog-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
  ],
})

// Otimizações para performance e SEO
const nextConfig = {
  // ESLint during build desligado por enquanto (117 erros estilo, refactor separado)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript: type-check habilitado (blog-data layer corrigida, tsc limpo)
  typescript: {
    ignoreBuildErrors: false,
  },

  // Image Optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Performance
  compress: true,

  // Headers para Cache (Agressivo)
  async headers() {
    return [
      // Assets estáticos: cache por 1 ano
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Blog posts: cache por 1 hora + 1 dia stale
      {
        source: '/blog/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      // Homepage: cache por 1 hora + 1 dia stale
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      // Default: cache por 1 hora
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/inicio',
        destination: '/',
        permanent: true,
      },
    ]
  },

  // Rewrites
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    }
  },

}

module.exports = withPWA(nextConfig)
