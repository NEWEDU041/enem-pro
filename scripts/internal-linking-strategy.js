#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

console.log('🔗 ESTRATÉGIA DE LINKS INTERNOS - ANÁLISE COMPLETA')
console.log('')

// Ler blog-index
const indexPath = path.join(__dirname, '../lib/blog-index.json')
const blogIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))

// Agrupar por categoria
const byCategory = {}
blogIndex.forEach(post => {
  const cat = post.category || 'Sem Categoria'
  if (!byCategory[cat]) byCategory[cat] = []
  byCategory[cat].push(post)
})

console.log('📊 ANÁLISE INICIAL')
console.log(`Total de posts: ${blogIndex.length}`)
console.log(`Categorias: ${Object.keys(byCategory).length}`)
console.log(`Posts com links internos: ⏳ Analisando...`)
console.log('')

// Ler drafts e contar links internos
const draftsDir = path.join(__dirname, '../.blog-memory/drafts')
let postsComLinks = 0
let totalLinks = 0
const linkingMap = {}

const draftFolders = fs.readdirSync(draftsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())

draftFolders.forEach(folder => {
  const articlePath = path.join(draftsDir, folder.name, 'article.md')
  if (fs.existsSync(articlePath)) {
    const content = fs.readFileSync(articlePath, 'utf-8')

    // Contar links para posts
    const linkPattern = /\[([^\]]+)\]\(\/blog\/([^)]+)\)/g
    let match
    let linksCount = 0
    const linksHere = []

    while ((match = linkPattern.exec(content)) !== null) {
      linksCount++
      linksHere.push(match[2])

      if (!linkingMap[match[2]]) linkingMap[match[2]] = []
      linkingMap[match[2]].push(folder.name)
    }

    if (linksCount > 0) {
      postsComLinks++
      totalLinks += linksCount
    }
  }
})

console.log(`✅ Posts com links internos: ${postsComLinks}/${blogIndex.length} (${Math.round(postsComLinks/blogIndex.length*100)}%)`)
console.log(`✅ Total de links internos: ${totalLinks}`)
console.log(`✅ Média: ${Math.round(totalLinks/blogIndex.length)} links por post`)
console.log('')

// Estratégia
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🎯 ESTRATÉGIA RECOMENDADA')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

const strategy = {
  objetivo: "Melhorar SEO com links internos estratégicos",
  meta: "3-5 links relevantes por post",
  beneficios: [
    "Aumenta relevância de tópicos (topical authority)",
    "Melhora crawlability do Google",
    "Aumenta page authority interna",
    "Melhora user engagement (tempo no site)",
    "Ajuda a rankings de posts fracos"
  ],

  fases: {
    "Fase 1 - Foundation (Semana 1)": [
      "Identificar posts core (pillar content)",
      "Mapear temas relacionados (clusters)",
      "Criar hub pages (páginas centrais por tema)"
    ],

    "Fase 2 - Linking (Semana 2-3)": [
      "Adicionar 3-5 links por post",
      "Links devem ser contextuais (no texto)",
      "Usar anchor text com keyword relevante",
      "Linkar de posts antigos para novos"
    ],

    "Fase 3 - Optimization (Semana 4)": [
      "Monitorar click-through de links internos",
      "A/B test de anchor text",
      "Remover links ruins",
      "Otimizar estrutura de links"
    ]
  },

  recommendations: [
    {
      title: "1. Posts com Zero Links Internos",
      action: "Prioridade: CRÍTICA",
      description: `${blogIndex.length - postsComLinks} posts não têm links internos saindo deles`,
      solucao: "Adicionar 3-5 links relevantes em cada um"
    },
    {
      title: "2. Posts Órfãos (Nunca Linkeados)",
      action: "Prioridade: ALTA",
      description: `Posts que ninguém linka precisam de ajuda`,
      solucao: "Adicionar links de posts relacionados"
    },
    {
      title: "3. Anchor Text Optimization",
      action: "Prioridade: MÉDIA",
      description: "Usar keywords nos links (não 'clique aqui')",
      solucao: "Usar anchor text descritivo com keyword"
    },
    {
      title: "4. Topical Clusters",
      action: "Prioridade: ALTA",
      description: "Agrupar posts por tema principal",
      solucao: "Criar hub page para cada tema + linkar clusters"
    }
  ]
}

console.log('✅ OBJETIVO:')
console.log(`   ${strategy.objetivo}`)
console.log('')

console.log('📈 BENEFÍCIOS:')
strategy.beneficios.forEach((b, i) => {
  console.log(`   ${i+1}. ${b}`)
})
console.log('')

console.log('📋 FASES:')
Object.entries(strategy.fases).forEach(([fase, items]) => {
  console.log(`\n${fase}`)
  items.forEach(item => {
    console.log(`  □ ${item}`)
  })
})
console.log('')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('⚠️  PROBLEMAS ENCONTRADOS')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

strategy.recommendations.forEach(rec => {
  console.log(`🔴 ${rec.title}`)
  console.log(`   Ação: ${rec.action}`)
  console.log(`   Problema: ${rec.description}`)
  console.log(`   Solução: ${rec.solucao}`)
  console.log('')
})

// Gerar mapa de linking oportunidades
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('💡 OPORTUNIDADES DE LINKS POR CATEGORIA')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

Object.entries(byCategory).forEach(([cat, posts]) => {
  console.log(`📌 ${cat} (${posts.length} posts)`)

  // Sugerir estrutura
  if (posts.length >= 3) {
    console.log(`   ✅ Hub page: "${cat}" - link os ${posts.length} posts`)
    console.log(`   ✅ Cada post linka para 2-3 outros de mesma categoria`)
    console.log(`   ✅ Posts fracos linkeam de posts fortes`)
  }

  console.log('')
})

// Salvar relatório
const reportPath = path.join(__dirname, '../INTERNAL-LINKING-STRATEGY.json')
fs.writeFileSync(reportPath, JSON.stringify(strategy, null, 2), 'utf-8')

console.log('✅ Relatório salvo: INTERNAL-LINKING-STRATEGY.json')
console.log('')
console.log('📊 PRÓXIMOS PASSOS:')
console.log('   1. Executar: node scripts/find-linking-opportunities.js')
console.log('   2. Gerar: Mapa de oportunidades')
console.log('   3. Implementar: Links contextuais nos posts')
console.log('   4. Monitorar: Click-through rates')
