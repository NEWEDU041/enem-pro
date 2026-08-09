#!/usr/bin/env npx tsx
/**
 * Integrate blog articles from .blog-memory/drafts/ into BLOG_POSTS
 * Reads markdown files and converts to BlogPost format
 */

import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

interface DraftArticle {
  slug: string
  frontmatter: Record<string, any>
  content: string
}

function parseMdFile(filePath: string): DraftArticle | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')

    // Extract YAML frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    if (!match) return null

    const [, frontmatterStr, bodyContent] = match
    const frontmatter = yaml.load(frontmatterStr) as Record<string, any>

    // Count words
    const wordCount = bodyContent.split(/\s+/).length

    return {
      slug: frontmatter.slug || path.basename(path.dirname(filePath)),
      frontmatter: {
        ...frontmatter,
        wordCount,
      },
      content: bodyContent.trim(),
    }
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error)
    return null
  }
}

function getDraftArticles(): DraftArticle[] {
  const draftsDir = path.join(process.cwd(), '.blog-memory', 'drafts')

  if (!fs.existsSync(draftsDir)) {
    console.warn(`⚠️  ${draftsDir} not found`)
    return []
  }

  const articles: DraftArticle[] = []
  const dirs = fs.readdirSync(draftsDir)

  for (const dir of dirs) {
    const articlePath = path.join(draftsDir, dir, 'article.md')
    if (fs.existsSync(articlePath)) {
      const article = parseMdFile(articlePath)
      if (article) {
        articles.push(article)
      }
    }
  }

  return articles
}

function generateBlogPostObject(article: DraftArticle): string {
  const { slug, frontmatter, content } = article

  // Escape content for JavaScript
  const escapedContent = content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')

  return `  {
    slug: "${slug}",
    title: "${(frontmatter.title || '').replace(/"/g, '\\"')}",
    description: "${(frontmatter.metaDescription || frontmatter.description || '').replace(/"/g, '\\"').substring(0, 160)}",
    date: "${frontmatter.publishDate || new Date().toISOString().split('T')[0]}",
    readTime: ${frontmatter.readTime || Math.ceil(article.content.split(/\s+/).length / 200)},
    content: \`${escapedContent}\`,
    cover_url: "${frontmatter.coverImage || '/images/default-blog-cover.jpg'}",
    noindex: ${frontmatter.noindex === true},
  }`
}

async function main() {
  console.log('\n📝 Integrating blog drafts into BLOG_POSTS...\n')

  const articles = getDraftArticles()

  if (articles.length === 0) {
    console.warn('⚠️  No draft articles found')
    return
  }

  console.log(`✅ Found ${articles.length} draft articles\n`)
  console.log('Articles to integrate:')
  articles.forEach(a => {
    console.log(`   • ${a.slug} (${a.frontmatter.wordCount || 0} words)`)
  })

  // Read existing blog-data.ts
  const blogDataPath = path.join(process.cwd(), 'lib', 'blog-data.ts')
  let blogDataContent = fs.readFileSync(blogDataPath, 'utf-8')

  // Find BLOG_POSTS array
  const postsMatch = blogDataContent.match(/export const BLOG_POSTS: BlogPost\[\] = \[([\s\S]*?)\]/);
  if (!postsMatch) {
    console.error('❌ Could not find BLOG_POSTS array in blog-data.ts')
    return
  }

  const existingPosts = postsMatch[1]

  // Generate new posts string
  const newPostsStr = articles
    .map(a => generateBlogPostObject(a))
    .join(',\n')

  // Update BLOG_POSTS
  const updatedContent = blogDataContent.replace(
    /export const BLOG_POSTS: BlogPost\[\] = \[([\s\S]*?)\]/,
    `export const BLOG_POSTS: BlogPost[] = [\n${existingPosts},\n${newPostsStr}\n]`
  )

  // Write back
  fs.writeFileSync(blogDataPath, updatedContent)

  console.log(`\n✅ Successfully integrated ${articles.length} articles`)
  console.log(`📝 Updated: ${blogDataPath}`)
  console.log('\n🔨 Run: npm run build')
}

main().catch(console.error)
