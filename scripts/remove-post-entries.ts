import * as fs from 'fs'
import * as path from 'path'

const slugsToRemove = [
  'quando-sai-resultado-enem',
  'enem-resultado-quando-sai-2026',
  'nota-de-corte-engenharia-enem',
  'direito-nota-de-corte-enem',
  'enem-treineiro-2026',
]

const blogDataPath = path.join(__dirname, '../lib/blog-data.ts')
let blogData = fs.readFileSync(blogDataPath, 'utf8')

let removed = 0
for (const slug of slugsToRemove) {
  const entryRegex = new RegExp(`\\s*\\{\\s*slug:\\s*'${slug}',[^}]*content:\\s*\`(?:[^\`\\\\]|\\\\.)*\`\\s*,?\\s*\\}\\s*,?`)
  if (entryRegex.test(blogData)) {
    blogData = blogData.replace(entryRegex, '')
    removed++
    console.log(`✅ removido: ${slug}`)
  } else {
    console.log(`⚠️  não encontrado: ${slug}`)
  }
}

fs.writeFileSync(blogDataPath, blogData)
console.log(`\nTotal removido: ${removed}/${slugsToRemove.length}`)
