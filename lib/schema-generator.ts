/**
 * Schema.org Generator for ENEM Pro
 * 
 * Generates structured data for:
 * - Question (with multiple choice answers)
 * - Course (ENEM preparation courses)
 * - FAQPage (frequently asked questions)
 * 
 * Compliant with schema.org specs and optimized for educational content.
 */

import { SITE_URL } from './site-config'

// ============================================
// Question Schema
// ============================================

export interface QuestionOption {
  text: string
  isCorrect?: boolean
  image?: string
}

export interface QuestionSchemaInput {
  id: string
  text: string
  context?: string
  options: QuestionOption[]
  year: number
  discipline: string
  difficulty?: 'easy' | 'medium' | 'hard'
  explanation?: string
  imageUrl?: string
}

export interface QuestionSchema {
  '@context': 'https://schema.org'
  '@type': 'Question'
  name: string
  text: string
  image?: string
  url: string
  educationalLevel: string
  educationalContext: string
  suggestedAnswer: Array<{
    '@type': 'Answer'
    text: string
    position: number
    isCorrect?: boolean
  }>
  acceptedAnswer?: {
    '@type': 'Answer'
    text: string
    explanation?: string
  }
  author: {
    '@type': 'Organization'
    name: string
    url: string
  }
  datePublished: string
  inLanguage: 'pt-BR'
}

export function generateQuestionSchema(input: QuestionSchemaInput): QuestionSchema {
  const correctOption = input.options.find(opt => opt.isCorrect)
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Question',
    name: `ENEM ${input.year} - Questão ${input.id} (${input.discipline})`,
    text: input.text,
    image: input.imageUrl ? `${SITE_URL}${input.imageUrl}` : undefined,
    url: `${SITE_URL}/questoes/${input.year}/${input.discipline.toLowerCase()}/${input.id}`,
    educationalLevel: 'HighSchool',
    educationalContext: `ENEM ${input.year} - ${input.discipline}`,
    suggestedAnswer: input.options.map((opt, idx) => ({
      '@type': 'Answer',
      text: opt.text,
      position: idx + 1,
      isCorrect: opt.isCorrect,
    })),
    acceptedAnswer: correctOption ? {
      '@type': 'Answer',
      text: correctOption.text,
      explanation: input.explanation,
    } : undefined,
    author: {
      '@type': 'Organization',
      name: 'ENEM Pro',
      url: SITE_URL,
    },
    datePublished: new Date().toISOString().split('T')[0],
    inLanguage: 'pt-BR',
  }
}

export function validateQuestionSchema(schema: QuestionSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (schema['@context'] !== 'https://schema.org') {
    errors.push('Invalid @context')
  }
  if (schema['@type'] !== 'Question') {
    errors.push('Invalid @type, should be Question')
  }
  if (!schema.name || schema.name.length === 0) {
    errors.push('Missing or empty name')
  }
  if (!schema.text || schema.text.length === 0) {
    errors.push('Missing or empty text')
  }
  if (!Array.isArray(schema.suggestedAnswer) || schema.suggestedAnswer.length === 0) {
    errors.push('suggestedAnswer must be a non-empty array')
  }
  if (!schema.acceptedAnswer) {
    errors.push('Missing acceptedAnswer')
  }
  if (schema.educationalLevel !== 'HighSchool') {
    errors.push('educationalLevel should be HighSchool')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================
// Course Schema
// ============================================

export interface CourseSchemaInput {
  name: string
  description: string
  url: string
  image?: string
  startDate?: string
  endDate?: string
  duration?: string
  instructor?: {
    name: string
    url?: string
  }
  price?: {
    currency: string
    value: string
  }
  reviewCount?: number
  ratingValue?: number
  numberOfStudents?: number
  learningResources?: string[]
  topics?: string[]
}

export interface CourseSchema {
  '@context': 'https://schema.org'
  '@type': 'Course'
  name: string
  description: string
  image?: string
  url: string
  inLanguage: 'pt-BR'
  educationalLevel: 'HighSchool'
  provider: {
    '@type': 'Organization'
    name: 'ENEM Pro'
    url: string
    sameAs: string[]
  }
  audience: {
    '@type': 'EducationalAudience'
    educationalRole: 'student'
  }
  instructor?: {
    '@type': 'Person'
    name: string
    url?: string
  }
  startDate?: string
  endDate?: string
  duration?: string
  hasCourseInstance?: Array<{
    '@type': 'CourseInstance'
    startDate?: string
    endDate?: string
  }>
  offers?: {
    '@type': 'Offer'
    price: string
    priceCurrency: string
    availability: string
  }
  aggregateRating?: {
    '@type': 'AggregateRating'
    ratingValue: number
    reviewCount: number
  }
  numberOfStudents?: number
  learningResourceType?: string[]
  about?: Array<{
    '@type': 'Thing'
    name: string
  }>
}

export function generateCourseSchema(input: CourseSchemaInput): CourseSchema {
  const schema: CourseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: input.name,
    description: input.description,
    image: input.image ? `${SITE_URL}${input.image}` : undefined,
    url: input.url.startsWith('http') ? input.url : `${SITE_URL}${input.url}`,
    inLanguage: 'pt-BR',
    educationalLevel: 'HighSchool',
    provider: {
      '@type': 'Organization',
      name: 'ENEM Pro',
      url: SITE_URL,
      sameAs: [
        'https://www.youtube.com/@enempro',
        'https://www.instagram.com/enempro',
        'https://www.linkedin.com/company/enem-pro',
      ],
    },
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
    },
    numberOfStudents: input.numberOfStudents,
  }

  if (input.instructor) {
    schema.instructor = {
      '@type': 'Person',
      name: input.instructor.name,
      url: input.instructor.url,
    }
  }

  if (input.startDate || input.endDate || input.duration) {
    schema.hasCourseInstance = [
      {
        '@type': 'CourseInstance',
        startDate: input.startDate,
        endDate: input.endDate,
      },
    ]
    schema.duration = input.duration
  }

  if (input.price) {
    schema.offers = {
      '@type': 'Offer',
      price: input.price.value,
      priceCurrency: input.price.currency,
      availability: 'https://schema.org/InStock',
    }
  }

  if (input.ratingValue && input.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.ratingValue,
      reviewCount: input.reviewCount,
    }
  }

  if (input.learningResources && input.learningResources.length > 0) {
    schema.learningResourceType = input.learningResources
  }

  if (input.topics && input.topics.length > 0) {
    schema.about = input.topics.map(topic => ({
      '@type': 'Thing',
      name: topic,
    }))
  }

  return schema
}

export function validateCourseSchema(schema: CourseSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (schema['@context'] !== 'https://schema.org') {
    errors.push('Invalid @context')
  }
  if (schema['@type'] !== 'Course') {
    errors.push('Invalid @type, should be Course')
  }
  if (!schema.name || schema.name.length === 0) {
    errors.push('Missing or empty name')
  }
  if (!schema.description || schema.description.length === 0) {
    errors.push('Missing or empty description')
  }
  if (!schema.url) {
    errors.push('Missing url')
  }
  if (!schema.provider || schema.provider.name !== 'ENEM Pro') {
    errors.push('Invalid provider')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================
// FAQ Page Schema
// ============================================

export interface FAQItem {
  question: string
  answer: string
  category?: string
}

export interface FAQPageSchemaInput {
  title: string
  description?: string
  url: string
  items: FAQItem[]
  dateModified?: string
}

export interface FAQPageSchema {
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  name: string
  description?: string
  url: string
  dateModified?: string
  mainEntity: Array<{
    '@type': 'Question'
    name: string
    acceptedAnswer: {
      '@type': 'Answer'
      text: string
    }
  }>
  inLanguage: 'pt-BR'
  isPartOf: {
    '@type': 'WebSite'
    name: string
    url: string
  }
}

export function generateFAQPageSchema(input: FAQPageSchemaInput): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: input.title,
    description: input.description,
    url: input.url.startsWith('http') ? input.url : `${SITE_URL}${input.url}`,
    dateModified: input.dateModified || new Date().toISOString().split('T')[0],
    mainEntity: input.items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
    inLanguage: 'pt-BR',
    isPartOf: {
      '@type': 'WebSite',
      name: 'ENEM Pro',
      url: SITE_URL,
    },
  }
}

export function validateFAQPageSchema(schema: FAQPageSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (schema['@context'] !== 'https://schema.org') {
    errors.push('Invalid @context')
  }
  if (schema['@type'] !== 'FAQPage') {
    errors.push('Invalid @type, should be FAQPage')
  }
  if (!schema.name || schema.name.length === 0) {
    errors.push('Missing or empty name')
  }
  if (!schema.url) {
    errors.push('Missing url')
  }
  if (!Array.isArray(schema.mainEntity) || schema.mainEntity.length === 0) {
    errors.push('mainEntity must be a non-empty array')
  }
  
  // Validate each question
  for (let i = 0; i < schema.mainEntity.length; i++) {
    const q = schema.mainEntity[i]
    if (!q.name || q.name.length === 0) {
      errors.push(`Question ${i + 1}: missing or empty name`)
    }
    if (!q.acceptedAnswer || !q.acceptedAnswer.text) {
      errors.push(`Question ${i + 1}: missing or empty answer text`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================
// Creative Work Schema (for educational resources)
// ============================================

export interface CreativeWorkSchemaInput {
  name: string
  description: string
  url: string
  author?: string
  datePublished?: string
  dateModified?: string
  image?: string
  keywords?: string[]
  learningResourceType?: string
}

export interface CreativeWorkSchema {
  '@context': 'https://schema.org'
  '@type': 'CreativeWork'
  '@id': string
  name: string
  description: string
  url: string
  image?: string
  inLanguage: 'pt-BR'
  author?: {
    '@type': 'Organization'
    name: string
    url: string
  }
  datePublished?: string
  dateModified?: string
  keywords?: string
  learningResourceType?: string
  educationalLevel?: 'HighSchool'
  audience?: {
    '@type': 'EducationalAudience'
    educationalRole: 'student'
  }
}

export function generateCreativeWorkSchema(input: CreativeWorkSchemaInput): CreativeWorkSchema {
  const url = input.url.startsWith('http') ? input.url : `${SITE_URL}${input.url}`

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': url,
    name: input.name,
    description: input.description,
    url: url,
    image: input.image ? `${SITE_URL}${input.image}` : undefined,
    inLanguage: 'pt-BR',
    author: {
      '@type': 'Organization',
      name: input.author || 'ENEM Pro',
      url: SITE_URL,
    },
    datePublished: input.datePublished || new Date().toISOString().split('T')[0],
    dateModified: input.dateModified || new Date().toISOString().split('T')[0],
    keywords: input.keywords?.join(', '),
    learningResourceType: input.learningResourceType,
    educationalLevel: 'HighSchool',
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
    },
  }
}

export function validateCreativeWorkSchema(schema: CreativeWorkSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (schema['@context'] !== 'https://schema.org') {
    errors.push('Invalid @context')
  }
  if (schema['@type'] !== 'CreativeWork') {
    errors.push('Invalid @type, should be CreativeWork')
  }
  if (!schema.name || schema.name.length === 0) {
    errors.push('Missing or empty name')
  }
  if (!schema.description || schema.description.length === 0) {
    errors.push('Missing or empty description')
  }
  if (!schema.url) {
    errors.push('Missing url')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Validates that a schema is valid JSON-LD and passes structural checks
 */
export function isValidSchema(schema: any): boolean {
  try {
    // Must be serializable to JSON
    JSON.stringify(schema)
    
    // Must have required fields
    if (!schema['@context'] || !schema['@type']) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * Generates a batch of schemas with validation
 */
export function generateSchemasBatch(
  inputs: Array<{ type: string; data: any }>,
): { schemas: any[]; validSchemas: number; errors: string[] } {
  const schemas = []
  const errors = []
  let validSchemas = 0

  for (const input of inputs) {
    try {
      let schema: any

      switch (input.type) {
        case 'question':
          schema = generateQuestionSchema(input.data)
          const questionValidation = validateQuestionSchema(schema)
          if (questionValidation.valid) validSchemas++
          else errors.push(...questionValidation.errors)
          break

        case 'course':
          schema = generateCourseSchema(input.data)
          const courseValidation = validateCourseSchema(schema)
          if (courseValidation.valid) validSchemas++
          else errors.push(...courseValidation.errors)
          break

        case 'faqpage':
          schema = generateFAQPageSchema(input.data)
          const faqValidation = validateFAQPageSchema(schema)
          if (faqValidation.valid) validSchemas++
          else errors.push(...faqValidation.errors)
          break

        case 'creativework':
          schema = generateCreativeWorkSchema(input.data)
          const cwValidation = validateCreativeWorkSchema(schema)
          if (cwValidation.valid) validSchemas++
          else errors.push(...cwValidation.errors)
          break

        default:
          errors.push(`Unknown schema type: ${input.type}`)
          continue
      }

      if (schema) {
        schemas.push(schema)
      }
    } catch (err) {
      errors.push(`Error generating ${input.type} schema: ${String(err)}`)
    }
  }

  return {
    schemas,
    validSchemas,
    errors,
  }
}
