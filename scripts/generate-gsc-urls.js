#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

// Ler blog-index.json gerado
const blogIndexPath = path.join(__dirname, '../public/blog-index.json')

let posts = []
if (fs.existsSync(blogIndexPath)) {
  try {
    const blogIndex = JSON.parse(fs.readFileSync(blogIndexPath, 'utf-8'))
    posts = blogIndex.posts || []
  } catch (err) {
    console.error(`Erro lendo blog-index.json: ${err.message}`)
    process.exit(1)
  }
}

// Adicionar posts estáticos (blog-data.ts)
const blogDataPath = path.join(__dirname, '../lib/blog-data.ts')
const blogDataContent = fs.readFileSync(blogDataPath, 'utf-8')
const staticSlugs = [...blogDataContent.matchAll(/slug: ['"]([^'"]+)['"]/g)].map(m => m[1])

// Combinar
const allSlugs = [...new Set([...posts.map(p => p.slug), ...staticSlugs])]

console.log(`Encontrados ${allSlugs.length} posts únicos`)

// Gerar URLs
const baseUrl = 'https://questoesenem.pro/blog'
const urls = allSlugs.map(slug => `${baseUrl}/${slug}`)

// Adicionar URLs especiais não-blog
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

const allUrls = [...specialUrls, ...urls]

// Salvar em arquivo
const urlsFile = path.join(__dirname, '../gsc-urls-to-submit.txt')
fs.writeFileSync(urlsFile, allUrls.join('\n'), 'utf-8')

console.log(`✅ ${allUrls.length} URLs geradas`)
console.log(`📋 Salvas em: ${urlsFile}`)
console.log(`\nPrimeiros 10:`)
allUrls.slice(0, 10).forEach((url, i) => console.log(`  ${i + 1}. ${url}`))
console.log(`\n...e mais ${allUrls.length - 10}`)
