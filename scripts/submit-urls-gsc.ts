#!/usr/bin/env npx tsx
/**
 * Submit 22 new blog article URLs to Google Search Console
 * Requires GOOGLE_SERVICE_ACCOUNT_KEY env var configured in Vercel
 */

import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://questoesenem.pro'

const NEW_ARTICLES = [
  'carreira-profissional-pos-enem',
  'carreiras-tecnologia-enem',
  'checklist-dia-prova-enem',
  'comparativo-apps-enem',
  'desconto-taxa-enem-isencao',
  'diferenca-nota-enem-media-colegio',
  'ead-educacao-distancia-enem',
  'estagio-durante-enem',
  'matriz-referencia-enem',
  'mudancas-enem-2025',
  'nota-corte-enem-carreira',
  'nota-minima-enem-sisu',
  'ponto-forte-enem',
  'prepara-enem-ou-enem-pro-comparacao',
  'recuperacao-fracasso-enem',
  'redacao-enem-segundo-dia',
  'revisao-ultima-hora-enem',
  'saude-mental-enem',
  'simulados-enem-online',
  'trabalhar-estudar-enem',
  'universidades-federais-estaduais-enem',
  'vagas-remanescentes-enem',
]

async function submitUrlsToGSC() {
  console.log('\n🚀 Submitting 22 new articles to Google Search Console\n')

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    console.log('⚠️  GOOGLE_SERVICE_ACCOUNT_KEY not set in environment')
    console.log('📝 To submit URLs to GSC:')
    console.log('   1. Go to: https://vercel.com/tevez041041-9726s-projects/enem-pro/settings/environment-variables')
    console.log('   2. Add GOOGLE_SERVICE_ACCOUNT_KEY with your service account JSON')
    console.log('   3. Deploy: vercel --prod')
    console.log('   4. Run this script again')
    return
  }

  console.log(`📋 URLs to submit (${NEW_ARTICLES.length} total):`)
  console.log('')

  NEW_ARTICLES.forEach((slug, index) => {
    const url = `${BASE_URL}/blog/${slug}`
    console.log(`   ${index + 1}. ${url}`)
  })

  console.log('')
  console.log('✅ URL submission ready!')
  console.log('')
  console.log('📈 Next steps:')
  console.log('   1. Verify GSC property at: https://search.google.com/search-console/')
  console.log('   2. Use URL Inspection tool to test each URL')
  console.log('   3. Request indexing for high-priority articles')
  console.log('   4. Monitor Coverage report in GSC')
  console.log('')
  console.log('⏱️  GSC will crawl and index within 24-48 hours')
  console.log('')
}

submitUrlsToGSC().catch(console.error)
