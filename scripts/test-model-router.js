/**
 * Model Router Test Report
 * Generated output showing routing decisions and metrics
 */

const MODEL_HAIKU = 'claude-haiku-4-5-20251001'
const MODEL_SONNET = 'claude-sonnet-5'

const ROUTING_CONFIG = {
  INPUT_TOKENS_THRESHOLD: 500,
  OUTPUT_TOKENS_THRESHOLD: 300,
  TOTAL_TOKENS_THRESHOLD: 800,
  SYSTEM_PROMPT_LENGTH_THRESHOLD: 2000,
}

// Rough token estimator
function estimateTokens(text, language = 'pt') {
  const charsPerToken = language === 'en' ? 4 : 3.5
  return Math.ceil(text.length / charsPerToken)
}

function estimateInputTokens(systemPrompt, messages) {
  let totalTokens = 0
  totalTokens += estimateTokens(systemPrompt, 'pt')
  for (const msg of messages) {
    totalTokens += estimateTokens(msg.content, 'pt')
  }
  totalTokens += 50 * Math.max(1, messages.length)
  return totalTokens
}

function selectModel(systemPrompt, messages, options = {}) {
  if (options.forceModel) {
    const estimatedInput = estimateInputTokens(systemPrompt, messages)
    const estimatedOutput = options.expectedOutputTokens ?? 200
    return {
      model: options.forceModel,
      estimatedInputTokens: estimatedInput,
      estimatedOutputTokens: estimatedOutput,
      totalEstimatedTokens: estimatedInput + estimatedOutput,
      reason: 'Model forced via options',
      complexity: options.forceModel === MODEL_SONNET ? 'complex' : 'simple',
    }
  }

  const estimatedInput = estimateInputTokens(systemPrompt, messages)
  const estimatedOutput = options.expectedOutputTokens ?? 200
  const totalTokens = estimatedInput + estimatedOutput

  if (options.requiresReasoning) {
    return {
      model: MODEL_SONNET,
      estimatedInputTokens: estimatedInput,
      estimatedOutputTokens: estimatedOutput,
      totalEstimatedTokens: totalTokens,
      reason: 'Requires reasoning capability',
      complexity: 'complex',
    }
  }

  if (options.requiresJSON && estimatedOutput > 500) {
    return {
      model: MODEL_SONNET,
      estimatedInputTokens: estimatedInput,
      estimatedOutputTokens: estimatedOutput,
      totalEstimatedTokens: totalTokens,
      reason: 'Complex JSON output requires Sonnet',
      complexity: 'complex',
    }
  }

  if (totalTokens > ROUTING_CONFIG.TOTAL_TOKENS_THRESHOLD) {
    return {
      model: MODEL_SONNET,
      estimatedInputTokens: estimatedInput,
      estimatedOutputTokens: estimatedOutput,
      totalEstimatedTokens: totalTokens,
      reason: `Total tokens (${totalTokens}) exceeds threshold`,
      complexity: 'complex',
    }
  }

  if (estimatedInput > ROUTING_CONFIG.INPUT_TOKENS_THRESHOLD) {
    return {
      model: MODEL_SONNET,
      estimatedInputTokens: estimatedInput,
      estimatedOutputTokens: estimatedOutput,
      totalEstimatedTokens: totalTokens,
      reason: `Input tokens (${estimatedInput}) exceeds threshold`,
      complexity: 'moderate',
    }
  }

  if (estimatedOutput > ROUTING_CONFIG.OUTPUT_TOKENS_THRESHOLD) {
    return {
      model: MODEL_SONNET,
      estimatedInputTokens: estimatedInput,
      estimatedOutputTokens: estimatedOutput,
      totalEstimatedTokens: totalTokens,
      reason: `Output tokens (${estimatedOutput}) exceeds threshold`,
      complexity: 'moderate',
    }
  }

  if (estimateTokens(systemPrompt, 'pt') > ROUTING_CONFIG.SYSTEM_PROMPT_LENGTH_THRESHOLD) {
    return {
      model: MODEL_SONNET,
      estimatedInputTokens: estimatedInput,
      estimatedOutputTokens: estimatedOutput,
      totalEstimatedTokens: totalTokens,
      reason: `System prompt too large (${estimateTokens(systemPrompt, 'pt')} tokens)`,
      complexity: 'moderate',
    }
  }

  return {
    model: MODEL_HAIKU,
    estimatedInputTokens: estimatedInput,
    estimatedOutputTokens: estimatedOutput,
    totalEstimatedTokens: totalTokens,
    reason: 'Simple task: all criteria below threshold',
    complexity: 'simple',
  }
}

// Test cases
const TEST_CASES = [
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

CHANNEL DNA:
- Melhor hook: "Voce não vai acreditar nessa descoberta..."
- Melhor formato: Shorts com transições rápidas

Retorne JSON...`,
    userPrompt:
      'Niche: "IA e automação". Gere 3 vídeos para a semana. Cada um com title, hook, key_points, voiceover_outline, safety_score, upload_package completo.',
    expectedModel: 'sonnet',
    options: { requiresJSON: true, expectedOutputTokens: 1200 },
  },
  {
    name: 'Trend analysis (simple)',
    system: 'Você analisa trends do Reddit/HN e identifica oportunidades.',
    userPrompt: 'Analise esses 3 trending topics:\n1. GPT-5\n2. Claude API pricing\n3. Open-source LLM',
    expectedModel: 'haiku',
    options: { requiresJSON: false, expectedOutputTokens: 250 },
  },
  {
    name: 'Script generation (long-form)',
    system:
      'Você é um roteirista expert. Cria roteiros estruturados com timing, beat-sheets e visuais.',
    userPrompt:
      'Crie um roteiro de 10 minutos sobre "Como usar Claude API for Production". Inclua: introducao, 4 sections, conclusao, CTA. Especifique timing.',
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

// Run tests
console.log('\n' + '='.repeat(60))
console.log('   MODEL ROUTER TEST REPORT - Cost Optimization')
console.log('='.repeat(60) + '\n')

const results = []
let haikuCount = 0
let sonnetCount = 0
let correctCount = 0
const inputTokens = []
const outputTokens = []

for (const test of TEST_CASES) {
  const decision = selectModel(test.system, [{ role: 'user', content: test.userPrompt }], test.options)

  const isCorrect = (decision.model === MODEL_HAIKU && test.expectedModel === 'haiku') || 
                    (decision.model === MODEL_SONNET && test.expectedModel === 'sonnet')

  const modelName = decision.model.includes('haiku') ? 'HAIKU' : 'SONNET'
  const checkmark = isCorrect ? '✅' : '❌'

  console.log(`\n📋 Test: ${test.name}`)
  console.log(`   Expected: ${test.expectedModel.toUpperCase()} | Selected: ${modelName} ${checkmark}`)
  console.log(`   Complexity: ${decision.complexity} | Tokens (in/out/total): ${decision.estimatedInputTokens}/${decision.estimatedOutputTokens}/${decision.totalEstimatedTokens}`)
  console.log(`   Reason: ${decision.reason}`)

  if (decision.model === MODEL_HAIKU) haikuCount++
  else sonnetCount++
  if (isCorrect) correctCount++

  inputTokens.push(decision.estimatedInputTokens)
  outputTokens.push(decision.estimatedOutputTokens)

  results.push({
    name: test.name.slice(0, 35),
    expected: test.expectedModel.toUpperCase(),
    selected: modelName,
    correct: isCorrect,
    inputTokens: decision.estimatedInputTokens,
    outputTokens: decision.estimatedOutputTokens,
    complexity: decision.complexity,
  })
}

// Summary
const avgInput = Math.round(inputTokens.reduce((a, b) => a + b) / inputTokens.length)
const avgOutput = Math.round(outputTokens.reduce((a, b) => a + b) / outputTokens.length)
const minInput = Math.min(...inputTokens)
const maxInput = Math.max(...inputTokens)
const minOutput = Math.min(...outputTokens)
const maxOutput = Math.max(...outputTokens)
const accuracy = ((correctCount / TEST_CASES.length) * 100).toFixed(0)
const haikuPercent = ((haikuCount / TEST_CASES.length) * 100).toFixed(0)
const sonnetPercent = ((sonnetCount / TEST_CASES.length) * 100).toFixed(0)

console.log('\n' + '='.repeat(60))
console.log('SUMMARY')
console.log('='.repeat(60))
console.log(`✅ Routing Accuracy: ${correctCount}/${TEST_CASES.length} (${accuracy}%)`)
console.log(`📊 Model Distribution:`)
console.log(`   - Haiku: ${haikuCount} routes (${haikuPercent}%) — cheaper, suitable for simple tasks`)
console.log(`   - Sonnet: ${sonnetCount} routes (${sonnetPercent}%) — capable, needed for complex tasks`)

console.log(`\n📈 Token Statistics:`)
console.log(`   Input Tokens:  min=${minInput}, avg=${avgInput}, max=${maxInput}`)
console.log(`   Output Tokens: min=${minOutput}, avg=${avgOutput}, max=${maxOutput}`)

// Cost calculation (Haiku: $1/1M input, Sonnet: $2/1M input)
const totalTokens = inputTokens.reduce((a, b) => a + b)
const avgCostPerToken_Always_Sonnet = (totalTokens / 1_000_000) * 2.00  // $2 per 1M
const haikuTokens = inputTokens.slice(0, haikuCount).reduce((a, b) => a + b, 0)
const sonnetTokens = inputTokens.slice(haikuCount).reduce((a, b) => a + b, 0)
const avgCostPerToken_Routed = (haikuTokens / 1_000_000) * 1.00 + (sonnetTokens / 1_000_000) * 2.00

const savings = ((avgCostPerToken_Always_Sonnet - avgCostPerToken_Routed) / avgCostPerToken_Always_Sonnet * 100).toFixed(1)

console.log(`\n💰 Cost Analysis (based on 1M tokens):`)
console.log(`   Always use Sonnet: $${avgCostPerToken_Always_Sonnet.toFixed(4)}`)
console.log(`   With Router: $${avgCostPerToken_Routed.toFixed(4)}`)
console.log(`   Savings: ${savings}% 🎯`)

console.log(`\n⚙️  Configuration Thresholds:`)
console.log(`   INPUT_TOKENS_THRESHOLD: ${ROUTING_CONFIG.INPUT_TOKENS_THRESHOLD}`)
console.log(`   OUTPUT_TOKENS_THRESHOLD: ${ROUTING_CONFIG.OUTPUT_TOKENS_THRESHOLD}`)
console.log(`   TOTAL_TOKENS_THRESHOLD: ${ROUTING_CONFIG.TOTAL_TOKENS_THRESHOLD}`)
console.log(`   SYSTEM_PROMPT_LENGTH_THRESHOLD: ${ROUTING_CONFIG.SYSTEM_PROMPT_LENGTH_THRESHOLD}`)

console.log(`\n📋 Detailed Test Results:`)
console.log('\n| Test | Expected | Selected | Result | Input Toks | Complexity |')
console.log('|------|----------|----------|--------|------------|------------|')
for (const r of results) {
  const result = r.correct ? '✅' : '❌'
  console.log(
    `| ${r.name.padEnd(35)} | ${r.expected} | ${r.selected.padEnd(7)} | ${result} | ${String(r.inputTokens).padStart(10)} | ${r.complexity.padEnd(10)} |`
  )
}

console.log('\n' + '='.repeat(60))
console.log('END REPORT')
console.log('='.repeat(60) + '\n')
