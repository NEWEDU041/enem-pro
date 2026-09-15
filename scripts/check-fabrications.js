#!/usr/bin/env node
/**
 * check-fabrications.js
 * Falha (exit 1) se algum post contiver linguagem de dados fabricados —
 * estatísticas/estudos inventados atribuídos ao próprio site ("nossa plataforma
 * identificou que candidatos que... têm evolução média de X pontos").
 *
 * Fonte: lib/blog-data.ts (conteúdo que vai pra produção). Roda no CI sem drafts.
 */
const fs = require('fs')
const path = require('path')

const BLOG_DATA = path.join(__dirname, '../lib/blog-data.ts')

const PATTERNS = [
  /nossa\s+(plataforma|equipe|base de dados)\s+(identificou|analisou|mediu|testou|avaliou|revelou|mostrou|comprovou)/i,
  /(em|na)\s+nossa\s+plataforma[, ]+(identificamos|analisamos|medimos|observamos|vemos)/i,
  /identificamos\s+em\s+nossa\s+plataforma/i,
  /nossa\s+(experiência|análise|pesquisa)\s+(mostra|revela|comprova|indica)\s+que\s+candidatos/i,
  /nossos\s+dados\s+(mostram|indicam|revelam|apontam)/i,
  /segundo\s+nossos\s+dados\b/i,
  /com\s+base\s+(nas|nos)\s+(dúvidas|dados)\s+.{0,30}registrad[ao]s\s+em\s+nossa\s+plataforma/i,
  /analisamos\s+o\s+comportamento\s+de\s+estudo\s+de\s+(milhares|centenas|dezenas)/i,
  /candidatos\s+que\s+(completam|resolvem|fazem)[^.]{0,60}t[eê]m\s+(evolução|desempenho|ganho|aumento)\s+(médi[ao])\s+de\s+\d+\s*pontos/i,
  /registramos\s+um\s+(aumento|ganho)\s+de\s+\d+/i,
  /segundo\s+estudo\s+d[aeo]\s+(USP|Unicamp|UFRJ|UFMG|Harvard|Stanford|Cambridge)[^.]{0,15}20\d\d/i,
]

const src = fs.readFileSync(BLOG_DATA, 'utf-8')

// separa em objetos por "slug:" para reportar por post
const slugRe = /slug:\s*["']([^"']+)["']/g
const marks = []
let m
while ((m = slugRe.exec(src))) marks.push({ i: m.index, slug: m[1] })

const hits = []
for (const p of PATTERNS) {
  let mm
  const re = new RegExp(p.source, p.flags.includes('g') ? p.flags : p.flags + 'g')
  while ((mm = re.exec(src))) {
    let slug = '(desconhecido)'
    for (const mk of marks) { if (mk.i < mm.index) slug = mk.slug; else break }
    hits.push({ slug, text: mm[0].slice(0, 120) })
  }
}

if (hits.length === 0) {
  console.log('✅ Nenhuma frase de fabricação encontrada.')
  process.exit(0)
}

console.error(`❌ ${hits.length} trecho(s) de fabricação encontrado(s):\n`)
for (const h of hits) console.error(`   • [${h.slug}] "${h.text}…"`)
console.error('\nReescreva sem inventar estatísticas atribuídas ao site. Use fontes oficiais (INEP/MEC) ou remova o número.')
process.exit(1)
