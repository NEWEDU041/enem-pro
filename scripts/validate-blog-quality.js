#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function validatePost(slug, articlePath) {
  if (!fs.existsSync(articlePath)) {
    return { slug, score: 0, reason: 'arquivo não encontrado' }
  }

  try {
    const content = fs.readFileSync(articlePath, 'utf-8')
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    if (!match) return { slug, score: 0, reason: 'frontmatter inválido' }

    const [, frontmatterStr, body] = match
    const frontmatter = {}
    frontmatterStr.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':')
      if (key && valueParts.length) frontmatter[key.trim()] = valueParts.join(':').trim().replace(/^['"]|['"]$/g, '')
    })

    let score = 0

    // Gate 1: Estrutura (40 pontos)
    score += frontmatter.title ? 10 : 0
    score += frontmatter.slug === slug ? 5 : 0
    score += frontmatter.metaDescription ? 10 : 0
    score += frontmatter.publishDate ? 5 : 0
    score += frontmatter.readTime ? 5 : 0

    // Gate 2: Evidências (30 pontos) — detectar fabricação
    const fabricationPatterns = [
      /nossa (equipe|plataforma|experiência) (testou|avaliou|identificou|mediu)/gi,
      /^dados (de|da) nossa/gim,
      /nossa análise (mostra|revela|prova)/gi,
      /registramos um (aumento|ganho) de \d+/gi,
      /em média \d+ (pontos|questões) por/gi,
      /\d+% (dos|das)\s+(candidatos|alunos)\s+(conseguem|passam)/gi,
    ]

    let fabricationCount = 0
    fabricationPatterns.forEach(pattern => {
      fabricationCount += (body.match(pattern) || []).length
    })

    if (fabricationCount === 0) score += 30
    else if (fabricationCount <= 2) score += 20
    else if (fabricationCount <= 5) score += 10
    else score += 0

    // Gate 3: Conteúdo (20 pontos)
    const wordCount = countWords(body)
    if (wordCount >= 1800) score += 20
    else if (wordCount >= 1200) score += 15
    else if (wordCount >= 800) score += 10
    else if (wordCount >= 500) score += 5
    else score += 0

    // Gate 4: Coesão (10 pontos)
    const headingCount = (body.match(/^#{1,3} /gm) || []).length
    const hasIntro = body.split('\n').slice(0, 3).join(' ').length > 100
    const hasConclusion = body.split('\n').slice(-5).join(' ').includes('Fonte') || body.includes('Recursos')

    if (headingCount >= 3) score += 3
    if (hasIntro) score += 3
    if (hasConclusion) score += 4

    return {
      slug,
      score: Math.min(100, score),
      wordCount,
      headings: headingCount,
      fabricationFlags: fabricationCount,
      hasIntro,
      hasConclusion,
    }
  } catch (err) {
    return { slug, score: 0, reason: `erro: ${err.message}` }
  }
}

// Validar todos os posts
const draftsDir = path.join(__dirname, '../.blog-memory/drafts')
const draftSlugs = fs.readdirSync(draftsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)

// Também os posts estáticos
const blogDataPath = path.join(__dirname, '../lib/blog-data.ts')
const blogDataContent = fs.readFileSync(blogDataPath, 'utf-8')
const staticSlugs = [...blogDataContent.matchAll(/slug: ['"]([^'"]+)['"]/g)].map(m => m[1])

const allSlugs = [...new Set([...draftSlugs, ...staticSlugs])]

const results = []
for (const slug of allSlugs) {
  const draftPath = path.join(draftsDir, slug, 'article.md')
  const result = validatePost(slug, draftPath)
  results.push(result)
}

// Agrupar por score
results.sort((a, b) => b.score - a.score)

const passed = results.filter(r => r.score >= 90)
const warning = results.filter(r => r.score >= 75 && r.score < 90)
const failed = results.filter(r => r.score < 75)

// Gerar relatório
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total: results.length,
    passed: passed.length,
    warning: warning.length,
    failed: failed.length,
    avgScore: (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(1),
  },
  passed: passed.slice(0, 50),
  warning: warning.slice(0, 30),
  failed: failed,
}

console.log(JSON.stringify(report, null, 2))

// Salvar relatório
const reportPath = path.join(__dirname, '../quality-report.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')

console.log(`\n✅ Relatório salvo: ${reportPath}`)
console.log(`\n📊 Resumo:`)
console.log(`  ✅ Passou (90+):     ${passed.length}/${results.length}`)
console.log(`  ⚠️  Atenção (75-89): ${warning.length}/${results.length}`)
console.log(`  ❌ Falhou (<75):     ${failed.length}/${results.length}`)
console.log(`  📈 Média geral:      ${report.summary.avgScore}/100`)
