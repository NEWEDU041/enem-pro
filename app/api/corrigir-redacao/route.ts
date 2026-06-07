import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { isPro, cleanEnv } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `Você é um corretor especializado do ENEM, avaliando com os critérios exatos do INEP.

Avalie a redação nas 5 competências. Para cada competência, atribua uma nota MÚLTIPLA de 40 (valores válidos: 0, 40, 80, 120, 160 ou 200).

COMPETÊNCIA 1 — Domínio da Língua Escrita
Avalie: gramática, ortografia, concordância, pontuação, sintaxe.

COMPETÊNCIA 2 — Compreensão da Proposta
Avalie: desenvolvimento do tema proposto, sem fuga ou tangenciamento.

COMPETÊNCIA 3 — Seleção e Organização das Informações
Avalie: argumentação, coerência, repertório sociocultural, progressão lógica.

COMPETÊNCIA 4 — Coesão Textual
Avalie: uso de conectivos, referenciação, evitar repetição, fluidez.

COMPETÊNCIA 5 — Proposta de Intervenção
Avalie: deve conter agente + ação + meio/modo + finalidade + efeito. Se faltar algum elemento, reduz a nota.

Para cada competência:
- Cite um trecho específico da redação (entre aspas)
- Aponte o que está bom e o que precisa melhorar
- Dê uma nota (0, 40, 80, 120, 160 ou 200)

Ao FINAL da análise, inclua EXATAMENTE este bloco (não mude o formato):

---SCORES---
C1: [NOTA]
C2: [NOTA]
C3: [NOTA]
C4: [NOTA]
C5: [NOTA]
TOTAL: [SOMA]
---END---`

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const body = await request.json()
  const { tema, texto } = body as { tema?: string; texto?: string }

  if (!texto || texto.trim().length < 200) {
    return Response.json({ error: 'Redação muito curta (mínimo 200 caracteres)' }, { status: 400 })
  }
  if (texto.length > 6000) {
    return Response.json({ error: 'Redação muito longa (máximo 6000 caracteres)' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: sub } = await supabase.from('subscriptions').select('plan, expires_at').eq('user_id', userId).maybeSingle()
  const userIsPro = isPro(sub)

  if (!userIsPro) {
    const { count } = await supabase
      .from('redacao_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if ((count ?? 0) >= 1) {
      return Response.json({ error: 'Plano Pro necessário', freeUsed: true }, { status: 403 })
    }
  }

  const anthropic = new Anthropic({ apiKey: cleanEnv(process.env.ANTHROPIC_API_KEY) })

  const streamResponse = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `TEMA: ${tema?.trim() || 'Não informado'}\n\nREDAÇÃO:\n${texto.trim()}`,
    }],
  })

  // Fire-and-forget: save submission (void discards the PromiseLike)
  void supabase.from('redacao_submissions').insert({
    user_id: userId,
    tema: tema?.trim() ?? '',
    texto: texto.trim(),
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
      } catch {
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
