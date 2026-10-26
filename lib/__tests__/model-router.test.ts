/**
 * Model Router Test Suite
 * 
 * Tests routing decisions with various input complexities
 * Generates metrics report showing:
 * - Routing decisions (model selected, reason, complexity)
 * - Token estimations
 * - Cost implications
 */

import {
  selectModel,
  routeRequest,
  estimateTokens,
  estimateInputTokens,
  MODEL_HAIKU,
  MODEL_SONNET,
  ROUTING_CONFIG,
} from './model-router'

interface TestCase {
  name: string
  system: string
  userPrompt: string
  expectedModel: 'haiku' | 'sonnet'
  options?: {
    requiresReasoning?: boolean
    requiresJSON?: boolean
    expectedOutputTokens?: number
  }
}

const TEST_CASES: TestCase[] = [
  {
    name: 'Simple explanation (ENEM question)',
    system: 'Você é um expert em ENEM. Explique a resposta de forma clara e concisa.',
    userPrompt:
      'Por que a alternativa B é correta para: "A fotossíntese é o processo de..."',
    expectedModel: 'haiku',
  },
  {
    name: 'Complex content plan (YouTube autopilot)',
    system: `Você é o YouTube OS Auto-Pilot. Gere um plano semanal completo de vídeos Shorts (30-60s) para o nicho especificado.
     
TRENDS IDENTIFICADOS:
- IA generativa impulsiona market de $XX bilhões (HackerNews, score 500)
- Tutorial "Como treinar modelo com LoRA" (Reddit, score 450)
- GitHub trending: fastapi-llm-proxy (750 stars)

CHANNEL DNA:
- Melhor hook: "Voce não vai acreditar nessa descoberta..."
- Melhor thumbnail: Thumbnail dramática com seta apontando
- Melhor slot: Terças 18h
- Melhor formato: Shorts com transições rápidas
- Top insight: Thumbnails com contraste alto convertem 3x mais

PADRÕES VENCEDORES:
- Pattern 1: Hook de curiosidade (+45%)
- Pattern 2: Call-to-action ao minuto 1 (+30%)

Retorne JSON EXATO sem markdown...`,
    userPrompt:
      'Niche: "IA e automação para pequenos negócios". Gere 3 vídeos para a semana de 26-30 de outubro. Cada um com: title, hook, key_points, voiceover_outline, safety_score, upload_package completo.',
    expectedModel: 'sonnet',
    options: { requiresJSON: true, expectedOutputTokens: 1200 },
  },
  {
    name: 'Trend analysis (simple)',
    system: 'Você analisa trends do Reddit/HN e identifica oportunidades.',
    userPrompt: 'Analise esses 3 trending topics e sugira um ângulo de conteúdo:\n1. GPT-5 release speculation\n2. Claude API pricing changes\n3. Open-source LLM benchmarks',
    expectedModel: 'haiku',
    options: { requiresJSON: false, expectedOutputTokens: 250 },
  },
  {
    name: 'Script generation (long-form)',
    system:
      'Você é um roteirista expert em vídeos educacionais. Cria roteiros estruturados com timing, beat-sheets e visuais.',
    userPrompt:
      'Crie um roteiro de 10 minutos sobre "Como usar Claude API for Production". Inclua: introducao, 4 principais sections, conclusao, call-to-action. Especifique timing para cada beat.',
    expectedModel: 'sonnet',
    options: { expectedOutputTokens: 1500 },
  },
  {
    name: 'Thumbnail description',
    system: 'Você descreve thumbnails de vídeo para estoque de imagens.',
    userPrompt: 'Descreva uma thumbnail para um vídeo sobre "5 truques de produtividade".',
    expectedModel: 'haiku',
    options: { expectedOutputTokens: 100 },
  },
]

/**
 * Run tests and generate report
 */
export async function runModelRouterTests(): Promise<void> {
  console.log('=== Model Router Test Suite ===\n')

  const results: any[] = []
  let haikuCount = 0
  let sonnetCount = 0
  let correctCount = 0
  const tokenStats = {
    minInput: Infinity,
    maxInput: 0,
    avgInput: 0,
    minOutput: Infinity,
    maxOutput: 0,
    avgOutput: 0,
  }
  const inputTokens: number[] = []
  const outputTokens: number[] = []

  for (const test of TEST_CASES) {
    const decision = selectModel(test.system, [{ role: 'user', content: test.userPrompt }], test.options)

    const isCorrect = (decision.model === MODEL_HAIKU && test.expectedModel === 'haiku') || 
                      (decision.model === MODEL_SONNET && test.expectedModel === 'sonnet')

    console.log(`\n📋 Test: ${test.name}`)
    console.log(`   Expected: ${test.expectedModel.toUpperCase()}`)
    console.log(`   Selected: ${decision.model.includes('haiku') ? 'HAIKU' : 'SONNET'} ${isCorrect ? '✅' : '❌'}`)
    console.log(`   Complexity: ${decision.complexity}`)
    console.log(`   Tokens: input=${decision.estimatedInputTokens} output=${decision.estimatedOutputTokens} total=${decision.totalEstimatedTokens}`)
    console.log(`   Reason: ${decision.reason}`)

    if (decision.model === MODEL_HAIKU) haikuCount++
    else sonnetCount++
    if (isCorrect) correctCount++

    inputTokens.push(decision.estimatedInputTokens)
    outputTokens.push(decision.estimatedOutputTokens)

    results.push({
      test: test.name,
      expected: test.expectedModel,
      selected: decision.model.includes('haiku') ? 'haiku' : 'sonnet',
      correct: isCorrect,
      ...decision,
    })
  }

  // Calculate token stats
  tokenStats.avgInput = inputTokens.reduce((a, b) => a + b) / inputTokens.length
  tokenStats.minInput = Math.min(...inputTokens)
  tokenStats.maxInput = Math.max(...inputTokens)

  tokenStats.avgOutput = outputTokens.reduce((a, b) => a + b) / outputTokens.length
  tokenStats.minOutput = Math.min(...outputTokens)
  tokenStats.maxOutput = Math.max(...outputTokens)

  // Summary
  console.log('\n\n=== Summary ===')
  console.log(`✅ Correct predictions: ${correctCount}/${TEST_CASES.length} (${((correctCount / TEST_CASES.length) * 100).toFixed(0)}%)`)
  console.log(`📊 Model Distribution: Haiku=${haikuCount} (${((haikuCount / TEST_CASES.length) * 100).toFixed(0)}%), Sonnet=${sonnetCount}`)
  console.log(`\n📈 Token Statistics:`)
  console.log(`   Input: min=${tokenStats.minInput}, avg=${Math.round(tokenStats.avgInput)}, max=${tokenStats.maxInput}`)
  console.log(`   Output: min=${tokenStats.minOutput}, avg=${Math.round(tokenStats.avgOutput)}, max=${tokenStats.maxOutput}`)

  // Cost estimate (as of 2026)
  const haikuInputCost = 0.001 * (haikuCount / TEST_CASES.length) // $1 per 1M tokens
  const sonnetInputCost = 0.002 * (sonnetCount / TEST_CASES.length) // $2 per 1M tokens

  console.log(`\n💰 Estimated Cost (per 1M tokens):`)
  console.log(`   Haiku avg input: ~$${haikuInputCost.toFixed(4)}`)
  console.log(`   Sonnet avg input: ~$${sonnetInputCost.toFixed(4)}`)
  console.log(`   Savings: ${((1 - haikuInputCost / (haikuInputCost + sonnetInputCost)) * 100).toFixed(0)}% vs always using Sonnet`)

  console.log(`\n🎯 Configuration:`)
  console.log(`   INPUT_TOKENS_THRESHOLD: ${ROUTING_CONFIG.INPUT_TOKENS_THRESHOLD}`)
  console.log(`   OUTPUT_TOKENS_THRESHOLD: ${ROUTING_CONFIG.OUTPUT_TOKENS_THRESHOLD}`)
  console.log(`   TOTAL_TOKENS_THRESHOLD: ${ROUTING_CONFIG.TOTAL_TOKENS_THRESHOLD}`)
  console.log(`   SYSTEM_PROMPT_LENGTH_THRESHOLD: ${ROUTING_CONFIG.SYSTEM_PROMPT_LENGTH_THRESHOLD}`)

  // Detailed results table
  console.log('\n\n=== Detailed Results ===')
  console.table(
    results.map(r => ({
      Test: r.test.slice(0, 30),
      Expected: r.expected.toUpperCase(),
      Selected: r.selected.toUpperCase(),
      Result: r.correct ? '✅' : '❌',
      'Input Tokens': r.estimatedInputTokens,
      'Output Tokens': r.estimatedOutputTokens,
      Complexity: r.complexity,
    }))
  )

  console.log('\n=== End Test Suite ===')
}

// Run if executed directly
if (require.main === module) {
  runModelRouterTests().catch(console.error)
}
