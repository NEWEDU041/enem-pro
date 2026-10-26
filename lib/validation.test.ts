/**
 * Integration Test Examples for Input Validation
 * Run with: npx vitest run validation.test.ts
 * Or manually test with curl/Thunder Client
 */

import { describe, it, expect } from 'vitest'
import {
  CheckoutRequestSchema,
  AdminUpgradeRequestSchema,
  ExplicarRequestSchema,
  CorrigirRedacaoRequestSchema,
  EmailDripRequestSchema,
  SearchConsoleIndexRequestSchema,
  ResponderRequestSchema,
  SimuladoSaveRequestSchema,
  formatValidationError,
} from '@/lib/validation'

describe('Input Validation with Zod', () => {
  describe('CheckoutRequestSchema', () => {
    it('should accept valid plan enum', () => {
      const result = CheckoutRequestSchema.safeParse({ plan: 'monthly' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.plan).toBe('monthly')
      }
    })

    it('should accept annual plan', () => {
      const result = CheckoutRequestSchema.safeParse({ plan: 'annual' })
      expect(result.success).toBe(true)
    })

    it('should default to monthly when plan omitted', () => {
      const result = CheckoutRequestSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.plan).toBe('monthly')
      }
    })

    it('should reject invalid plan', () => {
      const result = CheckoutRequestSchema.safeParse({ plan: 'quarterly' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('monthly')
      }
    })
  })

  describe('AdminUpgradeRequestSchema', () => {
    it('should accept valid email and months', () => {
      const result = AdminUpgradeRequestSchema.safeParse({
        email: 'user@example.com',
        months: 6,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('user@example.com')
        expect(result.data.months).toBe(6)
      }
    })

    it('should reject invalid email', () => {
      const result = AdminUpgradeRequestSchema.safeParse({
        email: 'not-an-email',
        months: 1,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Email inválido')
      }
    })

    it('should reject months outside valid range', () => {
      const result = AdminUpgradeRequestSchema.safeParse({
        email: 'user@example.com',
        months: 200,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('máximo: 120')
      }
    })

    it('should reject non-integer months', () => {
      const result = AdminUpgradeRequestSchema.safeParse({
        email: 'user@example.com',
        months: 3.5,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('inteiro')
      }
    })

    it('should default months to 1', () => {
      const result = AdminUpgradeRequestSchema.safeParse({
        email: 'user@example.com',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.months).toBe(1)
      }
    })
  })

  describe('ExplicarRequestSchema', () => {
    it('should accept valid question_id and alternative', () => {
      const result = ExplicarRequestSchema.safeParse({
        question_id: '2022-145',
        selected_alternative: 'C',
      })
      expect(result.success).toBe(true)
    })

    it('should reject malformed question_id', () => {
      const result = ExplicarRequestSchema.safeParse({
        question_id: 'invalid-format',
        selected_alternative: 'B',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('AAAA-NNN')
      }
    })

    it('should reject invalid alternative', () => {
      const result = ExplicarRequestSchema.safeParse({
        question_id: '2022-145',
        selected_alternative: 'F',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('A-E')
      }
    })

    it('should allow omitting both fields', () => {
      const result = ExplicarRequestSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('CorrigirRedacaoRequestSchema', () => {
    it('should accept valid essay with minimum length', () => {
      const result = CorrigirRedacaoRequestSchema.safeParse({
        tema: 'Technology in education',
        texto: 'A tecnologia tem revolucionado a forma como aprendemos e nos relacionamos com a informação. Desde o surgimento da internet, o acesso ao conhecimento se democratizou de forma significativa. Este texto discute a importância das ferramentas digitais na transformação educacional.',
      })
      expect(result.success).toBe(true)
    })

    it('should reject essay text below 200 characters', () => {
      const result = CorrigirRedacaoRequestSchema.safeParse({
        texto: 'Too short',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('200 caracteres')
      }
    })

    it('should reject essay text above 6000 characters', () => {
      const result = CorrigirRedacaoRequestSchema.safeParse({
        texto: 'a'.repeat(6001),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('6000')
      }
    })

    it('should reject theme above 500 characters', () => {
      const result = CorrigirRedacaoRequestSchema.safeParse({
        tema: 'a'.repeat(501),
        texto: 'a'.repeat(200),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('500 caracteres')
      }
    })

    it('should default theme to empty string', () => {
      const result = CorrigirRedacaoRequestSchema.safeParse({
        texto: 'a'.repeat(200),
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tema).toBe('')
      }
    })
  })

  describe('EmailDripRequestSchema', () => {
    it('should accept valid drip_day', () => {
      const result = EmailDripRequestSchema.safeParse({ drip_day: 7 })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.drip_day).toBe(7)
      }
    })

    it('should accept minimum drip_day (0)', () => {
      const result = EmailDripRequestSchema.safeParse({ drip_day: 0 })
      expect(result.success).toBe(true)
    })

    it('should accept maximum drip_day (365)', () => {
      const result = EmailDripRequestSchema.safeParse({ drip_day: 365 })
      expect(result.success).toBe(true)
    })

    it('should reject drip_day above range', () => {
      const result = EmailDripRequestSchema.safeParse({ drip_day: 500 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('365')
      }
    })

    it('should reject non-integer drip_day', () => {
      const result = EmailDripRequestSchema.safeParse({ drip_day: 3.5 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('inteiro')
      }
    })
  })

  describe('SearchConsoleIndexRequestSchema', () => {
    it('should accept valid slug', () => {
      const result = SearchConsoleIndexRequestSchema.safeParse({
        slug: 'questoes-matematica-enem-2022',
      })
      expect(result.success).toBe(true)
    })

    it('should accept optional slug omission', () => {
      const result = SearchConsoleIndexRequestSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should reject slug with special characters', () => {
      const result = SearchConsoleIndexRequestSchema.safeParse({
        slug: 'questoes@invalid#slug',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('letras, números e hífens')
      }
    })

    it('should reject slug above 200 characters', () => {
      const result = SearchConsoleIndexRequestSchema.safeParse({
        slug: 'a'.repeat(201),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('200')
      }
    })
  })

  describe('ResponderRequestSchema', () => {
    it('should accept valid responder data', () => {
      const result = ResponderRequestSchema.safeParse({
        question_id: '2021-87',
        selected_alternative: 'A',
        is_hint_used: false,
      })
      expect(result.success).toBe(true)
    })

    it('should default is_hint_used to false', () => {
      const result = ResponderRequestSchema.safeParse({
        question_id: '2021-87',
        selected_alternative: 'B',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_hint_used).toBe(false)
      }
    })

    it('should reject missing selected_alternative', () => {
      const result = ResponderRequestSchema.safeParse({
        question_id: '2021-87',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('SimuladoSaveRequestSchema', () => {
    it('should accept valid simulado save', () => {
      const result = SimuladoSaveRequestSchema.safeParse({
        test_id: '550e8400-e29b-41d4-a716-446655440000',
        responses: [
          {
            question_id: '2022-45',
            selected_alternative: 'B',
            time_spent_seconds: 120,
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const result = SimuladoSaveRequestSchema.safeParse({
        test_id: 'invalid-uuid',
        responses: [
          {
            question_id: '2022-45',
            selected_alternative: 'B',
            time_spent_seconds: 120,
          },
        ],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('UUID')
      }
    })

    it('should reject empty responses array', () => {
      const result = SimuladoSaveRequestSchema.safeParse({
        test_id: '550e8400-e29b-41d4-a716-446655440000',
        responses: [],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('1 resposta')
      }
    })

    it('should reject responses array above 180', () => {
      const responses = Array(181).fill({
        question_id: '2022-45',
        selected_alternative: 'A',
        time_spent_seconds: 60,
      })
      const result = SimuladoSaveRequestSchema.safeParse({
        test_id: '550e8400-e29b-41d4-a716-446655440000',
        responses,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('180')
      }
    })

    it('should reject time_spent_seconds above 3600', () => {
      const result = SimuladoSaveRequestSchema.safeParse({
        test_id: '550e8400-e29b-41d4-a716-446655440000',
        responses: [
          {
            question_id: '2022-45',
            selected_alternative: 'A',
            time_spent_seconds: 3601,
          },
        ],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('3600')
      }
    })
  })

  describe('formatValidationError', () => {
    it('should format Zod error to structured response', () => {
      const result = AdminUpgradeRequestSchema.safeParse({
        email: 'invalid',
        months: 500,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const formatted = formatValidationError(result.error)
        expect(formatted.code).toBe('VALIDATION_ERROR')
        expect(formatted.message).toContain('Dados inválidos')
        expect(Array.isArray(formatted.details)).toBe(true)
        expect(formatted.details.length).toBeGreaterThan(0)
        expect(formatted.details[0]).toHaveProperty('field')
        expect(formatted.details[0]).toHaveProperty('message')
      }
    })

    it('should include field names in error details', () => {
      const result = ExplicarRequestSchema.safeParse({
        question_id: 'invalid',
        selected_alternative: 'Z',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const formatted = formatValidationError(result.error)
        const fields = formatted.details.map(d => d.field)
        expect(fields).toContain('question_id')
        expect(fields).toContain('selected_alternative')
      }
    })
  })
})

/**
 * MANUAL TESTING WITH CURL
 *
 * Test checkout endpoint:
 * ```bash
 * curl -X POST http://localhost:3000/api/checkout \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer <token>" \
 *   -d '{"plan": "invalid"}'
 *
 * # Expected: 400 with VALIDATION_ERROR
 * ```
 *
 * Test admin upgrade:
 * ```bash
 * curl -X POST http://localhost:3000/api/admin/upgrade \
 *   -H "Content-Type: application/json" \
 *   -H "x-admin-secret: <secret>" \
 *   -d '{"email": "invalid", "months": 500}'
 *
 * # Expected: 400 with validation errors for both fields
 * ```
 *
 * Test explicar:
 * ```bash
 * curl -X POST http://localhost:3000/api/explicar \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer <token>" \
 *   -d '{"question_id": "2022-145", "selected_alternative": "F"}'
 *
 * # Expected: 400 - "Alternativa inválida (A-E)"
 * ```
 *
 * Test corrigir-redacao:
 * ```bash
 * curl -X POST http://localhost:3000/api/corrigir-redacao \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer <token>" \
 *   -d '{"tema": "short", "texto": "way too short"}'
 *
 * # Expected: 400 - texto too short error
 * ```
 *
 * Test simulado/salvar:
 * ```bash
 * curl -X POST http://localhost:3000/api/simulado/salvar \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer <token>" \
 *   -d '{
 *     "test_id": "invalid",
 *     "responses": []
 *   }'
 *
 * # Expected: 400 with test_id UUID error + responses array empty error
 * ```
 */
