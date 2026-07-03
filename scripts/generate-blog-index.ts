import { writeFileSync } from 'fs'
import { getAllPosts, getCategory } from '../lib/blog-data'

const index = getAllPosts().map(p => ({
  slug: p.slug,
  title: p.title,
  description: p.description,
  date: p.date,
  readTime: p.readTime,
  category: getCategory(p.slug),
}))

writeFileSync('lib/blog-index.json', JSON.stringify(index))
console.log(`[generate-blog-index] ${index.length} posts indexed`)
