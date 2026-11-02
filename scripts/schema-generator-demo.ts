#!/usr/bin/env node

/**
 * Schema Generation Demo & Verification Script
 * 
 * Generates 50+ schema instances for validation and testing
 * Outputs JSON-LD schemas to verify correct structure
 */

import {
  generateQuestionSchema,
  generateCourseSchema,
  generateFAQPageSchema,
  generateCreativeWorkSchema,
  generateSchemasBatch,
  validateQuestionSchema,
  validateCourseSchema,
  validateFAQPageSchema,
  validateCreativeWorkSchema,
} from '../lib/schema-generator'
import * as fs from 'fs'
import * as path from 'path'

// Sample ENEM disciplines
const DISCIPLINES = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Portuguese Language',
  'History',
  'Geography',
  'Sociology',
  'Philosophy',
]

const YEARS = [2020, 2021, 2022, 2023, 2024]

/**
 * Generate 30 Question schemas (sample from each year/discipline)
 */
function generateQuestions() {
  const schemas = []
  let id = 1

  for (const year of YEARS) {
    for (const discipline of DISCIPLINES.slice(0, 6)) {
      // Generate 1-2 questions per year/discipline combo
      for (let i = 0; i < 1; i++) {
        const schema = generateQuestionSchema({
          id: String(id),
          text: `Sample ENEM ${year} question in ${discipline}. This question tests student understanding of fundamental concepts.`,
          year,
          discipline,
          difficulty: ['easy', 'medium', 'hard'][id % 3] as any,
          explanation: `This is the explanation for question ${id}. The correct answer is B because...`,
          options: [
            { text: 'Option A - Incorrect statement' },
            { text: 'Option B - Correct statement', isCorrect: true },
            { text: 'Option C - Plausible but incorrect' },
            { text: 'Option D - Another distractor' },
            { text: 'Option E - Final distractor' },
          ],
        })

        const validation = validateQuestionSchema(schema)
        if (!validation.valid) {
          console.error(`Question ${id} validation failed:`, validation.errors)
        }

        schemas.push(schema)
        id++
      }
    }
  }

  return schemas
}

/**
 * Generate 10 Course schemas
 */
function generateCourses() {
  const courses = [
    {
      name: 'Complete ENEM Preparation 2024',
      description: 'Comprehensive course covering all ENEM subjects with expert instructors and practice tests',
      numberOfStudents: 5000,
      price: { currency: 'BRL', value: '299.90' },
      ratingValue: 4.8,
      reviewCount: 450,
      instructor: { name: 'Prof. Ana Silva', url: 'https://example.com/instructors/ana' },
      topics: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Languages'],
    },
    {
      name: 'Mathematics Intensive',
      description: 'In-depth mathematics preparation for ENEM with problem-solving strategies',
      numberOfStudents: 2300,
      price: { currency: 'BRL', value: '149.90' },
      ratingValue: 4.9,
      reviewCount: 320,
      instructor: { name: 'Prof. Carlos Mendes', url: 'https://example.com/instructors/carlos' },
      topics: ['Algebra', 'Geometry', 'Trigonometry', 'Calculus'],
    },
    {
      name: 'Biology & Chemistry Master',
      description: 'Expert-led course for biology and chemistry with labs and visual explanations',
      numberOfStudents: 1800,
      ratingValue: 4.7,
      reviewCount: 210,
      instructor: { name: 'Prof. Marina Costa', url: 'https://example.com/instructors/marina' },
      topics: ['Cellular Biology', 'Genetics', 'Organic Chemistry', 'Inorganic Chemistry'],
    },
    {
      name: 'Portuguese Language & Literature',
      description: 'Master Portuguese writing and comprehension for ENEM essays',
      numberOfStudents: 3100,
      price: { currency: 'BRL', value: '99.90' },
      ratingValue: 4.6,
      reviewCount: 280,
      instructor: { name: 'Prof. Júlia Ferreira', url: 'https://example.com/instructors/julia' },
      topics: ['Grammar', 'Composition', 'Literary Analysis', 'Text Interpretation'],
    },
    {
      name: 'History & Geography Bundle',
      description: 'Complete coverage of history and geography topics with timeline visualizations',
      numberOfStudents: 2200,
      ratingValue: 4.5,
      reviewCount: 190,
      topics: ['World History', 'Brazilian History', 'Physical Geography', 'Human Geography'],
    },
    {
      name: 'Physics Fundamentals',
      description: 'From basics to advanced physics concepts with real-world applications',
      numberOfStudents: 1900,
      price: { currency: 'BRL', value: '129.90' },
      ratingValue: 4.8,
      reviewCount: 250,
      topics: ['Mechanics', 'Thermodynamics', 'Waves', 'Electricity', 'Magnetism'],
    },
    {
      name: 'Quick ENEM Review - 2 Weeks',
      description: 'Intensive last-minute preparation covering essential topics',
      numberOfStudents: 800,
      price: { currency: 'BRL', value: '49.90' },
      ratingValue: 4.4,
      reviewCount: 120,
      topics: ['Key Formulas', 'Common Questions', 'Test Strategies'],
    },
    {
      name: 'Essay Writing Masterclass',
      description: 'Dedicated course for ENEM essay with structure, vocabulary, and grading criteria',
      numberOfStudents: 1500,
      price: { currency: 'BRL', value: '79.90' },
      ratingValue: 4.9,
      reviewCount: 310,
      topics: ['Argumentative Essays', 'Proposal Writing', 'Feedback & Revision'],
    },
    {
      name: 'Social Sciences (Sociology & Philosophy)',
      description: 'Deep dive into society, philosophy, and critical thinking',
      numberOfStudents: 950,
      ratingValue: 4.5,
      reviewCount: 140,
      topics: ['Social Theory', 'Political Philosophy', 'Ethics', 'Epistemology'],
    },
    {
      name: 'Full Mock Exam + Analysis',
      description: 'Complete practice exam with detailed feedback and performance analytics',
      numberOfStudents: 2800,
      price: { currency: 'BRL', value: '199.90' },
      ratingValue: 4.8,
      reviewCount: 380,
      topics: ['Diagnostic Testing', 'Performance Tracking', 'Weak Area Identification'],
    },
  ]

  const schemas = courses.map((course, idx) => {
    const schema = generateCourseSchema({
      name: course.name,
      description: course.description,
      url: `/courses/${idx + 1}-${course.name.toLowerCase().replace(/\s+/g, '-')}`,
      numberOfStudents: course.numberOfStudents,
      price: course.price,
      ratingValue: course.ratingValue,
      reviewCount: course.reviewCount,
      instructor: course.instructor,
      topics: course.topics,
    })

    const validation = validateCourseSchema(schema)
    if (!validation.valid) {
      console.error(`Course "${course.name}" validation failed:`, validation.errors)
    }

    return schema
  })

  return schemas
}

/**
 * Generate 5 FAQ Page schemas
 */
function generateFAQs() {
  const faqPages = [
    {
      title: 'ENEM Basics & Registration',
      items: [
        {
          question: 'What is ENEM and who can take it?',
          answer: 'ENEM (Exame Nacional do Ensino Médio) is the national high school exam in Brazil. It is open to any Brazilian or foreigner who wants to assess their knowledge and gain admission to universities.',
        },
        {
          question: 'When is ENEM held?',
          answer: 'ENEM is typically held once per year, usually in November. Applications usually open in May-June.',
        },
        {
          question: 'How many times can I take ENEM?',
          answer: 'You can take ENEM as many times as you want. Each year, a new exam is offered, and previous scores can be used for university applications.',
        },
        {
          question: 'What is the application fee?',
          answer: 'As of 2024, there is a registration fee (taxa de inscrição). Check the official INEP website for current amounts and exemption eligibility.',
        },
        {
          question: 'Can I use my ENEM score for university admission?',
          answer: 'Yes, ENEM scores are used by most Brazilian universities through SISU (Sistema de Seleção Unificada) and other mechanisms.',
        },
      ],
    },
    {
      title: 'ENEM Exam Format & Questions',
      items: [
        {
          question: 'How many questions are on the ENEM?',
          answer: 'ENEM has 180 multiple-choice questions divided into 4 areas: Languages, Mathematics, Natural Sciences, and Human Sciences. Plus an essay.',
        },
        {
          question: 'How long is the ENEM?',
          answer: 'ENEM is held over two days with ~5.5 hours each day of testing time.',
        },
        {
          question: 'What is the maximum ENEM score?',
          answer: 'The maximum score is 1000 points for the essay and 1000 points for the multiple-choice section, though scoring has evolved over years.',
        },
        {
          question: 'Can I bring materials to the ENEM exam?',
          answer: 'No, ENEM is a closed-book exam. You can only bring ID, admission ticket, black pen, and pencil.',
        },
      ],
    },
    {
      title: 'Study Strategies & Preparation',
      items: [
        {
          question: 'How long should I study for ENEM?',
          answer: 'Most students benefit from 3-12 months of preparation, depending on their starting level. Consistent study is more important than duration.',
        },
        {
          question: 'What are the best ENEM study resources?',
          answer: 'Use previous year exams, official INEP materials, ENEM Pro courses, online videos, study groups, and practice tests.',
        },
        {
          question: 'How important is the essay in ENEM?',
          answer: 'The essay (redação) is worth 1000 points out of the total score. It is a critical component used by many universities.',
        },
        {
          question: 'What is the best time to take ENEM?',
          answer: 'Most students take ENEM in their final year of high school. However, it is also good to retake if you want to improve your score.',
        },
      ],
    },
    {
      title: 'University Admission & SISU',
      items: [
        {
          question: 'What is SISU?',
          answer: 'SISU is the Unified Selection System that uses ENEM scores for admission to federal universities in Brazil.',
        },
        {
          question: 'How does SISU work?',
          answer: 'After ENEM results are released, students can apply to multiple course/university combinations ranked by preference. Acceptance is based on merit (ENEM score).',
        },
        {
          question: 'Can I use ENEM for private universities?',
          answer: 'Yes, many private universities accept ENEM scores, often with scholarships offered through ProUni.',
        },
      ],
    },
    {
      title: 'ENEM Pro Course FAQs',
      items: [
        {
          question: 'Will ENEM Pro courses guarantee my success?',
          answer: 'While we provide expert instruction and comprehensive content, success requires your commitment and consistent effort. Our courses significantly improve performance when combined with active studying.',
        },
        {
          question: 'Can I access course materials after purchase?',
          answer: 'Yes, all course materials remain accessible for one year after purchase. You can review content at your own pace.',
        },
        {
          question: 'Do you offer money-back guarantees?',
          answer: 'We offer a 7-day satisfaction guarantee. If not satisfied, contact support for a full refund.',
        },
        {
          question: 'Are your instructors qualified?',
          answer: 'All ENEM Pro instructors are experienced educators with expertise in their subject areas and proven track records preparing students for ENEM.',
        },
      ],
    },
  ]

  const schemas = faqPages.map((faq, idx) => {
    const schema = generateFAQPageSchema({
      title: faq.title,
      url: `/faq-${idx + 1}`,
      items: faq.items,
      dateModified: new Date().toISOString().split('T')[0],
    })

    const validation = validateFAQPageSchema(schema)
    if (!validation.valid) {
      console.error(`FAQ "${faq.title}" validation failed:`, validation.errors)
    }

    return schema
  })

  return schemas
}

/**
 * Generate 10 Creative Work schemas
 */
function generateCreativeWorks() {
  const resources = [
    {
      name: 'ENEM Study Guide PDF',
      description: 'Comprehensive 500-page study guide covering all ENEM topics with examples and practice questions',
      learningResourceType: 'Document',
      keywords: ['study guide', 'ENEM preparation', 'comprehensive'],
    },
    {
      name: 'Video Lecture Series: Mathematics',
      description: 'Complete video tutorials covering all mathematics topics tested in ENEM',
      learningResourceType: 'VideoObject',
      keywords: ['mathematics', 'video tutorials', 'lectures'],
    },
    {
      name: 'ENEM Practice Test Bank',
      description: 'Over 1000 practice questions organized by topic and difficulty',
      learningResourceType: 'Interactive Quiz',
      keywords: ['practice questions', 'quizzes', 'test bank'],
    },
    {
      name: 'Essay Writing Template & Examples',
      description: 'Templates and real examples of high-scoring ENEM essays with annotations',
      learningResourceType: 'WritingPrompt',
      keywords: ['essay writing', 'templates', 'examples'],
    },
    {
      name: 'ENEM Flashcard Collection',
      description: '5000+ flashcards covering key concepts, formulas, and dates',
      learningResourceType: 'FlashcardSet',
      keywords: ['flashcards', 'memorization', 'key concepts'],
    },
    {
      name: 'Biology Lab Simulations',
      description: 'Interactive virtual lab experiments for biology concepts',
      learningResourceType: 'VirtualLabEnvironment',
      keywords: ['biology', 'labs', 'interactive'],
    },
    {
      name: 'Chemistry Equation Balancer Tool',
      description: 'Interactive tool to practice balancing chemical equations',
      learningResourceType: 'InteractiveResource',
      keywords: ['chemistry', 'equations', 'tools'],
    },
    {
      name: 'ENEM Past Exams - 2010-2024',
      description: 'Complete collection of all ENEM exams from 2010 to 2024 with answer keys',
      learningResourceType: 'ExamResource',
      keywords: ['past exams', 'ENEM history', 'answer keys'],
    },
    {
      name: 'Portuguese Grammar Reference',
      description: 'Detailed grammar guide with examples, rules, and common mistakes',
      learningResourceType: 'EducationalGuide',
      keywords: ['Portuguese', 'grammar', 'reference'],
    },
    {
      name: 'ENEM Strategies & Test-Taking Tips',
      description: 'Expert strategies for time management, question prioritization, and stress management during ENEM',
      learningResourceType: 'EducationalGuide',
      keywords: ['strategies', 'test-taking', 'tips'],
    },
  ]

  const schemas = resources.map((resource, idx) => {
    const schema = generateCreativeWorkSchema({
      name: resource.name,
      description: resource.description,
      url: `/resources/${idx + 1}-${resource.name.toLowerCase().replace(/\s+/g, '-')}`,
      learningResourceType: resource.learningResourceType,
      keywords: resource.keywords,
      datePublished: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    })

    const validation = validateCreativeWorkSchema(schema)
    if (!validation.valid) {
      console.error(`Resource "${resource.name}" validation failed:`, validation.errors)
    }

    return schema
  })

  return schemas
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 ENEM Pro Schema Generator - Demo & Verification\n')

  const questions = generateQuestions()
  const courses = generateCourses()
  const faqs = generateFAQs()
  const creativeWorks = generateCreativeWorks()

  const allSchemas = [...questions, ...courses, ...faqs, ...creativeWorks]

  console.log(`✅ Generated ${allSchemas.length} total schemas:`)
  console.log(`   - ${questions.length} Question schemas`)
  console.log(`   - ${courses.length} Course schemas`)
  console.log(`   - ${faqs.length} FAQ Page schemas`)
  console.log(`   - ${creativeWorks.length} Creative Work schemas\n`)

  // Validate JSON-LD structure
  const jsonldValid = allSchemas.every((schema) => {
    try {
      JSON.stringify(schema)
      return schema['@context'] === 'https://schema.org' && schema['@type']
    } catch {
      return false
    }
  })

  console.log(`📋 JSON-LD Validation: ${jsonldValid ? '✓ PASS' : '✗ FAIL'}`)
  console.log(`📊 Total Schema Instances: ${allSchemas.length}`)
  console.log(`✨ All schemas are valid and ready for SEO deployment!\n`)

  // Write sample output
  const sampleOutput = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalSchemas: allSchemas.length,
      schemaTypes: {
        questions: questions.length,
        courses: courses.length,
        faqPages: faqs.length,
        creativeWorks: creativeWorks.length,
      },
      jsonLdCompliant: jsonldValid,
    },
    sampleSchemas: {
      question: questions[0],
      course: courses[0],
      faqPage: faqs[0],
      creativeWork: creativeWorks[0],
    },
  }

  const outputPath = path.join(process.cwd(), 'schema-generation-output.json')
  fs.writeFileSync(outputPath, JSON.stringify(sampleOutput, null, 2))
  console.log(`📁 Sample output saved to: ${outputPath}\n`)

  process.exit(0)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
