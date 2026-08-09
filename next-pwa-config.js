const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  fallbacks: {
    image: '/images/fallback.png',
    font: '/fonts/fallback.woff2',
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
          maxAgeSeconds: 5 * 60, // 5 minutos
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
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
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
          maxAgeSeconds: 24 * 60 * 60, // 1 dia
        },
      },
    },
  ],
})

module.exports = withPWA

// Para usar no next.config.js:
// const withPWA = require('./next-pwa-config')
// const nextConfig = { ... }
// module.exports = withPWA(nextConfig)
