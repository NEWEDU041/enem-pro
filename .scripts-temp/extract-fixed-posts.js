#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const backupFile = path.join(__dirname, '../blog-data-fixed-3ad6366.ts')
const src = fs.readFileSync(backupFile, 'utf-8')

const result = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
})

let jsCode = result.outputText
if (jsCode.includes('const ALL_POSTS')) {
  jsCode += '\nmodule.exports.ALL_POSTS = ALL_POSTS;\n'
}

const moduleObj = { exports: {} }
const wrapper = new Function('module', 'exports', 'require', jsCode)
wrapper(moduleObj, moduleObj.exports, require)

const posts = moduleObj.exports.ALL_POSTS || moduleObj.exports.BLOG_POSTS

if (!Array.isArray(posts)) {
  console.error('Nao encontrado array de posts. Exports:', Object.keys(moduleObj.exports))
  process.exit(1)
}

console.log(`Total posts na versao corrigida: ${posts.length}`)

const bySlug = {}
posts.forEach(p => { bySlug[p.slug] = p })

fs.writeFileSync(
  path.join(__dirname, '../fixed-3ad6366-posts.json'),
  JSON.stringify(bySlug, null, 2),
  'utf-8'
)
console.log('Salvo: fixed-3ad6366-posts.json')
