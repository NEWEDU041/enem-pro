#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

console.log('📊 GSC MONITOR - TRACKING INDEXAÇÃO')
console.log('')

// Criar arquivo de monitoramento
const monitorPath = path.join(__dirname, '../.docs-gsc/gsc-monitoring.json')

const monitor = {
  timestamp: new Date().toISOString(),
  checklist: {
    newPostsSubmitted: {
      status: '⏳ PENDENTE',
      details: 'Aguardando crawl dos 5 posts novos',
      timeline: '24-48h para Google crawl',
      action: 'Ir a GSC > Cobertura > "Descoberto mas não indexado"'
    },

    coreWebVitalsPhase1: {
      status: '✅ IMPLEMENTADO',
      details: 'Lazy loading + width/height aplicado a 371 posts',
      improvement: 'LCP -28%, CLS -58% esperado',
      action: 'Testar em https://pagespeed.web.dev/',
      nextPhase: 'Phase 2: Image optimization (próxima semana)'
    },

    internalLinkingSetup: {
      status: '✅ PRONTO',
      details: 'Auto-internal-linking script criado',
      coverage: 'Adiciona 3-5 links por post automaticamente',
      action: 'Executar: node scripts/auto-internal-linking.js',
      nextStep: 'Integrar ao CI/CD'
    },

    sitemapGeneration: {
      status: '✅ AUTOMÁTICO',
      details: 'Sitemap.xml gerado com 382 URLs',
      coverage: '377 posts + 5 especiais',
      lastUpdated: '2026-08-09',
      action: 'Verificar em https://questoesenem.pro/sitemap.xml'
    },

    siteIndexing: {
      status: '⏳ MONITORANDO',
      indexed: {
        previous: 86,
        current: '⏳ aguardando atualização',
        expected: 377,
        timeline: '3-7 dias'
      },
      action: 'Check GSC > Cobertura daily',
      alert: 'Avisar se abaixo de 300 posts em 10 dias'
    }
  },

  weeklyChecklist: {
    week1: {
      dates: '2026-08-09 a 2026-08-16',
      items: [
        '[ ] Core Web Vitals Phase 1 - DONE ✅',
        '[ ] Auto-internal-linking setup - DONE ✅',
        '[ ] GSC monitoring started - DONE ✅',
        '[ ] 5 new posts visible in search (check GSC)',
        '[ ] No indexing errors in GSC',
        '[ ] Lazy loading verified with Lighthouse',
        '[ ] Width/height applied to all images'
      ]
    },

    week2: {
      dates: '2026-08-16 a 2026-08-23',
      items: [
        '[ ] Core Web Vitals Phase 2 (image optimization)',
        '[ ] Monitor indexed count in GSC',
        '[ ] Run Lighthouse test again',
        '[ ] Check for crawl errors in GSC',
        '[ ] Verify internal links working',
        '[ ] Test all 5 new posts loading'
      ]
    }
  },

  gscQuickLinks: {
    dashboard: 'https://search.google.com/search-console/property/https://questoesenem.pro',
    coverage: 'https://search.google.com/search-console/coverage',
    performance: 'https://search.google.com/search-console/performance',
    coreWebVitals: 'https://search.google.com/search-console/core-web-vitals'
  },

  alertThresholds: {
    indexedCountDrop: '< 300 posts',
    crawlErrorsIncrease: '> 10 new errors',
    coreWebVitalsDegrade: 'LCP > 3s or CLS > 0.15',
    action: 'Investigate immediately'
  },

  automatedChecks: {
    daily: [
      'GSC coverage count (should trend up)',
      'New crawl errors (should be 0)',
      'Coverage report email'
    ],
    weekly: [
      'Core Web Vitals scores',
      'Performance vs baseline',
      'Indexed vs submitted ratio'
    ],
    monthly: [
      'Ranking improvements',
      'Traffic growth',
      'ROI analysis'
    ]
  },

  nextActions: [
    '1. Deploy (git push origin main)',
    '2. Verify 5 new posts visible on site',
    '3. Check GSC for crawl activity',
    '4. Run Lighthouse test',
    '5. Monitor for 7 days',
    '6. Implement Phase 2 Core Web Vitals'
  ],

  successCriteria: {
    week1: {
      allNewPostsVisible: 'On https://questoesenem.pro/blog',
      googleCrawlStarted: 'In GSC Coverage report',
      noErrors: '0 crawl errors',
      lazyLoadingWorking: 'Verified with DevTools'
    },
    week2: {
      indexedCount: '> 300 posts',
      cwvPhase1: 'LCP < 2.5s',
      internalLinks: '3-5 per post working',
      googleIndexing: 'At least 50 posts indexed'
    }
  }
}

fs.writeFileSync(monitorPath, JSON.stringify(monitor, null, 2), 'utf-8')

console.log('✅ GSC Monitor Created')
console.log('')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 MONITORAMENTO GSC - CHECKLIST')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

console.log('SEMANA 1 (2026-08-09 a 2026-08-16):')
console.log('  ✅ Core Web Vitals Phase 1 (FEITO)')
console.log('  ✅ Auto-internal-linking (PRONTO)')
console.log('  ⏳ 5 novos posts visíveis no site')
console.log('  ⏳ Sem erros de crawl no GSC')
console.log('  ⏳ Lazy loading funcionando (verificar com Lighthouse)')
console.log('')

console.log('SEMANA 2 (2026-08-16 a 2026-08-23):')
console.log('  ⏳ Core Web Vitals Phase 2 (image optimization)')
console.log('  ⏳ Monitorar count de indexed em GSC')
console.log('  ⏳ Testar novamente com Lighthouse')
console.log('  ⏳ Verificar links internos funcionando')
console.log('')

console.log('MÉTRICAS PARA MONITORAR (DAILY):')
console.log('  • GSC Coverage → Posts indexed count (meta: > 300)')
console.log('  • Crawl errors (meta: 0)')
console.log('  • New submitted URLs being crawled')
console.log('  • Core Web Vitals scores')
console.log('')

console.log('AÇÕES IMEDIATAS:')
console.log('  1. Acessar GSC Dashboard ↓')
console.log('     https://search.google.com/search-console')
console.log('')
console.log('  2. Verificar Coverage:')
console.log('     • Indexed: aguardando atualização')
console.log('     • Discovered but not indexed: 5 novo posts')
console.log('     • Errors: esperar 0')
console.log('')
console.log('  3. Testar novo post:')
console.log('     Inspeção de URL → gabarito-enem-completo')
console.log('')
console.log('  4. Monitorar Lighthouse:')
console.log('     https://pagespeed.web.dev/')
console.log('')

console.log('✨ Monitor criado: .docs-gsc/gsc-monitoring.json')
