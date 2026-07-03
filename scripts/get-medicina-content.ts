import * as fs from 'fs'
import * as path from 'path'

const raw = fs.readFileSync(path.join(process.cwd(), 'app/blog/posts/como-passar-medicina-federal-enem.md'), 'utf-8')
const frontmatter = raw.match(/^---\n([\s\S]*?)\n---\n/)?.[1] || ''
const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '').trim()
const getMeta = (key: string): string => {
  const m = frontmatter.match(new RegExp(`^${key}:\\s*"(.+)"`, 'm'))
  return m ? m[1] : ''
}
const title = getMeta('title')
const description = getMeta('description')
const words = body.split(/\s+/).length
const readTime = Math.max(1, Math.ceil(words / 200))
const escaped = body.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${')
console.log(`{ slug: 'como-passar-em-medicina-federal-no-enem', title: ${JSON.stringify(title)}, description: ${JSON.stringify(description)}, date: '2026-06-29', readTime: ${readTime}, content: \`${escaped}\` },`)
