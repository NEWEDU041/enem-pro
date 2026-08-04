#!/usr/bin/env node
/**
 * Auditoria completa de blog posts
 * Verifica: meta tags, imagens, estrutura, links
 */

import * as fs from 'fs'
import * as path from 'path'

interface BlogIssue {
  file: string
  issues: string[]
  score: number
}

const BLOG_DIR = 'blog-posts'
const REQUIRED_FIELDS = ['title', 'description', 'date']
const TITLE_LENGTH_MIN = 50
const TITLE_LENGTH_MAX = 60
const DESC_LENGTH_MIN = 150
const DESC_LENGTH_MAX = 160

// Parse frontmatter simples (sem dependências)
function parseFrontmatter(content: string): { data: Record<string, string>; body: string } {
  const lines = content.split('\n')
  if (lines[0] !== '---') return { data: {}, body: content }

  let endLine = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endLine = i
      break
    }
  }

  if (endLine === -1) return { data: {}, body: content }

  const data: Record<string, string> = {}
  for (let i = 1; i < endLine; i++) {
    const line = lines[i]
    const [key, ...valueParts] = line.split(':')
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '')
      data[key.trim()] = value
    }
  }

  const body = lines.slice(endLine + 1).join('\n')
  return { data, body }
}

function auditPost(file: string): BlogIssue {
  const filePath = path.join(BLOG_DIR, file)
  const content = fs.readFileSync(filePath, 'utf8')
  const { data, body } = parseFrontmatter(content)

  const issues: string[] = []
  let score = 100

  // Verificar campos obrigatórios
  REQUIRED_FIELDS.forEach(field => {
    if (!data[field]) {
      issues.push(`❌ Falta campo "${field}"`)
      score -= 10
    }
  })

  // Verificar comprimento do título
  if (data.title) {
    const len = data.title.length
    if (len < TITLE_LENGTH_MIN) {
      issues.push(`⚠️  Título muito curto (${len}/${TITLE_LENGTH_MIN} chars)`)
      score -= 5
    } else if (len > TITLE_LENGTH_MAX) {
      issues.push(`⚠️  Título muito longo (${len}/${TITLE_LENGTH_MAX} chars)`)
      score -= 5
    }
  }

  // Verificar comprimento da description
  if (data.description) {
    const len = data.description.length
    if (len < DESC_LENGTH_MIN) {
      issues.push(`⚠️  Description muito curta (${len}/${DESC_LENGTH_MIN} chars)`)
      score -= 5
    } else if (len > DESC_LENGTH_MAX) {
      issues.push(`⚠️  Description muito longa (${len}/${DESC_LENGTH_MAX} chars)`)
      score -= 5
    }
  }

  // Verificar imagem hero
  if (!data.image) {
    issues.push('⚠️  Sem imagem hero definida')
    score -= 10
  }

  // Verificar H1 no conteúdo
  if (!body.includes('# ')) {
    issues.push('❌ Sem H1 no conteúdo')
    score -= 10
  }

  // Verificar índice (TOC)
  if (!body.includes('##')) {
    issues.push('⚠️  Sem sub-seções (H2)')
    score -= 5
  }

  // Verificar CTA (Call to Action)
  if (!body.includes('[') || !body.includes('](')) {
    issues.push('⚠️  Sem links internos (CTA)')
    score -= 5
  }

  // Verificar erros óbvios
  const typos = body.match(/\s{2,}/g) || []
  if (typos.length > 5) {
    issues.push(`⚠️  Espaços duplos encontrados (${typos.length}x)`)
    score -= 3
  }

  return { file, issues, score: Math.max(0, score) }
}

async function main() {
  console.log('📰 Auditando Blog Posts...\n')

  if (!fs.existsSync(BLOG_DIR)) {
    console.error(`❌ Diretório ${BLOG_DIR} não encontrado`)
    process.exit(1)
  }

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'))
  console.log(`📋 Posts encontrados: ${files.length}\n`)

  const results: BlogIssue[] = files.map(auditPost).sort((a, b) => a.score - b.score)

  let totalScore = 0
  results.forEach(r => {
    totalScore += r.score
    const scoreEmoji = r.score >= 90 ? '✅' : r.score >= 70 ? '⚠️ ' : '❌'
    console.log(`${scoreEmoji} ${r.file} (${r.score}/100)`)

    r.issues.forEach(issue => {
      console.log(`   ${issue}`)
    })
    console.log()
  })

  const avgScore = (totalScore / results.length).toFixed(1)
  console.log(`\n📊 Pontuação Média: ${avgScore}/100`)

  // Recomendações
  console.log('\n💡 Recomendações:')
  const lowScorePosts = results.filter(r => r.score < 70)
  if (lowScorePosts.length > 0) {
    console.log(
      `   1. Revisar posts com baixa pontuação: ${lowScorePosts.map(r => r.file).join(', ')}`
    )
  }
  console.log('   2. Adicionar imagens hero (opengraph, social media)')
  console.log('   3. Melhorar titles e descriptions para SEO')
  console.log('   4. Adicionar links internos para outras páginas')
  console.log('   5. Usar schema.org markup (Article, FAQPage)')

  process.exit(lowScorePosts.length > 0 ? 1 : 0)
}

main().catch(console.error)
