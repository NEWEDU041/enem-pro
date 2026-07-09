/**
 * Remove seções "## Referências" com bibliografia não verificável
 * (citações a "ENEM Pro. Observação Interna", "Harvard Medical School...",
 * "Yale Psychology Lab...", "Nature..." sem paper/autor real específico).
 * Mistura fontes reais (INEP, leis) com fabricadas no mesmo bloco — mais
 * seguro remover a seção inteira do que tentar filtrar item por item.
 */
const fs = require('fs')
const path = require('path')

function listMd(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).map(f => path.join(dir, f))
}

const files = [
  ...listMd('blog-posts'),
  ...listMd('posts-estudo'),
  ...listMd('app/blog/posts'),
  '15-disciplinas-enem-publicavel.md',
  'blog-posts-disciplinas-15.md',
].filter(f => fs.existsSync(f))

let changed = 0
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content

  // Remove do heading "## Referências" até o próximo "---" ou fim do arquivo
  content = content.replace(/\n## Referências\n[\s\S]*?(?=\n---|\n## |$)/g, '')
  content = content.replace(/\n{3,}/g, '\n\n')

  if (content !== original) {
    fs.writeFileSync(file, content)
    changed++
    console.log('limpo:', file)
  }
}
console.log(`\n✅ ${changed} arquivos com Referências removidas`)
