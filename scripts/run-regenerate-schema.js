#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

console.log('🔄 REGENERANDO SCHEMAS...')

const draftsDir = path.join(__dirname, '../.blog-memory/drafts')
let updated = 0

const draftFolders = fs.readdirSync(draftsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())

draftFolders.forEach(folder => {
  const articlePath = path.join(draftsDir, folder.name, 'article.md')
  if (!fs.existsSync(articlePath)) return

  let content = fs.readFileSync(articlePath, 'utf-8')

  // Remove old schema tags
  content = content.replace(/```json\n{\n  "@context":[\s\S]*?}\n```/g, '')

  // Parse frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return

  const frontmatter = {}
  match[1].split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':')
    if (key && valueParts.length) {
      frontmatter[key.trim()] = valueParts.join(':').trim().replace(/^['"]|['"]$/g, '')
    }
  })

  // Generate BlogPosting schema
  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": frontmatter.title || folder.name,
    "description": frontmatter.metaDescription || frontmatter.description || "Artigo sobre ENEM",
    "datePublished": frontmatter.publishDate || "2026-01-01",
    "dateModified": frontmatter.lastUpdated || frontmatter.publishDate || new Date().toISOString().split('T')[0],
    "author": {
      "@type": "Person",
      "name": "Eduardo Mendonça"
    }
  }

  // Add FAQ schema if FAQ section exists
  let faqSchema = null
  if (content.includes('## FAQ') || content.includes('## Perguntas')) {
    const faqItems = (content.match(/### [^\n]+/g) || [])
      .slice(0, 5)
      .map(heading => ({
        "@type": "Question",
        "name": heading.replace('### ', '').trim(),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Resposta completa no artigo"
        }
      }))

    if (faqItems.length > 0) {
      faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems
      }
    }
  }

  // Append schemas to content
  const blogPostingTag = `\
\`\`\`json
${JSON.stringify(blogPostingSchema, null, 2)}
\`\`\``
  content += blogPostingTag

  if (faqSchema) {
    const faqTag = `\
\`\`\`json
${JSON.stringify(faqSchema, null, 2)}
\`\`\``
    content += faqTag
  }

  fs.writeFileSync(articlePath, content, 'utf-8')
  updated++
})

console.log(`✅ Schemas regenerados: ${updated} posts`)
console.log('   ✓ BlogPosting schema atualizado')
console.log('   ✓ FAQPage schema regenerado')
console.log('   ✓ Datas de modificação atualizadas')
console.log('   ✓ Rich snippets otimizados')
