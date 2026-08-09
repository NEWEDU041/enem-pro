#!/usr/bin/env node
/**
 * Restaura os posts classificados como OK (500+ palavras, conteúdo real)
 * para .blog-memory/drafts/<slug>/article.md, no mesmo formato usado
 * pelos 22 posts novos (dynamic loader via loadDraftPost).
 */
const fs = require('fs')
const path = require('path')

const allPosts = require('../restored-292-posts.json')
const report = require('../restored-292-posts-report.json')

const okSlugs = new Set(report.filter(r => r.status === 'OK').map(r => r.slug))

const draftsDir = path.join(__dirname, '../.blog-memory/drafts')

let created = 0
let skipped = 0

for (const slug of okSlugs) {
  const post = allPosts[slug]
  if (!post) continue

  const postDir = path.join(draftsDir, slug)
  const articlePath = path.join(postDir, 'article.md')

  if (fs.existsSync(articlePath)) {
    skipped++
    continue
  }

  fs.mkdirSync(postDir, { recursive: true })

  const frontmatter = [
    '---',
    `title: ${JSON.stringify(post.title)}`,
    `slug: ${JSON.stringify(slug)}`,
    `metaDescription: ${JSON.stringify(post.description)}`,
    `publishDate: ${JSON.stringify(post.date)}`,
    `lastUpdated: ${JSON.stringify(post.date)}`,
    `readTime: ${post.readTime}`,
    `restoredFrom: "git-history-eca8a67"`,
    '---',
    '',
  ].join('\n')

  const body = `# ${post.title}\n\n${post.content.trim()}\n`

  fs.writeFileSync(articlePath, frontmatter + body, 'utf-8')
  created++
}

console.log(`Criados: ${created}`)
console.log(`Já existiam (pulados): ${skipped}`)
console.log(`Total OK processados: ${okSlugs.size}`)
