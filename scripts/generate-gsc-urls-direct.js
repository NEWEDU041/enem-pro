#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

// Lê slugs direto do .blog-memory/drafts
const draftsDir = path.join(__dirname, '../.blog-memory/drafts')
const draftSlugs = fs.readdirSync(draftsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)

console.log(`📁 Encontrados ${draftSlugs.length} posts em drafts`)

// Lê slugs de blog-data.ts
const blogDataPath = path.join(__dirname, '../lib/blog-data.ts')
const blogDataContent = fs.readFileSync(blogDataPath, 'utf-8')
const staticSlugs = [...blogDataContent.matchAll(/slug: ['"]([^'"]+)['"]/g)].map(m => m[1])

console.log(`📄 Encontrados ${staticSlugs.length} posts estáticos`)

// Combinar (sem duplicatas)
const allSlugs = [...new Set([...draftSlugs, ...staticSlugs])]

console.log(`🎯 Total de posts únicos: ${allSlugs.length}`)

// Gerar URLs
const baseUrl = 'https://questoesenem.pro/blog'
const blogUrls = allSlugs.map(slug => `${baseUrl}/${slug}`)

// Adicionar URLs especiais
const specialUrls = [
  'https://questoesenem.pro',
  'https://questoesenem.pro/sobre',
  'https://questoesenem.pro/blog',
  'https://questoesenem.pro/simulado',
  'https://questoesenem.pro/redacao',
  'https://questoesenem.pro/revisao',
  'https://questoesenem.pro/vs',
  'https://questoesenem.pro/temas-redacao',
  'https://questoesenem.pro/tiktok',
]

const allUrls = [...specialUrls, ...blogUrls]

// Salvar tudo
const allUrlsFile = path.join(__dirname, '../gsc-urls-all.txt')
fs.writeFileSync(allUrlsFile, allUrls.join('\n'), 'utf-8')

// Dividir em lotes de 150 para submissão segura
const BATCH_SIZE = 150
const batches = []
for (let i = 0; i < allUrls.length; i += BATCH_SIZE) {
  batches.push(allUrls.slice(i, i + BATCH_SIZE))
}

batches.forEach((batch, idx) => {
  const batchFile = path.join(__dirname, `../gsc-batch-${idx + 1}.txt`)
  fs.writeFileSync(batchFile, batch.join('\n'), 'utf-8')
})

console.log(`\n✅ ${allUrls.length} URLs totais geradas`)
console.log(`📊 Divididas em ${batches.length} lotes de ~${BATCH_SIZE} URLs`)
console.log(`\n📋 Arquivo completo: gsc-urls-all.txt`)
console.log(`📦 Lotes: gsc-batch-1.txt até gsc-batch-${batches.length}.txt`)
console.log(`\n🌐 URLs de blog:`)
console.log(`   ${allSlugs.length} posts`)
console.log(`   ${specialUrls.length} páginas especiais`)
