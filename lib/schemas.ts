import type { BlogPost } from '@/lib/blog-data'
import { SITE_URL } from '@/lib/site-config'

export interface BlogPostingSchema {
  '@context': string
  '@type': string
  headline: string
  description: string
  image?: string
  datePublished: string
  dateModified: string
  author: {
    '@type': string
    name: string
    url: string
    description: string
  }
  publisher: {
    '@type': string
    name: string
    url: string
    logo: {
      '@type': string
      url: string
    }
  }
  mainEntityOfPage: {
    '@type': string
    '@id': string
  }
  inLanguage: string
  url: string
  articleBody?: string
  keywords?: string
  articleSection?: string
  educationalLevel?: string
  audience?: {
    '@type': string
    educationalRole: string
  }
  about?: {
    '@type': string
    name: string
  }
}

export function extractPlainText(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '') // Remove images
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1') // Remove links but keep text
    .replace(/\[([^\]]+)\]\(\/([^)]+)\)/g, '$1') // Remove internal links but keep text
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/`(.+?)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/^#+\s+/gm, '') // Remove headings
    .replace(/^[\s-*>|]+/gm, '') // Remove list markers, blockquotes, table markers
    .replace(/\n\n+/g, ' ') // Replace multiple newlines with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 5000) // Limit to 5000 chars for articleBody
}

export function generateKeywords(title: string, slug: string): string {
  const slugTerms = slug
    .split('-')
    .filter(word => word.length > 3 && !['enem', 'como', 'que', 'para', 'com', 'mais'].includes(word))
    .slice(0, 5)
    .join(', ')

  return `ENEM, preparação, ${slugTerms}`
}

export function getBlogPostingSchema(post: BlogPost, slug: string): BlogPostingSchema {
  const postUrl = `${SITE_URL}/blog/${slug}`
  const plainTextBody = extractPlainText(post.content)
  const keywords = generateKeywords(post.title, slug)

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.cover_url ? `${SITE_URL}${post.cover_url}` : undefined,
    datePublished: post.date,
    dateModified: post.date,
    url: postUrl,
    inLanguage: 'pt-BR',
    articleBody: plainTextBody,
    keywords: keywords,
    articleSection: 'ENEM Preparation',
    author: {
      '@type': 'Organization',
      name: 'Equipe Editorial ENEM Pro',
      url: `${SITE_URL}/sobre`,
      description: 'Professores e especialistas em preparação para o ENEM com mais de 10 anos de experiência.',
    },
    publisher: {
      '@type': 'EducationalOrganization',
      name: 'ENEM Pro',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icons/icon-192.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    educationalLevel: 'Ensino Médio',
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
    },
    about: {
      '@type': 'Thing',
      name: 'ENEM — Exame Nacional do Ensino Médio',
    },
  }
}

export function validateBlogPostingSchema(schema: BlogPostingSchema): boolean {
  // Validate required fields
  const requiredFields = [
    '@context',
    '@type',
    'headline',
    'description',
    'datePublished',
    'dateModified',
    'url',
    'author',
    'publisher',
  ]

  for (const field of requiredFields) {
    if (!schema[field as keyof BlogPostingSchema]) {
      console.error(`Missing required field: ${field}`)
      return false
    }
  }

  // Validate @type
  if (schema['@type'] !== 'BlogPosting') {
    console.error('Invalid @type: should be BlogPosting')
    return false
  }

  // Validate @context
  if (schema['@context'] !== 'https://schema.org') {
    console.error('Invalid @context: should be https://schema.org')
    return false
  }

  // Validate date format (ISO 8601)
  const dateRegex = /^\d{4}-\d{2}-\d{2}/
  if (!dateRegex.test(schema.datePublished)) {
    console.error('Invalid datePublished format: should be YYYY-MM-DD')
    return false
  }

  // Validate URL format
  try {
    new URL(schema.url)
  } catch {
    console.error('Invalid URL format')
    return false
  }

  return true
}

export interface BreadcrumbSchema {
  '@context': string
  '@type': string
  itemListElement: Array<{
    '@type': string
    position: number
    name: string
    item: string
  }>
}

export function getBreadcrumbSchema(title: string, slug: string): BreadcrumbSchema {
  const postUrl = `${SITE_URL}/blog/${slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: title, item: postUrl },
    ],
  }
}

export interface FAQSchema {
  '@context': string
  '@type': string
  mainEntity: Array<{
    '@type': string
    name: string
    acceptedAnswer: {
      '@type': string
      text: string
    }
  }>
}

export function getFAQSchema(faqItems: Array<{ q: string; a: string }>): FAQSchema | null {
  if (faqItems.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

export interface QuizSchema {
  '@context': string
  '@type': string
  name: string
  description: string
  educationalLevel: string
  hasQuestion: Array<{
    '@type': string
    name: string
    text: string
    acceptedAnswer: {
      '@type': string
      text: string
      url?: string
    }
    suggestedAnswer: Array<{
      '@type': string
      text: string
      position?: number
    }>
  }>
}

interface QuestionData {
  alternatives?: Array<{ text?: string; file?: string }>;
  alternativesIntroduction?: string;
  context?: string;
  title?: string;
}

export function getQuizSchema(
  question: QuestionData,
  index: string,
  year: string,
  discipline: string,
  correctAnswerText: string,
  pageUrl: string
): QuizSchema {
  const allAnswers = question.alternatives?.map((alt: { text?: string; file?: string }, idx: number) => ({
    '@type': 'Answer',
    text: alt.text || (alt.file ? `[Imagem]` : 'Conteúdo indisponível'),
    position: idx + 1,
  })) || []

  const enunciado =
    question.alternativesIntroduction || question.context || question.title

  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: `Questão ${index} — ENEM ${year}`,
    description: `Questão de ${discipline} do ENEM ${year} com gabarito e explicação completa`,
    educationalLevel: 'HighSchool',
    hasQuestion: [
      {
        '@type': 'Question',
        name: `Questão ${index} — ${discipline}`,
        text: enunciado.substring(0, 500),
        acceptedAnswer: {
          '@type': 'Answer',
          text: correctAnswerText,
          url: pageUrl,
        },
        suggestedAnswer: allAnswers,
      },
    ],
  }
}

export function validateQuizSchema(schema: QuizSchema): boolean {
  // Validate required fields
  const requiredFields = ['@context', '@type', 'name', 'educationalLevel', 'hasQuestion']

  for (const field of requiredFields) {
    if (!schema[field as keyof QuizSchema]) {
      console.error(`Missing required field in QuizSchema: ${field}`)
      return false
    }
  }

  // Validate @type
  if (schema['@type'] !== 'Quiz') {
    console.error('Invalid @type: should be Quiz')
    return false
  }

  // Validate @context
  if (schema['@context'] !== 'https://schema.org') {
    console.error('Invalid @context: should be https://schema.org')
    return false
  }

  // Validate hasQuestion array
  if (!Array.isArray(schema.hasQuestion) || schema.hasQuestion.length === 0) {
    console.error('hasQuestion must be a non-empty array')
    return false
  }

  // Validate first question
  const q = schema.hasQuestion[0]
  if (!q.name || !q.text || !q.acceptedAnswer) {
    console.error('Question must have name, text, and acceptedAnswer')
    return false
  }

  return true
}
