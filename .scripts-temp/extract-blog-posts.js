#!/usr/bin/env node
/**
 * Transpila blog-data-292posts-backup.ts para JS via TypeScript compiler API
 * (sem depender do tsconfig.json do projeto) e extrai o array BLOG_POSTS real.
 */
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const ts = require('typescript')

const backupFile = path.join(__dirname, '../blog-data-292posts-backup.ts')
const src = fs.readFileSync(backupFile, 'utf-8')

const result = ts.transpileModule(src, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2019,
  },
})

const jsCode = result.outputText + '\nmodule.exports.ALL_POSTS = ALL_POSTS;\n'

const moduleObj = { exports: {} }
const wrapper = new Function('module', 'exports', 'require', jsCode)
wrapper(moduleObj, moduleObj.exports, require)

const BLOG_POSTS = moduleObj.exports.ALL_POSTS

if (!Array.isArray(BLOG_POSTS)) {
  console.error('ALL_POSTS não é um array. Exports:', Object.keys(moduleObj.exports))
  process.exit(1)
}

console.log(`Total posts (array length): ${BLOG_POSTS.length}`)

const posts = {}
let dupes = 0
for (const post of BLOG_POSTS) {
  if (posts[post.slug]) dupes++
  posts[post.slug] = post
}

console.log(`Unique slugs: ${Object.keys(posts).length}`)
console.log(`Duplicates overwritten: ${dupes}`)

const outputFile = path.join(__dirname, '../restored-292-posts.json')
fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2), 'utf-8')
console.log(`Saved to: ${outputFile}`)

console.log('\nFirst 5 slugs:')
Object.keys(posts).slice(0, 5).forEach((s, i) => console.log(`  ${i + 1}. ${s}`))
console.log('\nLast 5 slugs:')
Object.keys(posts).slice(-5).forEach((s, i) => console.log(`  ${i + 1}. ${s}`))
