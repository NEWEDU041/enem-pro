import { disciplineToSlug } from '@/lib/enem-api'
import { getPostsByDiscipline } from '@/lib/blog-data'

export interface RelatedItem {
  title: string
  href: string
  type: 'blog' | 'question'
}

export function getRelatedQuestionsForBlogPost(discipline?: string): RelatedItem[] {
  if (!discipline) return []

  const slug = disciplineToSlug(discipline)
  if (!slug) return []

  return [
    {
      title: `Questões de ${discipline} 2024`,
      href: `/questoes/${slug}/2024`,
      type: 'question',
    },
    {
      title: `Questões de ${discipline} 2023`,
      href: `/questoes/${slug}/2023`,
      type: 'question',
    },
    {
      title: `Questões de ${discipline} 2022`,
      href: `/questoes/${slug}/2022`,
      type: 'question',
    },
  ]
}

export function getRelatedBlogPostsForQuestions(discipline?: string): RelatedItem[] {
  if (!discipline) return []

  // Get up to 3 blog posts related to this discipline
  const posts = getPostsByDiscipline(discipline).slice(0, 3)

  return posts.map(post => ({
    title: post.title,
    href: `/blog/${post.slug}`,
    type: 'blog',
  }))
}
