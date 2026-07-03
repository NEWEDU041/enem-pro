import type { BlogCategory } from './blog-data'
import index from './blog-index.json'

export interface BlogPostMeta {
  slug: string
  title: string
  description: string
  date: string
  readTime: number
  category: BlogCategory
}

const POSTS = index as BlogPostMeta[]

export function getAllSlugsLight(): string[] {
  return POSTS.map(p => p.slug)
}

export function getAllPostsLight(): BlogPostMeta[] {
  return POSTS
}

export function getPostMetaLight(slug: string): BlogPostMeta | undefined {
  return POSTS.find(p => p.slug === slug)
}
