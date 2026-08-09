import { writeFileSync, readdirSync, readFileSync, existsSync } from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { getAllPosts, getCategory } from '../lib/blog-data'

interface IndexEntry {
  slug: string
  title: string
  description: string
  date: string
  readTime: number
  category: string
}

function parseYamlFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/m)
  if (!match) return { frontmatter: {}, body: content }
  const [, frontmatterStr, body] = match
  try {
    const frontmatter = yaml.load(frontmatterStr) as Record<string, any>
    return { frontmatter, body }
  } catch {
    return { frontmatter: {}, body: content }
  }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

const staticEntries: IndexEntry[] = getAllPosts().map(p => ({
  slug: p.slug,
  title: p.title,
  description: p.description,
  date: p.date,
  readTime: p.readTime,
  category: getCategory(p.slug),
}))

const draftsDir = path.join(__dirname, '../.blog-memory/drafts')
const draftEntries: IndexEntry[] = []

if (existsSync(draftsDir)) {
  const draftSlugs = readdirSync(draftsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  for (const slug of draftSlugs) {
    const articlePath = path.join(draftsDir, slug, 'article.md')
    if (!existsSync(articlePath)) continue

    const content = readFileSync(articlePath, 'utf-8')
    const { frontmatter, body } = parseYamlFrontmatter(content)

    const wordCount = countWords(body)
    const readTime = frontmatter.readTime || Math.max(1, Math.ceil(wordCount / 200))

    draftEntries.push({
      slug: frontmatter.slug || slug,
      title: frontmatter.title || slug,
      description: frontmatter.metaDescription || frontmatter.description || '',
      date: frontmatter.publishDate || '2025-01-01',
      readTime,
      category: getCategory(slug),
    })
  }
}

const staticSlugSet = new Set(staticEntries.map(e => e.slug))
const dedupedDrafts = draftEntries.filter(e => !staticSlugSet.has(e.slug))

const index = [...staticEntries, ...dedupedDrafts]

writeFileSync('lib/blog-index.json', JSON.stringify(index))
console.log(`[generate-blog-index] ${staticEntries.length} static + ${dedupedDrafts.length} drafts = ${index.length} posts indexed`)
