/**
 * Etapa 2: remove as 487 sentenças com números fabricados que sobraram
 * após a Etapa 1 (remoção de citações). Trabalha sentença-por-sentença
 * (não parágrafo inteiro) pra preservar o máximo de conteúdo real.
 *
 * Regra: qualquer sentença com %, "aproximadamente N mil/milhão",
 * "N pontos/pessoas" em contexto de comportamento de candidato é tratada
 * como estatística inventada e REMOVIDA (não reescrita) — mais seguro
 * que tentar reescrever texto gramaticalmente sem checagem humana.
 */
const fs = require('fs')
const path = require('path')

function listMd(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).map(f => path.join(dir, f))
}

const files = [
  ...listMd('blog-posts'),
  ...listMd('posts-estudo'),
  ...listMd('app/blog/posts'),
  '15-disciplinas-enem-publicavel.md',
  'blog-posts-disciplinas-15.md',
].filter(f => fs.existsSync(f))

// Padrões que indicam estatística fabricada (não estrutural/factual)
const FABRICATED_STAT_SRC = '(\\b\\d{1,3}(?:[.,]\\d+)?\\s?%|\\baproximadamente\\s+\\d[\\d.,]*\\s?(mil|milh[ãa]o|milh[õo]es)\\b|\\b\\d[\\d.,]*\\s?(mil|milh[ãa]o|milh[õo]es)\\s+de\\s+candidatos\\b)'
const FABRICATED_STAT = new RegExp(FABRICATED_STAT_SRC, 'i')
const FABRICATED_STAT_G = new RegExp(FABRICATED_STAT_SRC, 'gi')

// Fatos estruturais reais que NÃO devem ser removidos mesmo contendo números
const SAFE_PATTERNS = [
  /nota\s+(m[íi]nima|de corte)/i,
  /450\s*pontos/i, // nota mínima ProUni/Fies, valor real conhecido
  /1,5\s*sal[áa]rio/i, // regra real de isenção
  /10\s*anos/i, // validade real da nota
  /dois\s+domingos/i,
  /60\s*dias/i, // prazo estrutural real
  /15\s*dias/i,
  /5\s*horas/i, // duração da prova, real
]

let totalRemoved = 0
let filesChanged = 0
const stillFlagged = []

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content
  let removedInFile = 0

  const lines = content.split('\n')
  const newLines = lines.map(line => {
    // Bullet ou blockquote inteiro: se contém stat fabricada e não é padrão seguro, remove a linha toda
    const isListItem = /^\s*[-*>]\s/.test(line)

    if (isListItem) {
      if (FABRICATED_STAT.test(line) && !SAFE_PATTERNS.some(p => p.test(line))) {
        removedInFile++
        return null
      }
      return line
    }

    // Parágrafo normal: quebra em sentenças e remove só as fabricadas
    if (!FABRICATED_STAT.test(line)) return line

    const sentences = line.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú])/)
    const kept = sentences.filter(s => {
      if (!FABRICATED_STAT.test(s)) return true
      if (SAFE_PATTERNS.some(p => p.test(s))) return true
      removedInFile++
      return false
    })
    return kept.join(' ').trim()
  }).filter(l => l !== null)

  content = newLines.join('\n')
  content = content.replace(/\n{3,}/g, '\n\n')
  content = content.replace(/[ \t]{2,}/g, ' ')

  if (content !== original) {
    fs.writeFileSync(file, content)
    filesChanged++
  }
  totalRemoved += removedInFile

  // Segunda checagem: sobrou alguma stat fabricada não coberta pelas regras?
  const stillHas = [...content.matchAll(FABRICATED_STAT_G)]
  if (stillHas.length > 0) {
    stillFlagged.push({ file, remaining: stillHas.length })
  }
}

console.log(`\n✅ Arquivos alterados: ${filesChanged}/${files.length}`)
console.log(`🗑️  Sentenças/itens com estatística fabricada removidos: ${totalRemoved}`)
console.log(`⚠️  Arquivos com possíveis stats remanescentes (revisar manualmente): ${stillFlagged.length}`)
stillFlagged.forEach(f => console.log(`   - ${f.file}: ${f.remaining}`))

fs.writeFileSync('scripts/strip-report-2.json', JSON.stringify(stillFlagged, null, 2))
