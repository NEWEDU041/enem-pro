/**
 * Model Router: Intelligent LLM model selection based on task complexity
 * 
 * Routes between:
 * - claude-haiku-4-5-20251001 (cheap, <500 tokens input/output)
 * - claude-sonnet-5 (expensive, >=500 tokens or reasoning required)
 * 
 * Cost Ratio: Sonnet is ~2x more expensive than Haiku
 * Target: Use Haiku for 70-80% of requests, Sonnet for complex tasks only
 */

export const MODEL_HAIKU = 'claude-haiku-4-5-20251001'
export const MODEL_SONNET = 'claude-sonnet-5'

/**
 * Configuration thresholds for model routing
 */
export const ROUTING_CONFIG = {
  // Input tokens threshold: if estimated input > this, use Sonnet
  INPUT_TOKENS_THRESHOLD: 500,
  
  // Output tokens threshold: if expected output > this, use Sonnet
  OUTPUT_TOKENS_THRESHOLD: 300,
  
  // Total tokens (estimated): if input + output > this, use Sonnet
  TOTAL_TOKENS_THRESHOLD: 800,
  
  // Force Sonnet for tasks requiring reasoning or structured output
  REQUIRES_REASONING: false,
  REQUIRES_JSON: false,
  
  // System prompt length can impact token usage
  SYSTEM_PROMPT_LENGTH_THRESHOLD: 2000,
} as const

/**
 * Estimate token count for text (rough approximation)
 * Uses common rule: 1 token ≈ 4 characters for English
 * For Portuguese: 1 token ≈ 3.5 characters (more verbose)
 */
export function estimateTokens(text: string, language: 'en' | 'pt' = 'pt'): number {
  const charsPerToken = language === 'en' ? 4 : 3.5
  return Math.ceil(text.length / charsPerToken)
}

/**
 * Estimate input tokens for a request
 */
export function estimateInputTokens(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>
): number {
  let totalTokens = 0
  
  // System prompt
  totalTokens += estimateTokens(systemPrompt, 'pt')
  
  // User/assistant messages
  for (const msg of messages) {
    totalTokens += estimateTokens(msg.content, 'pt')
  }
  
  // Overhead: ~50 tokens for message structure/formatting
  totalTokens += 50 * Math.max(1, messages.length)
  
  return totalTokens
}

/**
 * Model routing decision criteria
 */
export interface RoutingDecision {
  model: typeof MODEL_HAIKU | typeof MODEL_SONNET
  estimatedInputTokens: number
  estimatedOutputTokens: number
  totalEstimatedTokens: number
  reason: string
  complexity: 'simple' | 'moderate' | 'complex'
}

/**
 * Main routing function
 */
export function selectModel(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  options: {
    forceModel?: typeof MODEL_HAIKU | typeof MODEL_SONNET
    requiresReasoning?: boolean
    requiresJSON?: boolean
    expectedOutputTokens?: number
  } = {}
): RoutingDecision {
  // If model is explicitly forced, use it
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
  
  // Check decision criteria in order of priority
  
  // 1. Reasoning requirement
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
  
  // 2. JSON requirement (Haiku can handle JSON, but Sonnet is more reliable)
  // For complex JSON schemas, prefer Sonnet
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
  
  // 3. Total token threshold
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
  
  // 4. Input token threshold
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
  
  // 5. Output token threshold
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
  
  // 6. System prompt size (overhead)
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
  
  // Default: use cheaper Haiku for simple tasks
  return {
    model: MODEL_HAIKU,
    estimatedInputTokens: estimatedInput,
    estimatedOutputTokens: estimatedOutput,
    totalEstimatedTokens: totalTokens,
    reason: 'Simple task: all criteria below threshold',
    complexity: 'simple',
  }
}

/**
 * Helper: Create routing decision from raw input
 */
export function routeRequest(
  systemPrompt: string,
  userPrompt: string,
  options: Parameters<typeof selectModel>[2] = {}
): RoutingDecision {
  return selectModel(systemPrompt, [{ role: 'user', content: userPrompt }], options)
}

/**
 * Logging helper for routing decisions
 */
export function logRoutingDecision(decision: RoutingDecision, context?: string): void {
  console.log(
    `[Model Router] ${context ? `${context}: ` : ''}` +
    `Model=${decision.model} ` +
    `Tokens=${decision.totalEstimatedTokens} ` +
    `Complexity=${decision.complexity} ` +
    `Reason=${decision.reason}`
  )
}
