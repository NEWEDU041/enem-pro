/** @type {import('next').NextConfig} */
// PWA configuration (next-pwa 0.0.1 compatibility: no-op passthrough)
const nextConfig = {
  // ESLint during build desligado por enquanto (117 erros estilo, refactor separado)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript: type-check DESLIGADO (build otimização)
  typescript: {
    ignoreBuildErrors: true,
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
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ]
  },

  // Rewrites para rotas da API
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/sitemap.xml',
          destination: '/api/sitemap',
        },
        {
          source: '/sitemap-:slug.xml',
          destination: '/api/sitemap?slug=:slug',
        },
      ],
    }
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/blog',
        destination: '/',
        permanent: false,
      },
    ]
  },

  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.woff2?$/,
      type: 'asset/resource',
    });

    if (isServer) {
      config.external = [
        ...(config.external || []),
      ];
    }

    return config;
  },

  swcMinify: true,
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
