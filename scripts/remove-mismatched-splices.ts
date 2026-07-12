import * as fs from 'fs'
import * as path from 'path'

const stop = new Set(['de', 'da', 'do', 'no', 'na', 'em', 'o', 'a', 'os', 'as', 'para', 'com', 'e', 'que', 'como', 'enem', 'sobre', 'voce', 'você', 'precisa', 'saber'])

function tokenize(s: string): Set<string> {
  const norm = s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ')
  return new Set(norm.split(/\s+/).filter(w => w.length > 2 && !stop.has(w)))
}

const dir = path.join(__dirname, '../.audit-extract')
const index: { slug: string; title: string }[] = JSON.parse(fs.readFileSync(path.join(dir, '_index.json'), 'utf8'))
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))

const report: { slug: string; removedHeadings: string[] }[] = []

const splicePatterns = [
  /^## Estratégias Avançadas para (.+) no ENEM\??$/,
  /^## O que Voce Precisa Saber Sobre (.+)\??$/,
  /^## O que Você Precisa Saber Sobre (.+)\??$/,
]

for (const f of files) {
  const slug = f.replace(/\.md$/, '')
  const meta = index.find(p => p.slug === slug)
  if (!meta) continue
  const ownTokens = new Set([...tokenize(meta.title), ...tokenize(slug.replace(/-/g, ' '))])

  const fullPath = path.join(dir, f)
  const raw = fs.readFileSync(fullPath, 'utf8').replace(/\r\n/g, '\n')
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/)
  if (!fmMatch) continue
  const [, frontmatter, content] = fmMatch

  const lines = content.split('\n')
  const h2Idxs: number[] = []
  for (let i = 0; i < lines.length; i++) if (/^## /.test(lines[i])) h2Idxs.push(i)

  const toRemove: { start: number; end: number; heading: string }[] = []
  for (let i = 0; i < h2Idxs.length; i++) {
    const start = h2Idxs[i]
    const end = i + 1 < h2Idxs.length ? h2Idxs[i + 1] : lines.length
    const headingLine = lines[start]
    let topicMatch: string | null = null
    for (const pat of splicePatterns) {
      const m = headingLine.match(pat)
      if (m) { topicMatch = m[1]; break }
    }
    if (!topicMatch) continue
    const topicTokens = tokenize(topicMatch)
    const overlap = [...topicTokens].filter(t => ownTokens.has(t)).length
    if (overlap === 0 && topicTokens.size > 0) {
      toRemove.push({ start, end, heading: headingLine.trim() })
    }
  }

  if (toRemove.length > 0) {
    const removedHeadings = toRemove.map(r => r.heading)
    let newLines = [...lines]
    // remove de trás pra frente para não invalidar os índices
    for (const r of [...toRemove].reverse()) {
      newLines.splice(r.start, r.end - r.start)
    }
    const newContent = newLines.join('\n')
    fs.writeFileSync(fullPath, `---\n${frontmatter}\n---\n\n${newContent}`)
    report.push({ slug, removedHeadings })
  }
}

report.sort((a, b) => b.removedHeadings.length - a.removedHeadings.length)
console.log(`${report.length} posts modificados`)
console.log(`Total de seções incompatíveis removidas: ${report.reduce((a, r) => a + r.removedHeadings.length, 0)}`)
fs.writeFileSync(path.join(dir, '_splice-report.json'), JSON.stringify(report, null, 2))
for (const r of report.slice(0, 15)) console.log(r.slug, '->', r.removedHeadings)
