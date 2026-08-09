import * as fs from 'fs'
import * as path from 'path'
import { BLOG_POSTS } from '../blog-data-292posts-backup'

const outputFile = path.join(__dirname, '../restored-292-posts.json')

const posts: Record<string, any> = {}
for (const post of BLOG_POSTS) {
  posts[post.slug] = post
}

fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2), 'utf-8')

console.log(`Total posts extracted: ${BLOG_POSTS.length}`)
console.log(`Unique slugs: ${Object.keys(posts).length}`)
console.log(`Saved to: ${outputFile}`)
