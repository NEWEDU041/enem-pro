#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

console.log('🔗 IMPLEMENTANDO LINKS INTERNOS AUTOMATICAMENTE')
console.log('')

// Ler blog-index
const indexPath = path.join(__dirname, '../lib/blog-index.json')
const blogIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))

// Criar mapa de posts por categoria
const postsByCategory = {}
blogIndex.forEach(post => {
  const cat = post.category || 'Sem Categoria'
  if (!postsByCategory[cat]) postsByCategory[cat] = []
  postsByCategory[cat].push(post)
})

const draftsDir = path.join(__dirname, '../.blog-memory/drafts')
let updated = 0
let linksAdded = 0

console.log('📝 Analisando posts para adicionar links...')
console.log('')

const draftFolders = fs.readdirSync(draftsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())

draftFolders.forEach((folder, idx) => {
  const articlePath = path.join(draftsDir, folder.name, 'article.md')
  if (!fs.existsSync(articlePath)) return

  let content = fs.readFileSync(articlePath, 'utf-8')

  // Parse frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  let category = 'Sem Categoria'

  if (match) {
    const frontmatter = {}
    match[1].split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':')
      if (key && valueParts.length) {
        frontmatter[key.trim()] = valueParts.join(':').trim()
      }
    })
    category = frontmatter.category || 'Sem Categoria'
  }

  // Contar links já existentes
  const existingLinks = (content.match(/\[([^\]]+)\]\(\/blog\/([^)]+)\)/g) || []).length

  // Se já tem 3+ links, pular
  if (existingLinks >= 3) return

  // Encontrar posts relacionados (mesma categoria)
  const relatedPosts = (postsByCategory[category] || [])
    .filter(p => p.slug !== folder.name)
    .slice(0, 5)

  if (relatedPosts.length === 0) return

  // Encontrar seção de conteúdo principal (após intro, antes de FAQ)
  const parts = content.split('## FAQ')
  if (parts.length < 2) return

  const bodyContent = parts[0]

  // Encontrar último parágrafo antes do final
  const paragraphs = bodyContent.split('\n\n')
  let insertIndex = -1

  for (let i = paragraphs.length - 1; i >= 0; i--) {
    if (paragraphs[i].trim().length > 100 && !paragraphs[i].startsWith('#')) {
      insertIndex = i
      break
    }
  }

  if (insertIndex === -1) return

  // Criar seção de "Leitura Recomendada"
  const linksToAdd = relatedPosts.slice(0, 3)
  let linksSection = '\n\n## Leitura Recomendada\n\n'

  linksToAdd.forEach(post => {
    linksSection += `- [${post.title}](/blog/${post.slug})\n`
    linksAdded++
  })

  // Inserir antes do FAQ
  paragraphs.splice(insertIndex + 1, 0, linksSection)
  const newContent = paragraphs.join('\n\n')

  // Se mudou, salvar
  if (newContent !== bodyContent) {
    const finalContent = newContent + (parts[1] ? '\n## FAQ' + parts[1] : '')
    fs.writeFileSync(articlePath, finalContent, 'utf-8')
    updated++

    if (updated % 10 === 0) {
      console.log(`✅ ${updated} posts atualizados com ${linksAdded} links...`)
    }
  }
})

console.log('')
console.log('═════════════════════════════════════════════════════════════')
console.log('✅ IMPLEMENTAÇÃO DE LINKS INTERNOS CONCLUÍDA')
console.log('═════════════════════════════════════════════════════════════')
console.log('')
console.log(`📊 Resultados:`)
console.log(`   • Posts atualizados: ${updated}`)
console.log(`   • Links adicionados: ${linksAdded}`)
console.log(`   • Média: ${Math.round(linksAdded/updated || 0)} links por post`)
console.log('')
console.log('🎯 Próximos passos:')
console.log('   1. git add -A && git commit -m "🔗 Add internal links"')
console.log('   2. npm run build')
console.log('   3. Testar links no site')
console.log('   4. Monitorar click-through em GA')
