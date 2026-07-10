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

const slugs = [
  'adaptacoes-prova-deficiente-enem',
  'ansiedade-enem-gestao-emocional',
  'controle-ansiedade-dia-prova',
  'cronograma-trabalhador-enem',
  'deficiente-enem-direitos-recursos',
  'estudo-eficiente-pouco-tempo',
  'gestao-tempo-prova-enem',
  'perfil-candidato-aprovado-enem',
  'problemas-cotidiano-enem',
  'questoes-contextualizadas-enem',
  'recursos-acessiveis-deficiente-enem',
  'tecnicas-respiracao-ansiedade-enem',
  'trabalhador-enem-estudar-trabalhando',
]

const postsDir = path.join(__dirname, '../app/blog/posts')
const blogDataPath = path.join(__dirname, '../lib/blog-data.ts')

const entries = slugs.map(slug => {
  const raw = fs.readFileSync(path.join(postsDir, `${slug}.md`), 'utf8')
  const { data, content } = parseFrontmatter(raw)
  const escapedContent = content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
  const readTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200))
  return `  { slug: '${slug}', title: ${JSON.stringify(data.title)}, description: ${JSON.stringify(data.description)}, date: '${data.date}', readTime: ${readTime}, content: \`${escapedContent}\` },`
})

const block = `const EXTRA_POSTS_19: BlogPost[] = [\n${entries.join('\n')}\n]\n\n`

let blogData = fs.readFileSync(blogDataPath, 'utf8')

const anchor = 'const ALL_POSTS = ['
if (!blogData.includes(anchor)) {
  console.error('❌ ALL_POSTS anchor não encontrado')
  process.exit(1)
}
if (blogData.includes('EXTRA_POSTS_19')) {
  console.error('❌ EXTRA_POSTS_19 já existe — abortando para evitar duplicata')
  process.exit(1)
}

blogData = blogData.replace(anchor, `${block}${anchor}`)
blogData = blogData.replace(
  '...EXTRA_POSTS_18]',
  '...EXTRA_POSTS_18, ...EXTRA_POSTS_19]'
)

fs.writeFileSync(blogDataPath, blogData)
console.log(`✅ ${slugs.length} posts mesclados em EXTRA_POSTS_19`)
