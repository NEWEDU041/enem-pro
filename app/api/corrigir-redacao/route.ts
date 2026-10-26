import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { isPro, cleanEnv } from '@/lib/utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { PROMPTS } from '@/lib/ai-prompts'
import { initLogContext, createRequestLogger, logSuccess, logError, logEvent } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const logContext = initLogContext(request)
  const logger = createRequestLogger(logContext)
  
  const auth = await requireAuth(request)
  if (!auth.ok) {
    logError(logger, logContext, {
      status: 401,
      endpoint: '/api/corrigir-redacao',
      error: 'Authentication failed',
    })
    return auth.response
  }
  const { userId } = auth
  logContext.userId = userId

  const body = await request.json()
  const { tema, texto } = body as { tema?: string; texto?: string }

  if (!texto || texto.trim().length < 200) {
    logError(logger, logContext, {
      status: 400,
      endpoint: '/api/corrigir-redacao',
      error: 'Text too short',
      metadata: { textLength: texto?.length || 0 },
    })
    return Response.json({ error: 'Redação muito curta (mínimo 200 caracteres)' }, { status: 400 })
  }
  if (texto.length > 6000) {
    logError(logger, logContext, {
      status: 400,
      endpoint: '/api/corrigir-redacao',
      error: 'Text too long',
      metadata: { textLength: texto.length },
    })
    return Response.json({ error: 'Redação muito longa (máximo 6000 caracteres)' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: sub } = await supabase.from('subscriptions').select('plan, expires_at').eq('user_id', userId).maybeSingle()
  const userIsPro = isPro(sub)

  const rl = await checkRateLimit(userId, supabase, userIsPro)
  if (!rl.ok) {
    logError(logger, logContext, {
      status: 429,
      endpoint: '/api/corrigir-redacao',
      error: 'Rate limit exceeded',
      metadata: { retryAfterMs: rl.retryAfterMs },
    })
    return Response.json(
      { error: 'Muitas requisições. Aguarde alguns segundos.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    )
  }

  if (!userIsPro) {
    const { count } = await supabase
      .from('redacao_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if ((count ?? 0) >= 1) {
      logError(logger, logContext, {
        status: 403,
        endpoint: '/api/corrigir-redacao',
        error: 'Free trial used',
      })
      return Response.json({ error: 'Plano Pro necessário', freeUsed: true }, { status: 403 })
    }
  }

  const anthropic = new Anthropic({ apiKey: cleanEnv(process.env.ANTHROPIC_API_KEY) })

  const streamResponse = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    system: PROMPTS.GRADE_ESSAY,
    messages: [{
      role: 'user',
      content: `TEMA: ${tema?.trim() || 'N/A'}\n\nREDAÇÃO:\n${texto.trim()}`,
    }],
  })

  // Fire-and-forget: save submission. `void` alone never triggers the
  // PostgrestBuilder's lazy thenable — it must be awaited or `.then()`'d.
  supabase.from('redacao_submissions').insert({
    user_id: userId,
    tema: tema?.trim() ?? '',
    texto: texto.trim(),
  }).then(({ error }) => {
    if (error) {
      logError(logger, logContext, {
        status: 500,
        endpoint: '/api/corrigir-redacao',
        error: 'Failed to save submission',
        metadata: { supabaseError: error.message },
      })
    }
  })

  const enc = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamResponse) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(enc.encode(event.delta.text))
          }
        }
        logSuccess(logger, logContext, {
          status: 200,
          endpoint: '/api/corrigir-redacao',
          message: 'Essay grading streamed successfully',
        })
      } catch (e) {
        logError(logger, logContext, {
          status: 500,
          endpoint: '/api/corrigir-redacao',
          error: e instanceof Error ? e : new Error(String(e)),
          metadata: { stream: true },
        })
        controller.error(new Error('Stream error'))
      } finally {
        controller.close()
      }
    },
    cancel() {
      streamResponse.abort()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}
