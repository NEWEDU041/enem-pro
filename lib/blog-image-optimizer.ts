// Core Web Vitals - Image Optimizer
// Implementado: Lazy loading + Width/Height

export function optimizeImageTag(html: string): string {
  // Adicionar loading="lazy" em todas as imagens
  let optimized = html.replace(
    /<img([^>]*)>/g,
    (match, attrs) => {
      // Se já tem loading, pular
      if (attrs.includes('loading=')) return match
      // Adicionar lazy loading
      return `<img${attrs} loading="lazy">`
    }
  )

  // Garantir width e height em imagens markdown
  optimized = optimized.replace(
    /<img([^>]*) alt="([^"]*)"([^>]*)>/g,
    (match, attrs1, alt, attrs2) => {
      // Se já tem width/height, pular
      if (attrs1.includes('width=') || attrs2.includes('width=')) return match
      // Adicionar defaults
      return `<img${attrs1} width="600" height="400" alt="${alt}"${attrs2} loading="lazy">`
    }
  )

  return optimized
}

export function getImageOptimizationConfig() {
  return {
    // Next.js Image Configuration
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
      ],
      formats: ['image/webp', 'image/avif'], // Modern formats
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    },

    // Core Web Vitals Targets
    cwv: {
      lcp: {
        target: 2500, // milliseconds
        current: null, // será medido
        priority: 'CRITICAL',
        optimizations: [
          'lazy loading images',
          'defer non-critical CSS',
          'inline critical CSS',
          'preload fonts',
        ],
      },
      fid: {
        target: 100, // milliseconds
        current: null,
        priority: 'CRITICAL',
        optimizations: [
          'defer JavaScript',
          'code splitting',
          'minimize main thread work',
          'use Web Workers',
        ],
      },
      cls: {
        target: 0.1,
        current: null,
        priority: 'MEDIUM',
        optimizations: [
          'reserve space for images (width/height)',
          'reserve space for ads',
          'avoid inserting content above',
          'use transform animations',
        ],
      },
    },
  }
}
