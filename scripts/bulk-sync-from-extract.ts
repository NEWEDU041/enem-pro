import * as fs from 'fs'
import * as path from 'path'

const extractDir = path.join(__dirname, '../.audit-extract')
function loadReport(name: string): { slug: string }[] {
  const p = path.join(extractDir, name)
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : []
}
const allReports = [
  ...loadReport('_dedupe-report.json'),
  ...loadReport('_splice-report.json'),
  ...loadReport('_revisao-fix-report.json'),
]
const affectedSlugs = [...new Set(allReports.map(r => r.slug))]
const report = affectedSlugs.map(slug => ({ slug }))

const blogDataPath = path.join(__dirname, '../lib/blog-data.ts')
let blogData = fs.readFileSync(blogDataPath, 'utf8')

const postsDir = path.join(__dirname, '../app/blog/posts')

let updatedInBlogData = 0
let updatedMdFiles = 0
let notFoundInBlogData: string[] = []

for (const { slug } of report) {
  const mdPath = path.join(extractDir, `${slug}.md`)
  const raw = fs.readFileSync(mdPath, 'utf8').replace(/\r\n/g, '\n')
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/)
  if (!fmMatch) continue
  const [, , content] = fmMatch
  const escapedContent = content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')

  // [^\`]* pararia no primeiro backtick ESCAPADO dentro do conteúdo antigo, truncando o
  // match e corrompendo a entrada (bug já visto em audit-extract-all-posts.ts) — por isso
  // usa (?:[^\`\\]|\\.)* pra tratar \` e \\ como um único "token" ao varrer o conteúdo.
  const entryRegex = new RegExp(`(\\{\\s*slug:\\s*'${slug}',[^}]*content:\\s*\`)(?:[^\`\\\\]|\\\\.)*(\`[^}]*\\})`)
  if (entryRegex.test(blogData)) {
    // usar uma FUNÇÃO como segundo argumento de replace() é obrigatório aqui — com uma
    // string, o replace() reinterpreta sequências "$1", "$4" etc. dentro do próprio
    // conteúdo (ex: preço "R\$4,90/mês") como referências de grupo capturado, duplicando
    // texto do match original. Uma função devolve o valor literal, sem essa reinterpretação.
    blogData = blogData.replace(entryRegex, (_match, g1: string, g2: string) => g1 + escapedContent + g2)
    updatedInBlogData++
  } else {
    notFoundInBlogData.push(slug)
  }

  const physicalMdPath = path.join(postsDir, `${slug}.md`)
  if (fs.existsSync(physicalMdPath)) {
    const physicalRaw = fs.readFileSync(physicalMdPath, 'utf8')
    const physicalFm = physicalRaw.match(/^---\n[\s\S]*?\n---\n/)
    if (physicalFm) {
      fs.writeFileSync(physicalMdPath, physicalFm[0] + '\n' + content.trim() + '\n')
      updatedMdFiles++
    }
  }
}

fs.writeFileSync(blogDataPath, blogData)
console.log(`✅ ${updatedInBlogData} entradas atualizadas em blog-data.ts`)
console.log(`✅ ${updatedMdFiles} arquivos físicos sincronizados em app/blog/posts/`)
if (notFoundInBlogData.length) {
  console.log(`⚠️  ${notFoundInBlogData.length} slugs não encontrados em blog-data.ts:`, notFoundInBlogData)
}
