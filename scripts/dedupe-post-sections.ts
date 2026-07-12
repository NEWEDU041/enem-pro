import * as fs from 'fs'
import * as path from 'path'

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

// Passo 1: remove blocos H2 inteiros (heading + tudo até o próximo H2, incluindo H3s
// aninhados) quando o mesmo bloco (normalizado) já apareceu antes no mesmo post.
function dedupeH2Blocks(content: string): { content: string; removed: number } {
  const lines = content.split('\n')
  const h2Idxs: number[] = []
  for (let i = 0; i < lines.length; i++) {
    if (/^## /.test(lines[i])) h2Idxs.push(i)
  }
  if (h2Idxs.length === 0) return { content, removed: 0 }

  const preamble = lines.slice(0, h2Idxs[0]).join('\n')
  const blocks: { heading: string; body: string; raw: string }[] = []
  for (let i = 0; i < h2Idxs.length; i++) {
    const start = h2Idxs[i]
    const end = i + 1 < h2Idxs.length ? h2Idxs[i + 1] : lines.length
    const heading = lines[start]
    const body = lines.slice(start + 1, end).join('\n')
    const raw = lines.slice(start, end).join('\n')
    blocks.push({ heading, body, raw })
  }

  // Compara apenas o CORPO (sem a linha do heading) — o mesmo bloco de conteúdo
  // frequentemente reaparece sob headings de texto diferente ("Pontos Mais
  // Importantes?", "Dicas Práticas?" etc), então comparar o bloco inteiro
  // (heading+corpo) nunca bateria como duplicata.
  const seen = new Set<string>()
  const kept: string[] = []
  let removed = 0
  for (const b of blocks) {
    const normBody = normalize(b.body)
    if (normBody.length > 80 && seen.has(normBody)) {
      removed++
      continue
    }
    if (normBody.length > 80) seen.add(normBody)
    kept.push(b.raw)
  }

  return { content: preamble + (kept.length ? '\n' + kept.join('\n') : ''), removed }
}

// Passo 2: remove qualquer heading (## ou ###) que não tenha nenhum conteúdo real
// antes do próximo heading de nível igual ou mais raso (aninhamento tipo H2->H3 normal
// é preservado, só orphaned headings são removidos).
function removeEmptyHeadings(content: string): { content: string; removed: number } {
  let lines = content.split('\n')
  let removed = 0
  let changed = true
  while (changed) {
    changed = false
    for (let i = 0; i < lines.length; i++) {
      const headingMatch = lines[i].match(/^(#{2,3}) /)
      if (!headingMatch) continue
      const depth = headingMatch[1].length
      let j = i + 1
      while (j < lines.length && lines[j].trim() === '') j++
      const nextMatch = j < lines.length ? lines[j].match(/^(#{2,3}) /) : null
      const isLastLine = j >= lines.length
      if (isLastLine || (nextMatch && nextMatch[1].length <= depth)) {
        lines.splice(i, 1)
        removed++
        changed = true
        break
      }
    }
  }
  return { content: lines.join('\n'), removed }
}

const dir = path.join(__dirname, '../.audit-extract')
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))

const report: { slug: string; removedDuplicateBlocks: number; removedEmptyHeadings: number }[] = []

for (const f of files) {
  const fullPath = path.join(dir, f)
  const raw = fs.readFileSync(fullPath, 'utf8').replace(/\r\n/g, '\n')
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/)
  if (!fmMatch) continue
  const [, frontmatter, content] = fmMatch

  const step1 = dedupeH2Blocks(content)
  const step2 = removeEmptyHeadings(step1.content)

  if (step1.removed > 0 || step2.removed > 0) {
    fs.writeFileSync(fullPath, `---\n${frontmatter}\n---\n\n${step2.content}`)
    report.push({ slug: f.replace(/\.md$/, ''), removedDuplicateBlocks: step1.removed, removedEmptyHeadings: step2.removed })
  }
}

report.sort((a, b) => (b.removedDuplicateBlocks + b.removedEmptyHeadings) - (a.removedDuplicateBlocks + a.removedEmptyHeadings))
console.log(`${report.length} posts modificados de ${files.length} totais`)
console.log(`Total de blocos H2 duplicados removidos: ${report.reduce((a, r) => a + r.removedDuplicateBlocks, 0)}`)
console.log(`Total de headings vazios removidos: ${report.reduce((a, r) => a + r.removedEmptyHeadings, 0)}`)
fs.writeFileSync(path.join(dir, '_dedupe-report.json'), JSON.stringify(report, null, 2))
