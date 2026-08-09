#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const posts = require('../restored-292-posts.json')
const entries = Object.entries(posts)

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

const autoPattern = /^gabarito-enem-\d{4}-[a-z-]+$/

const rows = entries.map(([slug, p]) => {
  const words = wordCount(p.content)
  let status = 'OK'
  if (autoPattern.test(slug)) status = 'TEMPLATE'
  else if (words < 300) status = 'QUASE_VAZIO'
  else if (words < 500) status = 'RASO'
  return {
    slug,
    title: p.title,
    description: p.description,
    words,
    readTime: p.readTime,
    date: p.date,
    status,
  }
})

rows.sort((a, b) => b.words - a.words)

const summary = {}
rows.forEach((r) => { summary[r.status] = (summary[r.status] || 0) + 1 })
console.log('Resumo:', summary)
console.log('Total:', rows.length)

fs.writeFileSync(
  path.join(__dirname, '../restored-292-posts-report.json'),
  JSON.stringify(rows, null, 2),
  'utf-8'
)
console.log('Salvo: restored-292-posts-report.json')
