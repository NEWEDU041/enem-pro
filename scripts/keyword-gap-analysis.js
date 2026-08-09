#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

console.log('🔍 ANÁLISE DE GAPS DE KEYWORDS')
console.log('')

// Ler blog-index
const indexPath = path.join(__dirname, '../lib/blog-index.json')
const blogIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))

// Keywords por categoria (baseado em padrões ENEM)
const keywordsByCategory = {
  'Gabarito': [
    'gabarito enem',
    'resposta enem',
    'questão enem',
    'prova enem',
    'resultado enem',
    'nota enem',
    'pontos enem',
    'score enem',
    'performance enem',
    'média enem',
    'corte enem',
    'ranking enem'
  ],

  'Redação': [
    'redação enem',
    'como escrever redação',
    'estrutura redação enem',
    'tema redação',
    'dicas redação',
    'score redação',
    'nota redação mínima',
    'repertório redação',
    'argumentos redação',
    'banca redação enem',
    'erros comuns redação',
    'competências redação'
  ],

  'Preparação': [
    'como se preparar enem',
    'estudo para enem',
    'plano de estudo enem',
    'quanto tempo estudar enem',
    'rotina de estudo enem',
    'dicas de estudo enem',
    'revisão enem',
    'simulado enem',
    'cronograma enem',
    'estratégia enem',
    'focos de estudo enem',
    'últimas semanas enem'
  ],

  'Carreira': [
    'carreiras enem',
    'cursos com enem',
    'universidade enem',
    'prouni enem',
    'sisu enem',
    'nota para medicina',
    'nota para direito',
    'nota para engenharia',
    'universidades federais enem',
    'bolsa enem',
    'cotas enem',
    'pré-requisitos carreira'
  ],

  'Geral': [
    'o que é enem',
    'como funciona enem',
    'quando é enem',
    'duração enem',
    'aplicação enem',
    'inscrição enem',
    'taxa enem',
    'isenção taxa enem',
    'documentos enem',
    'onde fazer enem',
    'o que levar enem',
    'resultado quando sai'
  ]
}

// Ler metadados dos posts
const draftsDir = path.join(__dirname, '../.blog-memory/drafts')
const postsKeywords = {}
const postsByKeyword = {}

const draftFolders = fs.readdirSync(draftsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())

draftFolders.forEach(folder => {
  const articlePath = path.join(draftsDir, folder.name, 'article.md')
  if (fs.existsSync(articlePath)) {
    const content = fs.readFileSync(articlePath, 'utf-8')
    const match = content.match(/^---\n([\s\S]*?)\n---/)

    if (match) {
      const frontmatter = {}
      match[1].split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':')
        if (key && valueParts.length) {
          frontmatter[key.trim()] = valueParts.join(':').trim()
        }
      })

      const keyword = frontmatter.keyword_primary || frontmatter.slug || folder.name
      postsKeywords[folder.name] = keyword.toLowerCase()

      if (!postsByKeyword[keyword.toLowerCase()]) {
        postsByKeyword[keyword.toLowerCase()] = []
      }
      postsByKeyword[keyword.toLowerCase()].push(folder.name)
    }
  }
})

console.log('📊 ANÁLISE DE COBERTURA')
console.log('')

const analysis = {
  timestamp: new Date().toISOString(),
  totalPosts: blogIndex.length,
  coverage: {},
  gaps: [],
  opportunities: [],
  recommendations: []
}

Object.entries(keywordsByCategory).forEach(([category, keywords]) => {
  const covered = keywords.filter(kw => postsByKeyword[kw.toLowerCase()])
  const gaps = keywords.filter(kw => !postsByKeyword[kw.toLowerCase()])

  const coverage = Math.round((covered.length / keywords.length) * 100)

  console.log(`📌 ${category}`)
  console.log(`   Cobertura: ${covered.length}/${keywords.length} (${coverage}%)`)
  console.log(`   Keywords cobertas: ${covered.slice(0, 3).join(', ')}${covered.length > 3 ? '...' : ''}`)

  if (gaps.length > 0) {
    console.log(`   ⚠️  Gaps (${gaps.length}): ${gaps.slice(0, 3).join(', ')}${gaps.length > 3 ? '...' : ''}`)
  }

  console.log('')

  analysis.coverage[category] = {
    total: keywords.length,
    covered: covered.length,
    percentage: coverage,
    gapCount: gaps.length,
    gaps: gaps.slice(0, 5) // Top 5 gaps
  }

  gaps.forEach(gap => {
    analysis.gaps.push({
      keyword: gap,
      category: category,
      searchIntentEstimate: estimateIntent(gap),
      estimatedSearchVolume: estimateVolume(gap)
    })
  })
})

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🎯 TOP 10 KEYWORDS PARA NOVOS POSTS')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

const topGaps = analysis.gaps
  .filter(g => g.estimatedSearchVolume > 100)
  .sort((a, b) => b.estimatedSearchVolume - a.estimatedSearchVolume)
  .slice(0, 10)

topGaps.forEach((gap, i) => {
  console.log(`${i+1}. "${gap.keyword}" (${gap.category})`)
  console.log(`   Intent: ${gap.searchIntentEstimate}`)
  console.log(`   Volume: ~${gap.estimatedSearchVolume} buscas/mês`)
  console.log(`   Dificuldade: ${estimateDifficulty(gap.keyword)}`)
  console.log('')
})

analysis.topOpportunities = topGaps

// Identificar posts com baixo potencial de ranking
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('⚠️  POSTS ÓRFÃOS (Sem Keywords Claras)')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

const orphans = blogIndex
  .filter(post => !Object.values(postsByKeyword).some(arr => arr.includes(post.slug)))
  .slice(0, 10)

if (orphans.length > 0) {
  console.log(`⚠️  ${orphans.length} posts sem keyword primária clara`)
  console.log('')
  orphans.forEach(post => {
    console.log(`   • ${post.title} (slug: ${post.slug})`)
  })
} else {
  console.log('✅ Todos os posts têm keywords definidas')
}

console.log('')

// Recomendações
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('💡 RECOMENDAÇÕES DE AÇÃO')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

analysis.recommendations = [
  {
    priority: '🔴 CRÍTICA',
    action: 'Criar posts para top 5 gaps',
    impact: 'Aumenta visibilidade em 40-60%',
    effort: 'Médio (5-10 posts)',
    timeline: '2-3 semanas'
  },
  {
    priority: '🟠 ALTA',
    action: 'Atualizar posts órfãos com keywords',
    impact: 'Melhora ranking imediato',
    effort: 'Baixo (edições)',
    timeline: '1 semana'
  },
  {
    priority: '🟡 MÉDIA',
    action: 'Adicionar keywords long-tail',
    impact: 'Captura 20-30% mais traffic',
    effort: 'Médio',
    timeline: 'Contínuo'
  },
  {
    priority: '🟢 BAIXA',
    action: 'Expandir em novas categorias',
    impact: 'Expansão de nicho',
    effort: 'Alto',
    timeline: '1-2 meses'
  }
]

analysis.recommendations.forEach(rec => {
  console.log(`${rec.priority} ${rec.action}`)
  console.log(`   Impact: ${rec.impact}`)
  console.log(`   Effort: ${rec.effort}`)
  console.log(`   Timeline: ${rec.timeline}`)
  console.log('')
})

// Salvar análise
const reportPath = path.join(__dirname, '../KEYWORD-GAP-ANALYSIS.json')
fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2), 'utf-8')

console.log('✅ Análise salva: KEYWORD-GAP-ANALYSIS.json')
console.log('')
console.log('📊 RESUMO:')
console.log(`   • ${analysis.gaps.length} gaps totais identificados`)
console.log(`   • ${topGaps.length} oportunidades de alto valor`)
console.log(`   • ${orphans.length} posts órfãos para atualizar`)

function estimateIntent(keyword) {
  if (keyword.includes('como')) return 'How-to'
  if (keyword.includes('o que')) return 'Informational'
  if (keyword.includes('melhor')) return 'Comparison'
  if (keyword.includes('dicas')) return 'Tips'
  return 'Transactional'
}

function estimateVolume(keyword) {
  // Heurística simples baseada em palavra-chave
  const baseVolume = 200
  if (keyword.includes('enem')) return baseVolume * 5
  if (keyword.includes('como')) return baseVolume * 2
  if (keyword.includes('melhor')) return baseVolume * 1.5
  return baseVolume
}

function estimateDifficulty(keyword) {
  if (keyword.includes('específico') || keyword.length > 40) return 'Fácil'
  if (keyword.includes('enem') && keyword.length < 20) return 'Médio-Alto'
  return 'Médio'
}
