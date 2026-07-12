import * as fs from 'fs'
import * as path from 'path'

function parseFrontmatter(raw: string): { data: Record<string, string>; content: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return { data: {}, content: raw }
  const data: Record<string, string> = {}
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let val = line.slice(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    data[key] = val
  }
  return { data, content: m[2] }
}

// Uso: npx tsx scripts/sync-post-from-md.ts <slug-do-arquivo-md> [slug-publicado-se-diferente]
// Sobrescreve a entrada já existente em lib/blog-data.ts com o conteúdo atual do .md.
// Use depois de editar um post que já foi mesclado em sessão anterior (blog-data.ts
// não é re-lido do .md automaticamente após o merge inicial).
const fileSlug = process.argv[2]
const publishedSlug = process.argv[3] || fileSlug

if (!fileSlug) {
  console.error('Uso: npx tsx scripts/sync-post-from-md.ts <slug-do-arquivo-md> [slug-publicado-se-diferente]')
  process.exit(1)
}

const mdPath = path.join(__dirname, '../app/blog/posts', `${fileSlug}.md`)
const raw = fs.readFileSync(mdPath, 'utf8')
const { data, content } = parseFrontmatter(raw)
const escapedContent = content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
const readTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200))

const blogDataPath = path.join(__dirname, '../lib/blog-data.ts')
let blogData = fs.readFileSync(blogDataPath, 'utf8')

// (?:[^\`\\]|\\.)* evita truncar no primeiro backtick ESCAPADO dentro do conteúdo antigo
const entryRegex = new RegExp(`\\{\\s*slug:\\s*'${publishedSlug}'[^}]+content:\\s*\`(?:[^\`\\\\]|\\\\.)*\`[^}]*\\}`)
if (!entryRegex.test(blogData)) {
  console.error(`❌ Entrada não encontrada em blog-data.ts para slug: ${publishedSlug}`)
  process.exit(1)
}

const replacement = `{ slug: '${publishedSlug}', title: ${JSON.stringify(data.title)}, description: ${JSON.stringify(data.description)}, date: '${data.date}', readTime: ${readTime}, content: \`${escapedContent}\` }`

// função como 2º argumento evita que replace() reinterprete "$1", "$4" etc. dentro do
// próprio conteúdo (ex: preço "R\$4,90") como referência de grupo capturado
blogData = blogData.replace(entryRegex, () => replacement)
fs.writeFileSync(blogDataPath, blogData)
console.log(`✅ Post '${publishedSlug}' atualizado com o conteúdo de app/blog/posts/${fileSlug}.md`)
