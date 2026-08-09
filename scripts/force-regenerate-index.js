#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

console.log('🔄 Forçando regeneração do blog-index.json...')

// Ler posts dos drafts
const draftsDir = path.join(__dirname, '../.blog-memory/drafts')
const draftSlugs = fs.readdirSync(draftsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)

console.log(`✅ Encontrados ${draftSlugs.length} posts em drafts`)

// Ler posts estáticos de blog-data.ts
const blogDataPath = path.join(__dirname, '../lib/blog-data.ts')
const blogDataContent = fs.readFileSync(blogDataPath, 'utf-8')
const staticPosts = []
const matches = [...blogDataContent.matchAll(/{\s*slug:\s['"]([^'"]+)['"]/g)]
matches.forEach(match => {
  const slug = match[1]
  const titleMatch = blogDataContent.slice(match.index, match.index + 500).match(/title:\s['"]([^'"]+)['"]/)
  const descMatch = blogDataContent.slice(match.index, match.index + 500).match(/description:\s['"]([^'"]+)['"]/)
  const dateMatch = blogDataContent.slice(match.index, match.index + 500).match(/date:\s['"]([^'"]+)['"]/)
  const readTimeMatch = blogDataContent.slice(match.index, match.index + 500).match(/readTime:\s(\d+)/)

  if (titleMatch && descMatch && dateMatch) {
    staticPosts.push({
      slug,
      title: titleMatch[1],
      description: descMatch[1],
      date: dateMatch[1],
      readTime: readTimeMatch ? parseInt(readTimeMatch[1]) : 5,
      category: 'Blog'
    })
  }
})

console.log(`✅ Encontrados ${staticPosts.length} posts estáticos`)

// Ler metadados dos drafts
const posts = []
for (const slug of draftSlugs) {
  const articlePath = path.join(draftsDir, slug, 'article.md')
  if (fs.existsSync(articlePath)) {
    try {
      const content = fs.readFileSync(articlePath, 'utf-8')
      const match = content.match(/^---\n([\s\S]*?)\n---/)
      if (match) {
        const frontmatter = {}
        match[1].split('\n').forEach(line => {
          const [key, ...valueParts] = line.split(':')
          if (key && valueParts.length) {
            frontmatter[key.trim()] = valueParts.join(':').trim().replace(/^['"]|['"]$/g, '')
          }
        })

        posts.push({
          slug: frontmatter.slug || slug,
          title: frontmatter.title || slug,
          description: frontmatter.metaDescription || frontmatter.description || 'Artigo sobre ENEM',
          date: frontmatter.publishDate || frontmatter.date || '2025-01-01',
          readTime: frontmatter.readTime ? parseInt(frontmatter.readTime) : 5,
          category: frontmatter.category || 'Blog'
        })
      }
    } catch (err) {
      console.error(`⚠️  Erro lendo ${slug}: ${err.message}`)
    }
  }
}

// Combinar e remover duplicatas
const allPosts = [...new Map(posts.concat(staticPosts).map(p => [p.slug, p])).values()]
allPosts.sort((a, b) => new Date(b.date) - new Date(a.date))

console.log(`✅ Total de posts únicos: ${allPosts.length}`)

// Salvar blog-index.json
const indexPath = path.join(__dirname, '../lib/blog-index.json')
fs.writeFileSync(indexPath, JSON.stringify(allPosts, null, 2), 'utf-8')

console.log(`✅ blog-index.json regenerado com ${allPosts.length} posts`)
console.log(`📝 Arquivo: ${indexPath}`)
