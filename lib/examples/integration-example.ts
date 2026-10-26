/**
 * INTEGRATION EXAMPLE: Using Model Router in enem-pro
 * 
 * This shows how to integrate the model router into an existing API route
 * from: app/api/explicar/route.ts
 */

import Anthropic from '@anthropic-ai/sdk'
import { selectModel, logRoutingDecision } from '@/lib/model-router'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * Example: Generating explanation for a ENEM question
 * Before: Always used Sonnet or a fixed model
 * After: Router decides between Haiku (simple) and Sonnet (complex)
 */
export async function generateQuestionExplanation(
  questionTitle: string,
  alternatives: string[],
  correctAlternative: string,
  userContext?: string
): Promise<{ explanation: string; model: string; complexity: string }> {
  // System prompt
  const systemPrompt = `Você é um expert em ENEM. Sua tarefa é explicar por que a resposta está correta.
Seja claro, conciso e didático. Use linguagem acessível para estudantes do ensino médio.
Máximo 300 caracteres.`

  // Build user message
  const userMessage = `${questionTitle}

Alternativas:
${alternatives.map((a, i) => `${String.fromCharCode(65 + i)}) ${a}`).join('\n')}

Correta: ${correctAlternative}
${userContext ? `\nContexto: ${userContext}` : ''}`

  // Route the model selection
  const routing = selectModel(systemPrompt, [{ role: 'user', content: userMessage }], {
    expectedOutputTokens: 200, // Explanations are ~200 tokens
  })

  logRoutingDecision(routing, 'generateQuestionExplanation')

  // Make API call with routed model
  const response = await anthropic.messages.create({
    model: routing.model,
    max_tokens: 250,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const explanation = response.content[0].type === 'text' ? response.content[0].text : ''

  return {
    explanation,
    model: routing.model.includes('haiku') ? 'haiku' : 'sonnet',
    complexity: routing.complexity,
  }
}

/**
 * Example: Batch generation with routing
 */
export async function generateBatchExplanations(
  questions: Array<{
    id: string
    title: string
    alternatives: string[]
    correctAlternative: string
  }>
) {
  const results = []

  for (const q of questions) {
    try {
      const result = await generateQuestionExplanation(q.title, q.alternatives, q.correctAlternative)

      results.push({
        questionId: q.id,
        explanation: result.explanation,
        model: result.model,
        complexity: result.complexity,
      })

      // Log metrics
      console.log(
        `[Batch] Q${q.id}: model=${result.model} complexity=${result.complexity}`
      )
    } catch (err) {
      console.error(`[Batch] Failed for Q${q.id}:`, err)
      results.push({
        questionId: q.id,
        error: String(err),
      })
    }
  }

  // Summary
  const haikuCount = results.filter(r => r.model === 'haiku').length
  const sonnetCount = results.filter(r => r.model === 'sonnet').length

  console.log(`\n[Batch Summary]`)
  console.log(`  Haiku:  ${haikuCount} (${((haikuCount / results.length) * 100).toFixed(0)}%)`)
  console.log(`  Sonnet: ${sonnetCount} (${((sonnetCount / results.length) * 100).toFixed(0)}%)`)
  console.log(`  Estimated savings: ~${((sonnetCount / results.length) * 50).toFixed(0)}% vs always Sonnet`)

  return results
}

/**
 * Example: Usage in API route
 * 
 * POST /api/explicar
 * Body: { question_id, selected_alternative }
 */
export async function handleExplicarRequest(
  questionId: string,
  selectedAlternative: string
): Promise<{
  explanation: string
  model: string
  complexity: string
  cached: boolean
}> {
  // 1. Check cache first (existing Redis cache)
  // const cached = await getCached('explanation', questionId)
  // if (cached) return { ...cached, cached: true }

  // 2. Fetch question from DB
  // const question = await fetchQuestion(questionId)

  // 3. Generate explanation with routing
  // const result = await generateQuestionExplanation(
  //   question.title,
  //   question.alternatives,
  //   question.correctAlternative,
  //   `Usuário selecionou: ${selectedAlternative}`
  // )

  // 4. Store in cache
  // await setCached('explanation', questionId, result)

  // return { ...result, cached: false }

  return {
    explanation: 'Example explanation',
    model: 'haiku',
    complexity: 'simple',
    cached: false,
  }
}
