import * as fs from 'fs'
import * as path from 'path'

const slugMap: Record<string, string> = {
  'ANÁLISE COMBINATÓRIA': 'analise-combinatoria-enem',
  'JUROS COMPOSTOS': 'juros-compostos-enem',
  'REDAÇÃO COMPETÊNCIA 1 (GRAMÁTICA)': 'redacao-competencia-1-gramatica-enem',
  'REDAÇÃO COMPETÊNCIA 5 (PROPOSTA INTERVENÇÃO)': 'redacao-competencia-5-proposta-intervencao-enem',
  'INTERPRETAÇÃO DE TEXTO': 'interpretacao-de-texto-enem',
  'EQUAÇÕES 1º E 2º GRAU': 'equacoes-1-2-grau-enem',
  'GEOMETRIA PLANA': 'geometria-plana-enem',
  'ESTATÍSTICA': 'estatistica-enem',
  'PROBABILIDADE': 'probabilidade-enem',
  'TRIGONOMETRIA': 'trigonometria-enem',
  'GENÉTICA MENDELIANA': 'genetica-mendeliana-enem',
  'ECOLOGIA (TEIAS ALIMENTARES)': 'ecologia-teias-alimentares-enem',
  'QUÍMICA (REAÇÕES QUÍMICAS)': 'reacoes-quimicas-enem',
  'FÍSICA (MECÂNICA)': 'mecanica-fisica-enem',
  'HISTÓRIA (REVOLUÇÃO FRANCESA)': 'revolucao-francesa-enem',
}

const raw = fs.readFileSync(path.join(__dirname, '../15-disciplinas-enem-publicavel.md'), 'utf8')

const postBlocks = raw.split(/^# POST \d+: (.+)$/m).slice(1)
// postBlocks alternates: [postName, body, postName, body, ...]

const outDir = path.join(__dirname, '../app/blog/posts')
const results: { slug: string; title: string; description: string }[] = []

for (let i = 0; i < postBlocks.length; i += 2) {
  const postName = postBlocks[i].trim()
  let body = postBlocks[i + 1]
  // cut off trailing "---\n\n## RESUMO FINAL" tail on the last post
  body = body.split(/\n---\n\n## RESUMO FINAL/)[0]
  // strip trailing separator
  body = body.replace(/\n---\s*$/, '').trim()

  const slug = slugMap[postName]
  if (!slug) throw new Error(`Sem slug mapeado para: ${postName}`)

  const metaMatch = body.match(/## Meta Description\n([\s\S]*?)\n##/)
  const titleMatch = body.match(/## Título H1\n([\s\S]*?)\n##/)
  if (!metaMatch || !titleMatch) throw new Error(`Meta Description ou Título H1 não encontrado em: ${postName}`)

  const description = metaMatch[1].trim()
  const title = titleMatch[1].trim()

  // conteúdo real começa depois da seção "## Título H1"
  const titleSectionEnd = body.indexOf(titleMatch[0]) + titleMatch[0].length
  const contentBody = body.slice(titleSectionEnd).trim()
  // remove trailing "- " prefix from next heading marker consumed by regex (## already included by next match start)
  const fullContent = `# ${title}\n\n## ${contentBody.startsWith('##') ? contentBody.slice(2).trim() : contentBody}`

  const frontmatter = `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description)}
date: "2026-07-11"
author: "ENEM Pro"
tags: ["disciplinas-enem", "enem-2026"]
---

`

  fs.writeFileSync(path.join(outDir, `${slug}.md`), frontmatter + fullContent + '\n')
  results.push({ slug, title, description })
}

console.log(`✅ ${results.length} posts de disciplinas escritos em app/blog/posts/`)
for (const r of results) console.log(` - ${r.slug}`)
