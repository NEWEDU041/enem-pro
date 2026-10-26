/**
 * Central Zod validation schemas for critical API endpoints
 * Validates types, lengths, formats (email, URL)
 * Returns clear 400 error messages when validation fails
 */

import { z } from 'zod'

// ============================================
// Common Reusable Schemas
// ============================================

export const EmailSchema = z
  .string()
  .min(1, 'Email obrigatório')
  .email('Email inválido')
  .max(254, 'Email muito longo (máx 254 caracteres)')
  .toLowerCase()

export const UrlSchema = z
  .string()
  .url('URL inválida')
  .max(2048, 'URL muito longa (máx 2048 caracteres)')

export const QuestionIdSchema = z
  .string()
  .regex(/^\d{4}-\d+$/, 'question_id inválido (formato: AAAA-NNN)')

export const AlternativeSchema = z
  .string()
  .regex(/^[A-E]$/, 'Alternativa inválida (A-E)')

// ============================================
// Checkout Endpoint
// ============================================

export const CheckoutRequestSchema = z.object({
  plan: z
    .enum(['monthly', 'annual'], {
      errorMap: () => ({ message: 'Plan deve ser "monthly" ou "annual"' }),
    })
    .optional()
    .default('monthly'),
})

export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>

// ============================================
// Admin Upgrade Endpoint
// ============================================

export const AdminUpgradeRequestSchema = z.object({
  email: EmailSchema,
  months: z
    .number()
    .int('Months deve ser um inteiro')
    .min(1, 'Months mínimo: 1')
    .max(120, 'Months máximo: 120')
    .optional()
    .default(1),
})

export type AdminUpgradeRequest = z.infer<typeof AdminUpgradeRequestSchema>

// ============================================
// Explicar Endpoint
// ============================================

export const ExplicarRequestSchema = z.object({
  question_id: QuestionIdSchema.optional(),
  selected_alternative: AlternativeSchema.optional(),
})

export type ExplicarRequest = z.infer<typeof ExplicarRequestSchema>

// ============================================
// Corrigir Redação Endpoint
// ============================================

export const CorrigirRedacaoRequestSchema = z.object({
  tema: z
    .string()
    .max(500, 'Tema muito longo (máx 500 caracteres)')
    .optional()
    .default(''),
  texto: z
    .string()
    .min(1, 'Texto obrigatório')
    .min(200, 'Redação muito curta (mínimo 200 caracteres)')
    .max(6000, 'Redação muito longa (máximo 6000 caracteres)'),
})

export type CorrigirRedacaoRequest = z.infer<typeof CorrigirRedacaoRequestSchema>

// ============================================
// Email Drip Endpoint
// ============================================

export const DripDaySchema = z
  .number()
  .int('drip_day deve ser um inteiro')
  .min(0, 'drip_day mínimo: 0')
  .max(365, 'drip_day máximo: 365')

export const EmailDripRequestSchema = z.object({
  drip_day: DripDaySchema,
})

export type EmailDripRequest = z.infer<typeof EmailDripRequestSchema>

// ============================================
// Search Console Index Endpoint
// ============================================

export const SearchConsoleIndexRequestSchema = z.object({
  slug: z
    .string()
    .max(200, 'Slug muito longo (máx 200 caracteres)')
    .regex(/^[a-z0-9\-]+$/, 'Slug deve conter apenas letras, números e hífens')
    .optional(),
})

export type SearchConsoleIndexRequest = z.infer<typeof SearchConsoleIndexRequestSchema>

// ============================================
// Portal Admin Endpoint (Generic)
// ============================================

export const PortalAdminActionSchema = z
  .enum(['list', 'get', 'update', 'delete', 'create'], {
    errorMap: () => ({ message: 'Action inválida' }),
  })

export const PortalAdminRequestSchema = z.object({
  action: PortalAdminActionSchema,
  resource: z
    .string()
    .min(1, 'Resource obrigatório')
    .max(100, 'Resource muito longo')
    .optional(),
  id: z
    .string()
    .uuid('ID deve ser um UUID válido')
    .optional(),
  data: z.record(z.unknown()).optional(),
})

export type PortalAdminRequest = z.infer<typeof PortalAdminRequestSchema>

// ============================================
// Newsletter Subscribe Endpoint
// ============================================

export const NewsletterSubscribeSchema = z.object({
  email: EmailSchema,
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo (máx 100 caracteres)')
    .optional()
    .default(''),
})

export type NewsletterSubscribeRequest = z.infer<typeof NewsletterSubscribeSchema>

// ============================================
// Responder (Question Answer) Endpoint
// ============================================

export const ResponderRequestSchema = z.object({
  question_id: QuestionIdSchema,
  selected_alternative: AlternativeSchema,
  is_hint_used: z
    .boolean()
    .optional()
    .default(false),
})

export type ResponderRequest = z.infer<typeof ResponderRequestSchema>

// ============================================
// Batch Responder Endpoint
// ============================================

export const BatchResponderRequestSchema = z.object({
  responses: z
    .array(ResponderRequestSchema)
    .min(1, 'Pelo menos 1 resposta obrigatória')
    .max(100, 'Máximo 100 respostas por requisição'),
})

export type BatchResponderRequest = z.infer<typeof BatchResponderRequestSchema>

// ============================================
// Simulado (Simulation) Save Endpoint
// ============================================

export const SimuladoSaveRequestSchema = z.object({
  test_id: z
    .string()
    .uuid('test_id deve ser um UUID válido'),
  responses: z
    .array(
      z.object({
        question_id: QuestionIdSchema,
        selected_alternative: AlternativeSchema,
        time_spent_seconds: z
          .number()
          .int('time_spent_seconds deve ser um inteiro')
          .min(0, 'time_spent_seconds mínimo: 0')
          .max(3600, 'time_spent_seconds máximo: 3600 (1 hora por questão)'),
      })
    )
    .min(1, 'Pelo menos 1 resposta obrigatória')
    .max(180, 'Máximo 180 respostas por simulado'),
  completed_at: z
    .string()
    .datetime('completed_at deve ser um ISO string válido')
    .optional(),
})

export type SimuladoSaveRequest = z.infer<typeof SimuladoSaveRequestSchema>

// ============================================
// Webhook Endpoint
// ============================================

export const WebhookEventSchema = z
  .enum(['subscription.created', 'subscription.updated', 'payment.completed', 'payment.failed'], {
    errorMap: () => ({ message: 'Event type inválido' }),
  })

export const WebhookRequestSchema = z.object({
  event: WebhookEventSchema,
  timestamp: z
    .string()
    .datetime('timestamp deve ser um ISO string válido'),
  data: z.record(z.unknown()),
  signature: z
    .string()
    .min(40, 'Signature inválida')
    .max(500, 'Signature muito longa'),
})

export type WebhookRequest = z.infer<typeof WebhookRequestSchema>

// ============================================
// Cron Authorization Schema
// ============================================

export const CronAuthSchema = z.object({
  authorization: z
    .string()
    .regex(/^Bearer\s+.+$/, 'Authorization header inválido (formato: Bearer <token>)'),
})

// ============================================
// Validation Error Formatter
// ============================================

export function formatValidationError(error: z.ZodError): {
  code: 'VALIDATION_ERROR'
  message: string
  details: Array<{ field: string; message: string }>
} {
  const details = error.issues.map((issue) => ({
    field: issue.path.join('.') || 'unknown',
    message: issue.message,
  }))

  return {
    code: 'VALIDATION_ERROR',
    message: 'Dados inválidos. Verifique os campos marcados abaixo.',
    details,
  }
}

// ============================================
// Middleware Helper
// ============================================

export async function validateRequestBody<T extends z.ZodSchema>(
  request: Request,
  schema: T
): Promise<
  | { ok: true; data: z.infer<T> }
  | { ok: false; error: ReturnType<typeof formatValidationError> }
> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return {
        ok: false,
        error: formatValidationError(result.error),
      }
    }

    return { ok: true, data: result.data }
  } catch (e) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'JSON inválido no corpo da requisição',
        details: [{ field: 'body', message: e instanceof Error ? e.message : 'Unknown error' }],
      },
    }
  }
}

// ============================================
// Query Parameter Validation
// ============================================

export function validateQueryParams<T extends z.ZodSchema>(
  searchParams: URLSearchParams,
  schema: T
): 
  | { ok: true; data: z.infer<T> }
  | { ok: false; error: ReturnType<typeof formatValidationError> } {
  const params = Object.fromEntries(searchParams)
  const result = schema.safeParse(params)

  if (!result.success) {
    return {
      ok: false,
      error: formatValidationError(result.error),
    }
  }

  return { ok: true, data: result.data }
}
