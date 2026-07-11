import * as fs from 'fs'
import * as path from 'path'

interface Issue {
  file: string
  problem: string
}

const FABRICATION_PATTERNS: RegExp[] = [
  /segundo (dados|registros|pesquisas|histórico|educadores|historiografia)/i,
  /\(frequência[^)]*\)/i,
  /\d+-?\d* questões por prova/i,
  /das 45 questões/i,
  /\(\s*(inep|enem pro)\s*,?\s*análise[^)]*\)/i,
  /\(\s*[\w .]+,\s*20(2[0-5])\s*\)/, // citação vaga tipo "(Nome, 2023)" sem título de artigo/journal
]

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /\[ORIGINAL DATA\]/,
  /\[PERSONAL EXPERIENCE\]/,
  /\[UNIQUE INSIGHT\]/,
  /\[INTERNAL-LINK/,
  /\[IMAGE/,
  /\[CHART/,
  /CITATION CAPSULE/,
  /\d+ chars\.?\s*$/m,
]

function checkFile(filePath: string): Issue[] {
  const issues: Issue[] = []
  const raw = fs.readFileSync(filePath, 'utf8')
  const file = path.basename(filePath)

  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!fmMatch) {
    issues.push({ file, problem: 'Sem frontmatter YAML' })
    return issues
  }
  const [, frontmatter, body] = fmMatch

  const descMatch = frontmatter.match(/description:\s*"(.*)"/)
  if (!descMatch || descMatch[1].trim().length < 50) {
    issues.push({ file, problem: 'description ausente ou curta demais (<50 chars)' })
  }

  const titleMatch = frontmatter.match(/title:\s*"(.*)"/)
  if (!titleMatch || titleMatch[1].trim().length === 0) {
    issues.push({ file, problem: 'title ausente' })
  }

  if (!/\*\*Key Takeaways\*\*|## Key Takeaways/.test(body)) {
    issues.push({ file, problem: 'Sem seção Key Takeaways' })
  } else {
    const ktMatch = body.match(/(\*\*Key Takeaways\*\*|## Key Takeaways)([\s\S]*?)(\n##|\n---|$)/)
    if (ktMatch && !/[-•]/.test(ktMatch[2])) {
      issues.push({ file, problem: 'Key Takeaways vazio (sem bullets)' })
    }
  }

  if (!/## FAQ/i.test(body)) {
    issues.push({ file, problem: 'Sem seção FAQ' })
  }

  // heading imediatamente seguido de heading do MESMO nível ou mais raso = seção vazia
  // (heading seguido de subseção mais profunda, ex: H2 -> H3, é aninhamento normal, não bug)
  const lines = body.split('\n')
  for (let i = 0; i < lines.length - 1; i++) {
    const headingMatch = lines[i].match(/^(#+) /)
    if (headingMatch) {
      const depth = headingMatch[1].length
      let j = i + 1
      while (j < lines.length && lines[j].trim() === '') j++
      if (j < lines.length) {
        const nextMatch = lines[j].match(/^(#+) /)
        if (nextMatch && nextMatch[1].length <= depth) {
          issues.push({ file, problem: `Seção vazia: "${lines[i].trim()}"` })
        }
      }
    }
  }

  for (const pattern of FABRICATION_PATTERNS) {
    const m = body.match(pattern)
    if (m) issues.push({ file, problem: `Possível estatística/citação fabricada: "${m[0]}"` })
  }

  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(raw)) issues.push({ file, problem: `Placeholder/artefato de rascunho não resolvido: ${pattern}` })
  }

  return issues
}

function main() {
  const target = process.argv[2]
  const files: string[] = []

  if (target) {
    if (fs.statSync(target).isDirectory()) {
      for (const f of fs.readdirSync(target)) {
        if (f.endsWith('.md')) files.push(path.join(target, f))
      }
    } else {
      files.push(target)
    }
  } else {
    const dir = path.join(__dirname, '../app/blog/posts')
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.md')) files.push(path.join(dir, f))
    }
  }

  let totalIssues = 0
  for (const f of files) {
    const issues = checkFile(f)
    if (issues.length > 0) {
      totalIssues += issues.length
      console.log(`\n❌ ${path.basename(f)}`)
      for (const issue of issues) console.log(`   - ${issue.problem}`)
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`${files.length} arquivos checados, ${totalIssues} problemas encontrados`)
  if (totalIssues > 0) process.exit(1)
}

main()
