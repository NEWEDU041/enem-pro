import * as fs from 'fs'
import * as path from 'path'

const POSTS_DIR = path.join(process.cwd(), 'app/blog/posts')
const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))

type Post = { slug: string; title: string; description: string; date: string; readTime: number; content: string }

const posts: Post[] = []

for (const file of files) {
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8')
  const frontmatter = raw.match(/^---\n([\s\S]*?)\n---\n/)?.[1] || ''
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '').trim()

  const getMeta = (key: string): string => {
    const m = frontmatter.match(new RegExp(`^${key}:\\s*"(.+)"`, 'm'))
    return m ? m[1] : ''
  }

  const title = getMeta('title')
  const description = getMeta('description')
  const date = getMeta('date')
  const words = body.split(/\s+/).length
  const readTime = Math.max(1, Math.ceil(words / 200))
  const slug = file.replace(/\.md$/, '')

  posts.push({ slug, title, description, date, readTime, content: body })
}

// Generate EXTRA_POSTS_18 with actual content
console.log('export const EXTRA_POSTS_18: BlogPost[] = [')
for (const p of posts) {
  const escaped = p.content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\${/g, '\\${')
  console.log(`  { slug: '${p.slug}', title: ${JSON.stringify(p.title)}, description: ${JSON.stringify(p.description)}, date: '${p.date}', readTime: ${p.readTime}, content: \`${escaped}\` },`)
}
console.log(']')
