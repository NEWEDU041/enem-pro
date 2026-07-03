import * as fs from 'fs'
import * as path from 'path'

const POSTS_DIR = path.join(process.cwd(), 'app/blog/posts')
const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))

// Current slugs from EXTRA_POSTS_18 (entries with empty content)
const SLUGS = [
  'como-passar-em-medicina-federal-no-enem',
  'questoes-biologia-que-mais-caem-enem',
  'dicas-melhorar-redacao-enem-score',
  'como-calcular-nota-enem-formula-tri',
  'questoes-historia-que-mais-caem',
  'preparacao-segunda-aplicacao-enem-2026',
  'cronograma-3-meses-estudos-enem',
  'como-resolver-questoes-fisica-cinematica',
  'nota-corte-medicina-federal-2025',
  'simulado-enem-online-completo-gratis',
]

// Map slug -> file
function findFile(slug: string): string | undefined {
  // exact match
  const exact = files.find(f => f.replace(/\.md$/, '') === slug)
  if (exact) return exact
  // file contains slug
  return files.find(f => slug.includes(f.replace(/\.md$/, '')) || f.replace(/\.md$/, '').includes(slug))
}

for (const slug of SLUGS) {
  const fileName = findFile(slug)
  if (!fileName) {
    console.error(`// No file found for slug: ${slug}`)
    continue
  }

  const raw = fs.readFileSync(path.join(POSTS_DIR, fileName), 'utf-8')
  const frontmatter = raw.match(/^---\n([\s\S]*?)\n---\n/)?.[1] || ''
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '').trim()

  const getMeta = (key: string): string => {
    const m = frontmatter.match(new RegExp(`^${key}:\\s*"(.+)"`, 'm'))
    return m ? m[1] : ''
  }

  const title = getMeta('title') || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const description = getMeta('description') || ''
  const date = getMeta('date') || '2026-06-29'
  const words = body.split(/\s+/).length
  const readTime = Math.max(1, Math.ceil(words / 200))
  const escaped = body.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${')

  console.log(`{ slug: '${slug}', title: ${JSON.stringify(title)}, description: ${JSON.stringify(description)}, date: '${date}', readTime: ${readTime}, content: \`${escaped}\` },`)
}
