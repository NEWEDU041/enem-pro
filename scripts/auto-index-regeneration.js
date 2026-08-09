#!/usr/bin/env node
/**
 * 🔄 AUTO-INDEX-REGENERATION
 * Regenera blog-index.json com todos os posts
 */

const fs = require('fs')
const path = require('path')

console.log('🔄 AUTO-INDEX-REGENERATION\n')

const draftsDir = path.join(__dirname, '../.blog-memory/drafts')
const indexPath = path.join(__dirname, '../lib/blog-index.json')

if (!fs.existsSync(draftsDir)) {
  console.log('⚠️  Nenhum post encontrado')
  process.exit(0)
}

const folders = fs.readdirSync(draftsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())

const posts = []

folders.forEach(folder => {
  const articlePath = path.join(draftsDir, folder.name, 'article.md')
  if (!fs.existsSync(articlePath)) return

  const content = fs.readFileSync(articlePath, 'utf-8')
  const match = content.match(/^---\n([\s\S]*?)\n---/)

  if (!match) return

  const frontmatter = {}
  match[1].split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':')
    if (key && valueParts.length) {
      let value = valueParts.join(':').trim().replace(/^['"]|['"]$/g, '')
      if (key.trim() === 'readTime') {
        value = parseInt(value, 10)
      }
      frontmatter[key.trim()] = value
    }
  })

  posts.push({
    slug: folder.name,
    title: frontmatter.title || folder.name,
    description: frontmatter.metaDescription || frontmatter.description || '',
    date: frontmatter.publishDate || new Date().toISOString().split('T')[0],
    readTime: frontmatter.readTime || 5,
    category: frontmatter.category || 'geral'
  })
})

// Sort by date descending
posts.sort((a, b) => new Date(b.date) - new Date(a.date))

const index = { posts }

// Ensure lib directory exists
const libDir = path.dirname(indexPath)
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true })
}

fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8')

console.log(`📊 Resultado da Regeneração:\n`)
console.log(`   Posts encontrados: ${posts.length}`)
console.log(`   Arquivo: ${indexPath}`)
console.log(`   Status: ✅ Criado com sucesso\n`)
console.log(`✓ Index regeneration concluído`)
