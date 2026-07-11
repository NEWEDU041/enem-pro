import * as fs from 'fs'
import * as path from 'path'

interface Post {
  slug: string
  title: string
  description: string
  date: string
  content: string
}

const blogDataPath = path.join(__dirname, '../lib/blog-data.ts')
const raw = fs.readFileSync(blogDataPath, 'utf8')

// Cada entrada segue o padrão: { slug: '...', title: "...", description: "...", date: '...', readTime: N, content: `...` }
const entryRegex = /\{\s*slug:\s*'([^']+)',\s*title:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'),\s*description:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'),\s*date:\s*'([^']+)',\s*readTime:\s*\d+,\s*content:\s*`([\s\S]*?)`\s*,?\s*\}/g

const posts: Post[] = []
let m: RegExpExecArray | null
while ((m = entryRegex.exec(raw)) !== null) {
  const [, slug, titleRaw, descRaw, date, contentRaw] = m
  let title = ''
  let description = ''
  try {
    title = JSON.parse(titleRaw.replace(/^'/, '"').replace(/'$/, '"'))
  } catch {
    title = titleRaw.slice(1, -1)
  }
  try {
    description = JSON.parse(descRaw.replace(/^'/, '"').replace(/'$/, '"'))
  } catch {
    description = descRaw.slice(1, -1)
  }
  const content = contentRaw.replace(/\\`/g, '`').replace(/\\\$/g, '$').replace(/\\\\/g, '\\')
  posts.push({ slug, title, description, date, content })
}

console.log(`Extraídos ${posts.length} posts de blog-data.ts`)

const outDir = path.join(__dirname, '../.audit-extract')
if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true })
fs.mkdirSync(outDir)

for (const p of posts) {
  const fm = `---\ntitle: ${JSON.stringify(p.title)}\ndescription: ${JSON.stringify(p.description)}\ndate: "${p.date}"\n---\n\n`
  fs.writeFileSync(path.join(outDir, `${p.slug}.md`), fm + p.content)
}

fs.writeFileSync(path.join(outDir, '_index.json'), JSON.stringify(posts.map(p => ({ slug: p.slug, title: p.title, description: p.description, date: p.date })), null, 2))

console.log(`Escrito em ${outDir}`)
