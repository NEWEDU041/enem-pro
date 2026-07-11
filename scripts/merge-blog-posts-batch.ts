import * as fs from 'fs'
import * as path from 'path'

interface FileEntry {
  file: string
  slug: string
  date: string
}

// 'como-se-inscrever-enem-2026' deliberately excluded: slug já existe em EXTRA_POSTS
// (duplicação semântica com post publicado — evitar canibalização de keyword)
const files: FileEntry[] = [
  { file: '01-cronograma-oficial-enem-2026.md', slug: 'cronograma-oficial-enem-2026', date: '2026-07-11' },
  { file: '03-taxa-inscricao-enem-2026.md', slug: 'taxa-inscricao-enem-2026', date: '2026-07-11' },
  { file: '04-quando-sai-resultado-enem-2026.md', slug: 'quando-sai-resultado-enem-2026', date: '2026-07-11' },
  { file: '05-melhores-recursos-estudar-enem.md', slug: 'melhores-recursos-estudar-enem', date: '2026-07-11' },
  { file: '06-dia-enem-dicas-preparacao.md', slug: 'dia-enem-dicas-preparacao', date: '2026-07-11' },
  { file: '07-usar-nota-enem-universidade.md', slug: 'usar-nota-enem-universidade', date: '2026-07-11' },
  { file: '08-erros-comuns-inscricao-enem.md', slug: 'erros-comuns-inscricao-enem', date: '2026-07-11' },
  { file: '09-prazos-enem-nao-perca-datas.md', slug: 'prazos-enem-nao-perca-datas', date: '2026-07-11' },
  { file: '10-novo-enem-2024-formato.md', slug: 'novo-enem-2024-formato', date: '2026-07-11' },
]

const postsDir = path.join(__dirname, '../blog-posts')
const blogDataPath = path.join(__dirname, '../lib/blog-data.ts')

function parsePost(raw: string): { title: string; description: string; content: string } {
  const lines = raw.split('\n')
  if (!lines[0].startsWith('# ')) throw new Error('H1 título não encontrado na primeira linha')
  const title = lines[0].slice(2).trim()

  const descMatch = raw.match(/\*\*Meta Description:\*\*\s*(.+)/)
  if (!descMatch) throw new Error('Meta Description não encontrada')
  const description = descMatch[1].trim()

  // Conteúdo começa no primeiro "---" após a meta description, até "**Autor:**" (rodapé interno, não é conteúdo de leitor)
  const afterTitle = raw.slice(raw.indexOf(descMatch[0]) + descMatch[0].length)
  const bodyStart = afterTitle.indexOf('---')
  if (bodyStart === -1) throw new Error('Separador --- não encontrado após meta description')
  let body = afterTitle.slice(bodyStart + 3)

  const authorIdx = body.indexOf('**Autor:**')
  if (authorIdx !== -1) body = body.slice(0, authorIdx)

  body = body.trim()
  return { title, description, content: `# ${title}\n\n${body}` }
}

const entries = files.map(({ file, slug, date }) => {
  const raw = fs.readFileSync(path.join(postsDir, file), 'utf8')
  const { title, description, content } = parsePost(raw)
  const escapedContent = content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
  const readTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200))
  return `  { slug: '${slug}', title: ${JSON.stringify(title)}, description: ${JSON.stringify(description)}, date: '${date}', readTime: ${readTime}, content: \`${escapedContent}\` },`
})

const block = `const EXTRA_POSTS_20: BlogPost[] = [\n${entries.join('\n')}\n]\n\n`

let blogData = fs.readFileSync(blogDataPath, 'utf8')

const anchor = 'const ALL_POSTS = ['
if (!blogData.includes(anchor)) {
  console.error('❌ ALL_POSTS anchor não encontrado')
  process.exit(1)
}
if (blogData.includes('EXTRA_POSTS_20')) {
  console.error('❌ EXTRA_POSTS_20 já existe — abortando para evitar duplicata')
  process.exit(1)
}

blogData = blogData.replace(anchor, `${block}${anchor}`)
blogData = blogData.replace(
  '...EXTRA_POSTS_18, ...EXTRA_POSTS_19]',
  '...EXTRA_POSTS_18, ...EXTRA_POSTS_19, ...EXTRA_POSTS_20]'
)

fs.writeFileSync(blogDataPath, blogData)
console.log(`✅ ${files.length} posts mesclados em EXTRA_POSTS_20`)
