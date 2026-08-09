#!/usr/bin/env node
/**
 * 🗺️  AUTO-SITEMAP
 * Gera sitemap.xml com todos os posts
 */

const fs = require('fs')
const path = require('path')

console.log('🗺️  AUTO-SITEMAP\n')

const draftsDir = path.join(__dirname, '../.blog-memory/drafts')
const publicDir = path.join(__dirname, '../public')
const sitemapPath = path.join(publicDir, 'sitemap.xml')

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

if (!fs.existsSync(draftsDir)) {
  console.log('⚠️  Nenhum post encontrado')
  process.exit(0)
}

const folders = fs.readdirSync(draftsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())

let urlEntries = ''
const domain = 'https://enemprep.com.br'

folders.forEach(folder => {
  const articlePath = path.join(draftsDir, folder.name, 'article.md')
  if (!fs.existsSync(articlePath)) return

  const content = fs.readFileSync(articlePath, 'utf-8')
  const match = content.match(/^---\n([\s\S]*?)\n---/)

  if (!match) return

  let publishDate = new Date().toISOString().split('T')[0]
  match[1].split('\n').forEach(line => {
    if (line.includes('publishDate:')) {
      publishDate = line.split(':').slice(1).join(':').trim().replace(/^['"]|['"]$/g, '')
    }
  })

  const url = `${domain}/blog/${folder.name}`
  urlEntries += `
  <url>
    <loc>${url}</loc>
    <lastmod>${publishDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
})

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${domain}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>${urlEntries}
</urlset>`

fs.writeFileSync(sitemapPath, sitemap, 'utf-8')

const urlCount = (urlEntries.match(/<loc>/g) || []).length

console.log(`📊 Resultado do Sitemap:\n`)
console.log(`   URLs no sitemap: ${urlCount + 2} (incluindo home e /blog)`)
console.log(`   Arquivo: ${sitemapPath}`)
console.log(`   Status: ✅ Criado com sucesso\n`)
console.log(`✓ Sitemap generation concluído`)
