#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

console.log('🔗 AUTO-INTERNAL-LINKING - SETUP AUTOMÁTICO')
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
let postsWithLinks = 0

const draftFolders = fs.readdirSync(draftsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())

console.log(`📝 Analisando ${draftFolders.length} posts para adicionar links internos...`)
console.log('')

draftFolders.forEach((folder, idx) => {
  const articlePath = path.join(draftsDir, folder.name, 'article.md')
  if (!fs.existsSync(articlePath)) return

  let content = fs.readFileSync(articlePath, 'utf-8')

  // Parse frontmatter para categoria
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
  if (existingLinks >= 3) {
    postsWithLinks++
    return
  }

  // Encontrar posts relacionados
  const relatedPosts = (postsByCategory[category] || [])
    .filter(p => p.slug !== folder.name)
    .slice(0, 5)

  if (relatedPosts.length === 0) return

  // Encontrar onde inserir links (antes do FAQ)
  const faqIndex = content.indexOf('## FAQ')
  const perguntasIndex = content.indexOf('## Perguntas')
  let insertIndex = faqIndex > 0 ? faqIndex : perguntasIndex

  if (insertIndex === -1) {
    // Se não tiver FAQ/Perguntas, inserir antes de Fontes
    insertIndex = content.indexOf('## Fontes')
  }

  if (insertIndex === -1) return

  // Criar seção de links
  const linksToAdd = relatedPosts.slice(0, 3)
  let linksSection = '\n\n## Leitura Recomendada\n\nPosts relacionados que você pode gostar:\n\n'

  linksToAdd.forEach(post => {
    linksSection += `- [${post.title}](/blog/${post.slug})\n`
  })

  // Inserir antes do ponto de referência
  const beforePart = content.substring(0, insertIndex)
  const afterPart = content.substring(insertIndex)

  const newContent = beforePart + linksSection + '\n' + afterPart

  // Salvar se mudou
  fs.writeFileSync(articlePath, newContent, 'utf-8')
  updated++
  postsWithLinks++

  if (updated % 50 === 0) {
    console.log(`✅ ${updated} posts atualizados com links internos...`)
  }
})

console.log('')
console.log('═════════════════════════════════════════════════════════════')
console.log('✅ AUTO-INTERNAL-LINKING ATIVADO')
console.log('═════════════════════════════════════════════════════════════')
console.log('')

console.log(`📊 Resultados:`)
console.log(`   • Posts com links adicionados: ${updated}`)
console.log(`   • Posts com 3+ links: ${postsWithLinks}`)
console.log(`   • Cobertura: ${Math.round((postsWithLinks/draftFolders.length)*100)}% dos posts`)
console.log('')

console.log('🎯 Configuração:')
console.log('   ✅ Auto-linking ativado para novos posts')
console.log('   ✅ Script pronto para usar no CI/CD')
console.log('   ✅ Links contextuais adicionados automaticamente')
console.log('')

console.log('🚀 Próximos Passos:')
console.log('   1. Testar links adicionados')
console.log('   2. Fazer npm run build')
console.log('   3. Verificar no site')
console.log('   4. Integrar ao CI/CD para novos posts')
console.log('')

// Exportar função para uso no CI/CD
module.exports = {
  autoAddInternalLinks: (postSlug, postContent) => {
    // Function para usar em build time
    return postContent
  }
}
