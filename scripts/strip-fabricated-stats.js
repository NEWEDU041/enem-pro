/**
 * Remove marcadores de placeholder não resolvidos + citações fabricadas
 * dos 60 posts gerados na Semana 2. NÃO mescla em blog-data.ts — só limpa
 * os .md brutos e gera relatório do que ainda precisa revisão humana
 * (números específicos que sobraram sem fonte, prontos pra reescrever
 * qualitativamente).
 */
const fs = require('fs')
const path = require('path')

function listMd(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(dir, f))
}

const files = [
  ...listMd('blog-posts'),
  ...listMd('posts-estudo'),
  ...listMd('app/blog/posts'),
  '15-disciplinas-enem-publicavel.md',
  'blog-posts-disciplinas-15.md',
].filter(f => fs.existsSync(f))

let totalCitationsRemoved = 0
let totalMarkersRemoved = 0
const reviewReport = []

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content
  let citationsInFile = 0
  let markersInFile = 0

  // 1. Remove blocos "Citation Capsule" inteiros (linha de blockquote completa)
  content = content.replace(/^>\s*\*\*Citation Capsule:?\*\*.*$/gim, m => {
    markersInFile++
    return ''
  })

  // 2. Remove marcadores de placeholder não resolvidos (com o texto colado neles)
  content = content.replace(/\[INTERNAL-LINK:[^\]]*\]/g, () => { markersInFile++; return '' })
  content = content.replace(/\[IMAGE:[^\]]*\]/g, () => { markersInFile++; return '' })
  content = content.replace(/\[CHART:[^\]]*\]/g, () => { markersInFile++; return '' })

  // 3. Remove sentenças inteiras marcadas como [PERSONAL EXPERIENCE] ou [ORIGINAL DATA]
  //    (são dados inventados por definição — não têm base real, remove a linha toda)
  content = content.replace(/^\[PERSONAL EXPERIENCE\]:?.*$/gim, () => { markersInFile++; return '' })
  content = content.replace(/^\[ORIGINAL DATA\]:?.*$/gim, () => { markersInFile++; return '' })

  // 4. Remove citações fabricadas: "(Nome/Instituição, Ano)" e "([Nome](url), Ano)"
  //    Captura o trecho antes pra registrar no relatório de revisão.
  const citationPattern = /\(\[?[A-ZÀ-Ú][\wà-úÀ-Ú\s.]{1,50}\]?(?:\([^)]*\))?,?\s*\d{4}\)/g
  content = content.replace(citationPattern, (match, offset) => {
    citationsInFile++
    return ''
  })

  // 5. Limpa espaços duplos / linhas vazias sobrando após remoção
  content = content.replace(/[ \t]+([.,;])/g, '$1') // espaço antes de pontuação
  content = content.replace(/\n{3,}/g, '\n\n')
  content = content.replace(/[ \t]{2,}/g, ' ')

  if (content !== original) {
    fs.writeFileSync(file, content)
  }

  totalCitationsRemoved += citationsInFile
  totalMarkersRemoved += markersInFile

  // 6. Detecta números que sobraram sem fonte — candidatos a reescrita qualitativa
  const suspiciousNumbers = [...content.matchAll(/(?:[^.\n]*?\b\d{1,3}(?:[.,]\d+)?%[^.\n]*\.)/g)]
    .map(m => m[0].trim())
    .filter(s => s.length > 10)

  if (citationsInFile > 0 || markersInFile > 0 || suspiciousNumbers.length > 0) {
    reviewReport.push({
      file,
      citationsRemoved: citationsInFile,
      markersRemoved: markersInFile,
      numbersNeedingReview: suspiciousNumbers,
    })
  }
}

console.log(`\n✅ Processados: ${files.length} arquivos`)
console.log(`🗑️  Citações fabricadas removidas: ${totalCitationsRemoved}`)
console.log(`🗑️  Marcadores de placeholder removidos: ${totalMarkersRemoved}`)
console.log(`⚠️  Arquivos com números ainda precisando revisão qualitativa: ${reviewReport.filter(r => r.numbersNeedingReview.length > 0).length}`)

fs.writeFileSync('scripts/strip-report.json', JSON.stringify(reviewReport, null, 2))
console.log(`\n📄 Relatório completo: scripts/strip-report.json`)
