#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

console.log('📊 Gerando configuração de Google Analytics...')

const analyticsConfig = {
  "measurementId": "G-XXXXXXXX",
  "apiSecret": "XXXXXXXX_XXXXXXXX",
  "gtmId": "GTM-XXXXXXX",
  "implementation": {
    "type": "Google Analytics 4 (GA4)",
    "method": "google-analytics React hook",
    "tracking": [
      "page views (automático)",
      "events customizados",
      "conversões",
      "user engagement",
      "scroll depth"
    ]
  },
  "events": {
    "page_view": "disparado automaticamente",
    "view_item": "quando usuário acessa um post",
    "blog_engagement": "scroll > 50% ou leitura > 30s",
    "cta_click": "clique em CTA",
    "search_query": "quando faz busca no site"
  },
  "setup_instructions": [
    "1. Ir para Google Analytics (analytics.google.com)",
    "2. Criar propriedade GA4 para questoesenem.pro",
    "3. Copiar Measurement ID (G-XXXXXXXX)",
    "4. Adicionar em .env.production.local: NEXT_PUBLIC_GA_ID=G-XXXXXXXX",
    "5. Adicionar script no components/Analytics.tsx",
    "6. Testar com GA Debugger extension",
    "7. Aguardar 24h para dados aparecerem"
  ],
  "features": {
    "real_time": "Ver visitantes em tempo real",
    "audience": "Segmentar por país, device, browser",
    "content": "Analisar quais posts têm mais engajamento",
    "conversions": "Rastrear CTAs e leads",
    "custom_events": "Eventos personalizados (blog_share, cta_click, etc)"
  }
}

const analyticsPath = path.join(__dirname, '../ANALYTICS-CONFIG.json')
fs.writeFileSync(analyticsPath, JSON.stringify(analyticsConfig, null, 2), 'utf-8')

console.log('✅ ANALYTICS-CONFIG.json criado')
console.log('')

// Gerar snippet de implementação
const analyticsSnippet = `
// Adicione isto em: app/components/Analytics.tsx

'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

export function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    // Script do Google Analytics
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX'
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    function gtag(...args: any[]) {
      window.dataLayer.push(arguments)
    }
    gtag('js', new Date())
    gtag('config', 'G-XXXXXXXX', {
      page_path: pathname,
      send_page_view: true
    })
  }, [pathname])

  useEffect(() => {
    // Rastrear scroll depth
    let scrollPercent = 0
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      scrollPercent = docHeight ? (scrollTop / docHeight) * 100 : 0

      if (scrollPercent > 50 && !document.body.dataset.scroll50) {
        document.body.dataset.scroll50 = 'true'
        window.gtag?.('event', 'blog_engagement', {
          engagement_type: 'scroll_50',
          page: pathname
        })
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname])

  return null
}
`

const snippetPath = path.join(__dirname, '../ANALYTICS-IMPLEMENTATION.tsx')
fs.writeFileSync(snippetPath, analyticsSnippet, 'utf-8')

console.log('✅ ANALYTICS-IMPLEMENTATION.tsx criado')
console.log('')

// Gerar instruções de setup
const setupInstructions = `
# CONFIGURAÇÃO DE GOOGLE ANALYTICS - PASSO A PASSO

## 1. Criar Propriedade GA4

1. Acesse: https://analytics.google.com
2. Faça login com sua conta Google
3. Clique em "Criar propriedade"
4. Nome: "ENEM Pro - Blog"
5. Timezone: "Brasília (UTC-3)"
6. Moeda: "BRL"
7. Selecione "Web"

## 2. Registrar o Site

1. Nome de fluxo de dados: "questoesenem.pro"
2. URL: https://questoesenem.pro
3. Clique em "Criar fluxo"
4. Copie o "Measurement ID" (formato: G-XXXXXXXX)

## 3. Configurar no Projeto

1. Abra: .env.production.local
2. Adicione:
   NEXT_PUBLIC_GA_ID=G-XXXXXXXX (Cole o ID que você copiou)

3. Abra: app/layout.tsx
4. Adicione no <head>:
   <Analytics />

5. Crie: app/components/Analytics.tsx
6. Cole o código de ANALYTICS-IMPLEMENTATION.tsx

## 4. Deploy

1. Commit as mudanças:
   git add .env.production.local app/components/Analytics.tsx app/layout.tsx
   git commit -m "🔧 Google Analytics setup"

2. Deploy para Vercel

## 5. Testar

1. Abra: https://questoesenem.pro
2. Instale: Google Analytics Debugger (extensão Chrome)
3. Abra DevTools (F12)
4. Vá para aba "Google Analytics"
5. Verifique se eventos estão sendo disparados

## 6. Monitorar

1. Volte para Google Analytics
2. Seção "Realtime" → veja visitantes em tempo real
3. Aguarde 24h para dados históricos aparecerem

## Métricas Importantes

- **Usuários**: Número de visitantes únicos
- **Sessões**: Número de visitas
- **Duração média**: Tempo médio no site
- **Taxa de rejeição**: % usuários que saem sem interagir
- **Conversões**: Cliques em CTAs
- **Engajamento**: Scroll depth, tempo lido, etc

## Onde Acompanhar

- Realtime: Visitantes agora
- Audience: Quem está visitando
- Traffic Sources: De onde viêm os visitantes
- Content: Quais posts mais acessados
- Engagement: Como interagem com o site

## Próximos Passos

1. Setup: ~5 minutos
2. Primeiro deploy: ~2 minutos
3. Primeira visualização: ~24 horas
4. Análise de dados: ~2 semanas

Boa sorte! 🚀
`

const setupPath = path.join(__dirname, '../ANALYTICS-SETUP.md')
fs.writeFileSync(setupPath, setupInstructions, 'utf-8')

console.log('✅ ANALYTICS-SETUP.md criado')
console.log('')

console.log('═════════════════════════════════════════════════════════════')
console.log('✅ CONFIGURAÇÃO DE ANALYTICS COMPLETA')
console.log('═════════════════════════════════════════════════════════════')
console.log('')
console.log('Arquivos criados:')
console.log('  • ANALYTICS-CONFIG.json')
console.log('  • ANALYTICS-IMPLEMENTATION.tsx')
console.log('  • ANALYTICS-SETUP.md')
console.log('')
console.log('Próximo passo: Configurar em Google Analytics')
