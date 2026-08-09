#!/usr/bin/env node
/**
 * ✅ AUTO-QUALITY-CHECK
 * Valida a qualidade de todos os posts (0-100)
 */

const fs = require('fs')
const path = require('path')

console.log('✅ AUTO-QUALITY-CHECK\n')

const draftsDir = path.join(__dirname, '../.blog-memory/drafts')

if (!fs.existsSync(draftsDir)) {
  console.log('⚠️  Nenhum post encontrado')
  process.exit(0)
}

const folders = fs.readdirSync(draftsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())

let totalScore = 0
let checkedPosts = 0
let failedPosts = []

folders.forEach(folder => {
  const articlePath = path.join(draftsDir, folder.name, 'article.md')
  if (!fs.existsSync(articlePath)) return

  const content = fs.readFileSync(articlePath, 'utf-8')

  // Simple quality scoring
  let score = 0

  // Frontmatter (20 points)
  if (content.includes('title:')) score += 5
  if (content.includes('metaDescription:')) score += 5
  if (content.includes('publishDate:')) score += 5
  if (content.includes('keyword_primary:')) score += 5

  // Content structure (30 points)
  const headings = (content.match(/^## /gm) || []).length
  if (headings >= 3) score += 10
  if (headings >= 5) score += 10
  if (content.includes('## Perguntas Frequentes')) score += 10

  // Word count (20 points)
  const wordCount = content.split(/\s+/).length
  if (wordCount > 1000) score += 10
  if (wordCount > 1500) score += 10

  // Schema (20 points)
  if (content.includes('BlogPosting')) score += 10
  if (content.includes('FAQPage')) score += 10

  // Anti-fabrication (10 points)
  const fabricationPatterns = [
    'nossa plataforma',
    'nossa equipe testou',
    'medimos em laboratório',
    'segundo nossos dados'
  ]
  const hasFabrication = fabricationPatterns.some(p =>
    content.toLowerCase().includes(p)
  )
  if (!hasFabrication) score += 10

  totalScore += score
  checkedPosts++

  if (score < 75) {
    failedPosts.push({
      slug: folder.name,
      score
    })
  }
})

const avgScore = Math.round(totalScore / checkedPosts)

console.log(`📊 Resultado da Validação:\n`)
console.log(`   Posts verificados: ${checkedPosts}`)
console.log(`   Pontuação média: ${avgScore}/100`)
console.log(`   Posts com problema: ${failedPosts.length}\n`)

if (failedPosts.length > 0) {
  console.log(`⚠️  Posts com score < 75:\n`)
  failedPosts.forEach(p => {
    console.log(`   • ${p.slug}: ${p.score}/100`)
  })
} else {
  console.log(`✅ Todos os posts passaram na validação!`)
}

console.log(`\n✓ Quality check concluído`)
