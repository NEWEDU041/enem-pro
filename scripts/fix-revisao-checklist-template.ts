import * as fs from 'fs'
import * as path from 'path'

function extractTopic(title: string): string {
  let t = title.split(/\s+(?:no ENEM|na ENEM|do ENEM|para o ENEM)\b/i)[0]
  t = t.split(/\s+ENEM\b/i)[0]
  t = t.split(/\s+—\s+/)[0]
  t = t.split(/:\s+/)[0]
  return t.trim()
}

const dir = path.join(__dirname, '../.audit-extract')
const index: { slug: string; title: string }[] = JSON.parse(fs.readFileSync(path.join(dir, '_index.json'), 'utf8'))
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))

const report: { slug: string; removedDuplicateInstances: number; fixedTopicRefs: number }[] = []

for (const f of files) {
  const slug = f.replace(/\.md$/, '')
  const meta = index.find(p => p.slug === slug)
  if (!meta) continue
  const topic = extractTopic(meta.title)

  const fullPath = path.join(dir, f)
  const raw = fs.readFileSync(fullPath, 'utf8').replace(/\r\n/g, '\n')
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/)
  if (!fmMatch) continue
  const [, frontmatter, content] = fmMatch

  const lines = content.split('\n')
  const revisaoIdxs: number[] = []
  for (let i = 0; i < lines.length; i++) {
    if (/^## Revisao Rapida: Pontos-Chave para Fixar\??$/.test(lines[i])) revisaoIdxs.push(i)
  }
  if (revisaoIdxs.length === 0) continue

  // um bloco "Revisao Rapida" vai até o próximo H2 (## ) que não seja o próprio
  // "### Checklist de Preparacao Final" (que é filho dele, nível 3)
  const h2Idxs: number[] = []
  for (let i = 0; i < lines.length; i++) if (/^## /.test(lines[i])) h2Idxs.push(i)

  const blockRanges = revisaoIdxs.map(start => {
    const nextH2 = h2Idxs.find(idx => idx > start)
    return { start, end: nextH2 !== undefined ? nextH2 : lines.length }
  })

  let removedDuplicateInstances = 0
  let newLines = [...lines]

  if (blockRanges.length > 1) {
    // remove todas as instâncias exceto a primeira, de trás pra frente
    for (let i = blockRanges.length - 1; i >= 1; i--) {
      const { start, end } = blockRanges[i]
      newLines.splice(start, end - start)
      removedDuplicateInstances++
    }
  }

  // corrige as referências de tópico errado na instância que sobrou
  const rebuilt = newLines.join('\n')
  const patterns: [RegExp, string][] = [
    [/Aplicar o conteudo de [^\n]+? em contextos ineditos/g, `Aplicar o conteudo de ${topic} em contextos ineditos`],
    [/Revisei os conceitos fundamentais de [^\n]+/g, `Revisei os conceitos fundamentais de ${topic}`],
    [/Pratique questoes mistas que combinam [^\n]+? com interpretacao de texto/g, `Pratique questoes mistas que combinam ${topic} com interpretacao de texto`],
  ]
  let fixedTopicRefs = 0
  let finalContent = rebuilt
  for (const [pat, replacement] of patterns) {
    const matches = finalContent.match(pat)
    if (matches) {
      fixedTopicRefs += matches.length
      finalContent = finalContent.replace(pat, replacement)
    }
  }

  if (removedDuplicateInstances > 0 || fixedTopicRefs > 0) {
    fs.writeFileSync(fullPath, `---\n${frontmatter}\n---\n\n${finalContent}`)
    report.push({ slug, removedDuplicateInstances, fixedTopicRefs })
  }
}

report.sort((a, b) => (b.removedDuplicateInstances + b.fixedTopicRefs) - (a.removedDuplicateInstances + a.fixedTopicRefs))
console.log(`${report.length} posts modificados`)
console.log(`Instâncias duplicadas do template removidas: ${report.reduce((a, r) => a + r.removedDuplicateInstances, 0)}`)
console.log(`Referências de tópico corrigidas: ${report.reduce((a, r) => a + r.fixedTopicRefs, 0)}`)
fs.writeFileSync(path.join(dir, '_revisao-fix-report.json'), JSON.stringify(report, null, 2))
