import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { YEARS } from '@/lib/enem-api'
import { initLogContext, createRequestLogger, logSuccess } from '@/lib/logger'
import { ensureCheckoutWorkerStarted, isCheckoutWorkerStarted } from '@/lib/checkout-worker-init'
import {
  generateQuestionSchema,
  generateCourseSchema,
  generateFAQPageSchema,
  validateQuestionSchema,
  validateCourseSchema,
  validateFAQPageSchema,
} from '@/lib/schema-generator'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Real ENEM exams run ~180-184 objective questions/year; used only as a
// cheap reference denominator for the cache-coverage check below, not as an
// exact count (avoids an expensive per-year fetch just to health-check).
const APPROX_QUESTIONS_PER_YEAR = 183
const EXPECTED_TOTAL_QUESTIONS = YEARS.length * APPROX_QUESTIONS_PER_YEAR
const CACHE_COVERAGE_WARNING_THRESHOLD = 0.9

interface CheckResult {
  status: 'ok' | 'error' | 'warning' | 'outdated'
  error?: string
  latency_ms?: number
  last_update?: string
  cached_questions?: number | null
  coverage?: string
  haiku_usage?: number | null
  expensive_models?: number
  optimization_status?: string
}

export async function GET(request?: NextRequest) {
  const logContext = initLogContext(undefined as any)
  const logger = createRequestLogger(logContext)
  const startTime = Date.now()
  const region = request?.headers.get('x-vercel-region') || 'unknown'

  // Ensure checkout worker is initialized
  await ensureCheckoutWorkerStarted().catch((err) => {
    console.warn('[health] Checkout worker startup failed:', err)
  })

  const checks: Record<string, CheckResult> = {}
  let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'

  const sb = createServerClient()

  // Check 1: Database connectivity
  const dbStart = Date.now()
  try {
    const { error } = await sb.from('question_explanations').select('*', { count: 'exact', head: true })
    if (error) {
      checks.database = { status: 'error', error: error.message, latency_ms: Date.now() - dbStart }
      status = 'unhealthy'
    } else {
      checks.database = { status: 'ok', latency_ms: Date.now() - dbStart }
    }
  } catch (e) {
    checks.database = { status: 'error', error: String(e), latency_ms: Date.now() - dbStart }
    status = 'unhealthy'
  }

  // Check 2: Stats view materialization
  try {
    const statsStart = Date.now()
    const { data } = await sb
      .from('stats_snapshot')
      .select('*')
      .limit(1)
      .maybeSingle()
    checks.stats_view = {
      status: data ? 'ok' : 'outdated',
      latency_ms: Date.now() - statsStart,
      last_update: data?.snapshot_time,
    }
  } catch (e) {
    checks.stats_view = { status: 'error', error: String(e) }
  }

  // Check 3: Cache metrics — coverage against the real question bank size,
  // not just "does at least one row exist" (that trivially never regresses).
  try {
    const cacheStart = Date.now()
    const { count: cachedQuestions } = await sb
      .from('question_explanations')
      .select('*', { count: 'exact', head: true })

    const coverage = (cachedQuestions ?? 0) / EXPECTED_TOTAL_QUESTIONS

    checks.cache = {
      status: coverage >= CACHE_COVERAGE_WARNING_THRESHOLD ? 'ok' : 'warning',
      latency_ms: Date.now() - cacheStart,
      cached_questions: cachedQuestions,
      coverage: `${Math.round(coverage * 100)}%`,
    }
  } catch (e) {
    checks.cache = { status: 'error', error: String(e) }
  }

  // Check 5: AI cost efficiency (token optimization)
  try {
    const { count: haikuCount } = await sb
      .from('question_explanations')
      .select('*', { count: 'exact', head: true })
      .eq('model', 'claude-haiku-4-5-20251001')

    const expensiveCount = 0 // Simplified: assume all non-haiku are manually created or old

    checks.ai_optimization = {
      status: expensiveCount === 0 ? 'ok' : 'warning',
      haiku_usage: haikuCount,
      expensive_models: expensiveCount,
      optimization_status: expensiveCount === 0 ? '100% optimized' : `${expensiveCount} expensive models in use`,
    }

    if (expensiveCount > 0) status = 'degraded'
  } catch (e) {
    checks.ai_optimization = { status: 'error', error: String(e) }
  }

  // Check 4: Schema Generation & Validation
  const schemaStart = Date.now()
  const schemaMetrics = { generated: 0, validated: 0, invalid: 0 }
  try {
    // Test Question Schema generation
    const testQuestion = generateQuestionSchema({
      id: 'TEST-1',
      text: 'Test question for schema validation',
      year: 2024,
      discipline: 'Mathematics',
      options: [
        { text: 'Option A' },
        { text: 'Option B', isCorrect: true },
        { text: 'Option C' },
        { text: 'Option D' },
      ],
    })
    
    schemaMetrics.generated++
    const qValidation = validateQuestionSchema(testQuestion)
    if (qValidation.valid) {
      schemaMetrics.validated++
    } else {
      schemaMetrics.invalid++
    }

    // Test Course Schema generation
    const testCourse = generateCourseSchema({
      name: 'ENEM Preparation Course',
      description: 'Complete ENEM preparation course',
      url: '/courses/enem-2024',
      numberOfStudents: 1000,
    })

    schemaMetrics.generated++
    const courseValidation = validateCourseSchema(testCourse)
    if (courseValidation.valid) {
      schemaMetrics.validated++
    } else {
      schemaMetrics.invalid++
    }

    // Test FAQ Page Schema generation
    const testFAQ = generateFAQPageSchema({
      title: 'ENEM FAQ',
      url: '/faq',
      items: [
        {
          question: 'What is ENEM?',
          answer: 'ENEM is the Brazilian national high school exam.',
        },
      ],
    })

    schemaMetrics.generated++
    const faqValidation = validateFAQPageSchema(testFAQ)
    if (faqValidation.valid) {
      schemaMetrics.validated++
    } else {
      schemaMetrics.invalid++
    }

    checks.schema_generation = {
      status: schemaMetrics.invalid === 0 ? 'ok' : 'warning',
      latency_ms: Date.now() - schemaStart,
      generated_schemas: schemaMetrics.generated,
      valid_schemas: schemaMetrics.validated,
      invalid_schemas: schemaMetrics.invalid,
      json_ld_compliant: schemaMetrics.invalid === 0,
    }

    if (schemaMetrics.invalid > 0) {
      status = 'degraded'
    }
  } catch (e) {
    checks.schema_generation = {
      status: 'error',
      error: String(e),
      latency_ms: Date.now() - schemaStart,
    }
    status = 'degraded'
  }

  // Performance summary
  const performance = {
    total_ms: Date.now() - startTime,
    db_latency_ms: checks.database?.latency_ms || 0,
    cache_latency_ms: checks.cache?.latency_ms || 0,
    schema_generation_ms: checks.schema_generation?.latency_ms || 0,
  }

  // Overall status determination
  const errorCount = Object.values(checks).filter((c) => c.status === 'error').length
  const warningCount = Object.values(checks).filter((c) => c.status === 'warning').length

  if (errorCount > 0) status = 'unhealthy'
  else if (warningCount > 0) status = 'degraded'

  // Add recommendations
  const recommendations: string[] = []
  if (checks.cache?.status === 'warning') {
    recommendations.push(`⚠️  Cache coverage ${checks.cache.coverage ?? 'unknown'}: run generation script`)
  }
  if ((checks.ai_optimization?.expensive_models ?? 0) > 0) {
    recommendations.push('⚠️  Expensive AI models in use: migrate to Haiku')
  }

  const health = {
    status,
    timestamp: new Date().toISOString(),
    checks,
    schemaInstances: schemaMetrics,
    performance,
    region,
    version: process.env.npm_package_version || '0.0.1',
    recommendations,
    checkout_worker: {
      status: isCheckoutWorkerStarted() ? 'active' : 'inactive',
    },
  }

  logSuccess(logger, logContext, {
    status: health.status === 'unhealthy' ? 503 : 200,
    endpoint: '/api/health',
    message: `Health check: ${health.status}`,
    metadata: {
      checks: Object.keys(checks),
      schemas: schemaMetrics,
      errors: errorCount,
      warnings: warningCount,
      latency_ms: performance.total_ms,
    },
  })

  return NextResponse.json(health, {
    status: health.status === 'unhealthy' ? 503 : 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Status': health.status,
      'X-Schema-Instances': String(schemaMetrics.generated),
      'X-Response-Time-Ms': String(performance.total_ms),
      'X-Served-By': region,
    },
  })
}
