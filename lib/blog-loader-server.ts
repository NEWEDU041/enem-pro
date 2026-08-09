'use server'

import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  readTime: number
  content: string
  cover_url?: string
  noindex?: boolean
}

const draftsDir = path.join(process.cwd(), '.blog-memory', 'drafts')
const cache = new Map<string, BlogPost>()

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
  return text.trim().split(/\s+/).length
}

export async function loadDraftPost(slug: string): Promise<BlogPost | undefined> {
  if (cache.has(slug)) {
    return cache.get(slug)
  }

  try {
    const articlePath = path.join(draftsDir, slug, 'article.md')
    if (!fs.existsSync(articlePath)) return undefined

    const content = fs.readFileSync(articlePath, 'utf-8')
    const { frontmatter, body } = parseYamlFrontmatter(content)

    const wordCount = countWords(body)
    const readTime = frontmatter.readTime || Math.max(1, Math.ceil(wordCount / 200))

    const post: BlogPost = {
      slug: frontmatter.slug || slug,
      title: frontmatter.title || 'Untitled',
      description: frontmatter.metaDescription || frontmatter.description || '',
      date: frontmatter.publishDate || new Date().toISOString().split('T')[0],
      readTime,
      content: body.trim(),
      cover_url: frontmatter.coverImage,
      noindex: frontmatter.noindex || false,
    }

    cache.set(slug, post)
    return post
  } catch {
    return undefined
  }
}
