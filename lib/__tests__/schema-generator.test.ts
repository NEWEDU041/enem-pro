/**
 * Schema Generator Tests
 * Validates Question, Course, FAQPage, and CreativeWork schemas
 * Tests JSON-LD compliance and field validation
 */

import { describe, it, expect } from 'vitest'
import {
  generateQuestionSchema,
  validateQuestionSchema,
  generateCourseSchema,
  validateCourseSchema,
  generateFAQPageSchema,
  validateFAQPageSchema,
  generateCreativeWorkSchema,
  validateCreativeWorkSchema,
  generateSchemasBatch,
  isValidSchema,
} from '../schema-generator'

describe('Schema Generator', () => {
  // ============================================
  // Question Schema Tests
  // ============================================
  describe('Question Schema', () => {
    it('should generate valid question schema', () => {
      const schema = generateQuestionSchema({
        id: '1',
        text: 'What is the capital of Brazil?',
        year: 2024,
        discipline: 'Geography',
        options: [
          { text: 'Rio de Janeiro' },
          { text: 'Brasília', isCorrect: true },
          { text: 'Salvador' },
          { text: 'São Paulo' },
        ],
        explanation: 'Brasília is the capital of Brazil since 1960.',
      })

      expect(schema).toBeDefined()
      expect(schema['@type']).toBe('Question')
      expect(schema['@context']).toBe('https://schema.org')
      expect(schema.name).toContain('2024')
      expect(schema.suggestedAnswer.length).toBe(4)
      expect(schema.acceptedAnswer).toBeDefined()
      expect(schema.acceptedAnswer?.text).toBe('Brasília')
    })

    it('should validate correct question schema', () => {
      const schema = generateQuestionSchema({
        id: '1',
        text: 'Test question',
        year: 2024,
        discipline: 'Math',
        options: [
          { text: 'A', isCorrect: true },
          { text: 'B' },
        ],
      })

      const validation = validateQuestionSchema(schema)
      expect(validation.valid).toBe(true)
      expect(validation.errors.length).toBe(0)
    })

    it('should reject invalid question schema', () => {
      const invalidSchema = {
        '@context': 'https://schema.org',
        '@type': 'WrongType',
        name: 'Test',
        text: 'Test question',
        suggestedAnswer: [],
      }

      const validation = validateQuestionSchema(invalidSchema as any)
      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('should handle question with context and image', () => {
      const schema = generateQuestionSchema({
        id: '2',
        text: 'Analyze the image',
        context: 'Given an image showing...',
        year: 2023,
        discipline: 'Biology',
        imageUrl: '/images/biology-2023-q2.jpg',
        options: [
          { text: 'Option A', isCorrect: true },
          { text: 'Option B' },
        ],
      })

      expect(schema.image).toBeDefined()
      expect(schema.image).toContain('biology-2023-q2.jpg')
    })
  })

  // ============================================
  // Course Schema Tests
  // ============================================
  describe('Course Schema', () => {
    it('should generate valid course schema', () => {
      const schema = generateCourseSchema({
        name: 'Complete ENEM Preparation',
        description: 'Comprehensive course for ENEM exam',
        url: '/courses/enem-complete',
        numberOfStudents: 5000,
      })

      expect(schema).toBeDefined()
      expect(schema['@type']).toBe('Course')
      expect(schema['@context']).toBe('https://schema.org')
      expect(schema.name).toBe('Complete ENEM Preparation')
      expect(schema.provider.name).toBe('ENEM Pro')
      expect(schema.numberOfStudents).toBe(5000)
    })

    it('should validate correct course schema', () => {
      const schema = generateCourseSchema({
        name: 'Math Course',
        description: 'Learn mathematics',
        url: '/courses/math',
      })

      const validation = validateCourseSchema(schema)
      expect(validation.valid).toBe(true)
      expect(validation.errors.length).toBe(0)
    })

    it('should include instructor information', () => {
      const schema = generateCourseSchema({
        name: 'Advanced Course',
        description: 'Advanced ENEM prep',
        url: '/courses/advanced',
        instructor: {
          name: 'Dr. João Silva',
          url: 'https://example.com/instructors/joao',
        },
      })

      expect(schema.instructor).toBeDefined()
      expect(schema.instructor?.name).toBe('Dr. João Silva')
    })

    it('should include pricing information', () => {
      const schema = generateCourseSchema({
        name: 'Premium Course',
        description: 'Premium ENEM prep',
        url: '/courses/premium',
        price: {
          currency: 'BRL',
          value: '199.90',
        },
      })

      expect(schema.offers).toBeDefined()
      expect(schema.offers?.price).toBe('199.90')
      expect(schema.offers?.priceCurrency).toBe('BRL')
    })

    it('should include ratings', () => {
      const schema = generateCourseSchema({
        name: 'Rated Course',
        description: 'Popular course',
        url: '/courses/popular',
        ratingValue: 4.8,
        reviewCount: 250,
      })

      expect(schema.aggregateRating).toBeDefined()
      expect(schema.aggregateRating?.ratingValue).toBe(4.8)
      expect(schema.aggregateRating?.reviewCount).toBe(250)
    })

    it('should include topics', () => {
      const schema = generateCourseSchema({
        name: 'Subject Course',
        description: 'Course about subjects',
        url: '/courses/subjects',
        topics: ['Mathematics', 'Physics', 'Chemistry'],
      })

      expect(schema.about).toBeDefined()
      expect(schema.about?.length).toBe(3)
      expect(schema.about?.[0].name).toBe('Mathematics')
    })
  })

  // ============================================
  // FAQ Page Schema Tests
  // ============================================
  describe('FAQ Page Schema', () => {
    it('should generate valid faq page schema', () => {
      const schema = generateFAQPageSchema({
        title: 'ENEM FAQ',
        url: '/faq',
        items: [
          {
            question: 'What is ENEM?',
            answer: 'ENEM is the Brazilian national high school exam.',
          },
          {
            question: 'When is ENEM held?',
            answer: 'Usually in November each year.',
          },
        ],
      })

      expect(schema).toBeDefined()
      expect(schema['@type']).toBe('FAQPage')
      expect(schema['@context']).toBe('https://schema.org')
      expect(schema.mainEntity.length).toBe(2)
      expect(schema.mainEntity[0].name).toContain('What is ENEM')
    })

    it('should validate correct faq page schema', () => {
      const schema = generateFAQPageSchema({
        title: 'Test FAQ',
        url: '/test-faq',
        items: [
          {
            question: 'Q1?',
            answer: 'A1.',
          },
        ],
      })

      const validation = validateFAQPageSchema(schema)
      expect(validation.valid).toBe(true)
      expect(validation.errors.length).toBe(0)
    })

    it('should reject faq page with empty items', () => {
      const schema = generateFAQPageSchema({
        title: 'Empty FAQ',
        url: '/empty-faq',
        items: [],
      })

      const validation = validateFAQPageSchema(schema)
      expect(validation.valid).toBe(false)
    })

    it('should include date modified', () => {
      const dateModified = '2024-11-02'
      const schema = generateFAQPageSchema({
        title: 'Dated FAQ',
        url: '/dated-faq',
        items: [
          {
            question: 'Q?',
            answer: 'A.',
          },
        ],
        dateModified,
      })

      expect(schema.dateModified).toBe(dateModified)
    })
  })

  // ============================================
  // Creative Work Schema Tests
  // ============================================
  describe('Creative Work Schema', () => {
    it('should generate valid creative work schema', () => {
      const schema = generateCreativeWorkSchema({
        name: 'ENEM Study Guide',
        description: 'Complete ENEM study guide with examples',
        url: '/resources/study-guide',
      })

      expect(schema).toBeDefined()
      expect(schema['@type']).toBe('CreativeWork')
      expect(schema.name).toBe('ENEM Study Guide')
      expect(schema.educationalLevel).toBe('HighSchool')
    })

    it('should validate correct creative work schema', () => {
      const schema = generateCreativeWorkSchema({
        name: 'Resource',
        description: 'Educational resource',
        url: '/resource',
      })

      const validation = validateCreativeWorkSchema(schema)
      expect(validation.valid).toBe(true)
      expect(validation.errors.length).toBe(0)
    })

    it('should include keywords', () => {
      const schema = generateCreativeWorkSchema({
        name: 'Math Resource',
        description: 'Mathematics education',
        url: '/math',
        keywords: ['algebra', 'geometry', 'calculus'],
      })

      expect(schema.keywords).toContain('algebra')
      expect(schema.keywords).toContain('geometry')
    })

    it('should include learning resource type', () => {
      const schema = generateCreativeWorkSchema({
        name: 'Video Course',
        description: 'Video learning resource',
        url: '/videos',
        learningResourceType: 'VideoObject',
      })

      expect(schema.learningResourceType).toBe('VideoObject')
    })
  })

  // ============================================
  // Batch Processing Tests
  // ============================================
  describe('Batch Schema Generation', () => {
    it('should generate batch of schemas', () => {
      const inputs = [
        {
          type: 'question',
          data: {
            id: '1',
            text: 'Q1',
            year: 2024,
            discipline: 'Math',
            options: [
              { text: 'A', isCorrect: true },
              { text: 'B' },
            ],
          },
        },
        {
          type: 'course',
          data: {
            name: 'Course 1',
            description: 'Desc',
            url: '/course',
          },
        },
        {
          type: 'faqpage',
          data: {
            title: 'FAQ',
            url: '/faq',
            items: [
              {
                question: 'Q?',
                answer: 'A.',
              },
            ],
          },
        },
      ]

      const result = generateSchemasBatch(inputs)

      expect(result.schemas.length).toBe(3)
      expect(result.validSchemas).toBe(3)
      expect(result.errors.length).toBe(0)
    })

    it('should count schema instances', () => {
      const inputs = Array.from({ length: 20 }, (_, i) => ({
        type: 'question',
        data: {
          id: String(i + 1),
          text: `Question ${i + 1}`,
          year: 2024,
          discipline: 'Various',
          options: [
            { text: 'A', isCorrect: i % 4 === 0 },
            { text: 'B', isCorrect: i % 4 === 1 },
            { text: 'C', isCorrect: i % 4 === 2 },
            { text: 'D', isCorrect: i % 4 === 3 },
          ],
        },
      }))

      const result = generateSchemasBatch(inputs)

      expect(result.schemas.length).toBe(20)
      expect(result.validSchemas).toBe(20)
    })

    it('should generate 50+ schema instances', () => {
      const questions = Array.from({ length: 30 }, (_, i) => ({
        type: 'question',
        data: {
          id: String(i + 1),
          text: `ENEM Question ${i + 1}`,
          year: 2024,
          discipline: ['Math', 'Physics', 'Chemistry', 'Biology'][i % 4],
          options: [
            { text: `Option A` },
            { text: `Option B`, isCorrect: true },
            { text: `Option C` },
            { text: `Option D` },
          ],
        },
      }))

      const courses = Array.from({ length: 10 }, (_, i) => ({
        type: 'course',
        data: {
          name: `ENEM Prep Course ${i + 1}`,
          description: `Complete preparation for ENEM exam part ${i + 1}`,
          url: `/courses/enem-${i + 1}`,
          numberOfStudents: (i + 1) * 500,
        },
      }))

      const faqs = Array.from({ length: 5 }, (_, i) => ({
        type: 'faqpage',
        data: {
          title: `ENEM FAQ - Topic ${i + 1}`,
          url: `/faq-${i + 1}`,
          items: Array.from({ length: 5 }, (_, j) => ({
            question: `FAQ Question ${i * 5 + j + 1}?`,
            answer: `FAQ Answer ${i * 5 + j + 1}.`,
          })),
        },
      }))

      const creativeWorks = Array.from({ length: 10 }, (_, i) => ({
        type: 'creativework',
        data: {
          name: `Educational Resource ${i + 1}`,
          description: `High-quality educational content for ENEM preparation`,
          url: `/resources/${i + 1}`,
          keywords: ['ENEM', 'education', `topic-${i}`],
        },
      }))

      const allInputs = [...questions, ...courses, ...faqs, ...creativeWorks]

      const result = generateSchemasBatch(allInputs)

      expect(result.schemas.length).toBeGreaterThanOrEqual(50)
      expect(result.validSchemas).toBeGreaterThanOrEqual(50)
      expect(result.errors.length).toBe(0)
    })
  })

  // ============================================
  // JSON-LD Compliance Tests
  // ============================================
  describe('JSON-LD Compliance', () => {
    it('should be valid JSON-LD', () => {
      const schema = generateQuestionSchema({
        id: '1',
        text: 'Test',
        year: 2024,
        discipline: 'Math',
        options: [
          { text: 'A', isCorrect: true },
          { text: 'B' },
        ],
      })

      expect(isValidSchema(schema)).toBe(true)
    })

    it('should be JSON serializable', () => {
      const schema = generateCourseSchema({
        name: 'Test Course',
        description: 'Test',
        url: '/test',
      })

      expect(() => {
        JSON.stringify(schema)
      }).not.toThrow()
    })

    it('should require @context and @type', () => {
      const invalidSchema = {
        name: 'No context or type',
      }

      expect(isValidSchema(invalidSchema)).toBe(false)
    })
  })

  // ============================================
  // URL Handling Tests
  // ============================================
  describe('URL Handling', () => {
    it('should prepend SITE_URL to relative URLs', () => {
      const schema = generateCourseSchema({
        name: 'Course',
        description: 'Desc',
        url: '/courses/test',
      })

      expect(schema.url).toContain('http')
    })

    it('should preserve absolute URLs', () => {
      const schema = generateCourseSchema({
        name: 'Course',
        description: 'Desc',
        url: 'https://example.com/course',
      })

      expect(schema.url).toBe('https://example.com/course')
    })

    it('should construct proper question URLs', () => {
      const schema = generateQuestionSchema({
        id: '145',
        text: 'Test',
        year: 2024,
        discipline: 'Physics',
        options: [{ text: 'A', isCorrect: true }],
      })

      expect(schema.url).toContain('physics')
      expect(schema.url).toContain('145')
    })
  })
})
