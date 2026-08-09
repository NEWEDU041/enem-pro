#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const fixedPosts = require('../fixed-3ad6366-posts.json')

const slugsToFix = [
  'cinematica-enem-o-que-cai','como-estudar-fisica-enem','como-estudar-quimica-enem','como-estudar-biologia-enem',
  'como-estudar-matematica-enem','como-estudar-portugues-enem',
  'ecologia-enem-o-que-cai','enem-nota-maxima','enem-2026-o-que-estudar','engenharia-nota-de-corte-enem',
  'funcoes-matematica-enem','gabarito-ciencias-humanas-enem-2025','geometria-enem-o-que-cai',
  'logaritmos-matematica-enem','matematica-financeira-enem','probabilidade-combinatoria-enem',
  'progressoes-matematica-enem','quimica-organica-enem',
  'redacao-enem-tema','trigonometria-enem-o-que-cai'
]

const draftsDir = path.join(__dirname, '../.blog-memory/drafts')

let fixed = 0
let notFoundInFixedSet = []

for (const slug of slugsToFix) {
  const post = fixedPosts[slug]
  if (!post) {
    notFoundInFixedSet.push(slug)
    continue
  }

  const postDir = path.join(draftsDir, slug)
  const articlePath = path.join(postDir, 'article.md')

  if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true })

  const frontmatter = [
    '---',
    `title: ${JSON.stringify(post.title)}`,
    `slug: ${JSON.stringify(slug)}`,
    `metaDescription: ${JSON.stringify(post.description)}`,
    `publishDate: ${JSON.stringify(post.date)}`,
    `lastUpdated: ${JSON.stringify(post.date)}`,
    `readTime: ${post.readTime}`,
    `restoredFrom: "git-history-3ad6366-fabrication-fixed"`,
    '---',
    '',
  ].join('\n')

  const body = `# ${post.title}\n\n${post.content.trim()}\n`

  fs.writeFileSync(articlePath, frontmatter + body, 'utf-8')
  fixed++
}

console.log(`Corrigidos (versao pos-fix aplicada): ${fixed}`)
if (notFoundInFixedSet.length) {
  console.log('NAO encontrados na versao corrigida (precisam de fix manual):', notFoundInFixedSet)
}
