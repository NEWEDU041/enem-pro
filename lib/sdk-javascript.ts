/**
 * ENEM Pro JavaScript SDK
 * Complete client library for interacting with the ENEM Pro API
 *
 * Installation:
 *   npm install @enem-pro/sdk
 *
 * Usage:
 *   import ENEMPro from '@enem-pro/sdk'
 *   const client = new ENEMPro({ apiKey: 'your-api-key' })
 */

export interface ENEMProClientConfig {
  apiKey: string
  baseURL?: string
  timeout?: number
}

export interface Question {
  id: string
  text: string
  alternatives: Array<{ label: string; text: string }>
  correct_answer: string
  year: number
  discipline: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface ExplanationResponse {
  explanation: string
  cached: boolean
  cache_source: 'redis' | 'database' | 'generated'
  latency_ms: number
}

export interface EssayCorrectionResponse {
  score: number
  feedback: string
  suggestions: string[]
  latency_ms: number
}

export interface SimulationResult {
  simulation_id: string
  score: number
  correct_answers: number
  total_answers: number
}

export class ENEMProSDK {
  private apiKey: string
  private baseURL: string
  private timeout: number

  constructor(config: ENEMProClientConfig) {
    this.apiKey = config.apiKey
    this.baseURL = config.baseURL || 'https://enem-pro.com/api'
    this.timeout = config.timeout || 30000
  }

  private async request<T>(
    method: string,
    path: string,
    data?: Record<string, any>
  ): Promise<T> {
    const url = `${this.baseURL}${path}`
    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (data) {
      options.body = JSON.stringify(data)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Questions API
   */
  questions = {
    list: async (options?: { year?: number; discipline?: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams()
      if (options?.year) params.set('year', String(options.year))
      if (options?.discipline) params.set('discipline', options.discipline)
      if (options?.page) params.set('page', String(options.page))
      if (options?.limit) params.set('limit', String(options.limit))

      const query = params.toString() ? `?${params.toString()}` : ''
      return this.request<{ questions: Question[]; total: number; page: number; limit: number }>(
        'GET',
        `/questoes${query}`
      )
    },

    get: async (questionId: string) => {
      return this.request<Question>('GET', `/questoes/${questionId}`)
    },
  }

  /**
   * Explanations API
   */
  explanations = {
    generate: async (questionId: string, selectedAlternative?: string) => {
      return this.request<ExplanationResponse>('POST', '/explicar', {
        question_id: questionId,
        selected_alternative: selectedAlternative,
      })
    },
  }

  /**
   * Essays API
   */
  essays = {
    correct: async (essayText: string, theme?: string) => {
      return this.request<EssayCorrectionResponse>('POST', '/corrigir-redacao', {
        essay_text: essayText,
        theme,
      })
    },
  }

  /**
   * Simulations API
   */
  simulations = {
    save: async (answers: Record<string, string>, simulationName?: string) => {
      return this.request<SimulationResult>('POST', '/simulado/salvar', {
        answers,
        simulation_name: simulationName,
      })
    },
  }

  /**
   * Health Check
   */
  health = {
    check: async () => {
      return this.request<any>('GET', '/health')
    },
  }
}

export default ENEMProSDK

/**
 * Example usage:
 *
 * import ENEMPro from '@enem-pro/sdk'
 *
 * const client = new ENEMPro({ apiKey: 'sk_live_...' })
 *
 * // List questions
 * const { questions } = await client.questions.list({
 *   year: 2024,
 *   discipline: 'Matemática',
 *   limit: 20
 * })
 *
 * // Get explanation for a question
 * const explanation = await client.explanations.generate(
 *   questions[0].id,
 *   'A'
 * )
 * console.log(explanation.explanation)
 *
 * // Correct an essay
 * const correction = await client.essays.correct(
 *   'This is my essay...',
 *   'The role of education in society'
 * )
 * console.log(`Score: ${correction.score}/10`)
 *
 * // Save a simulation
 * const simulation = await client.simulations.save({
 *   'q_2024_001': 'A',
 *   'q_2024_002': 'B',
 *   'q_2024_003': 'C'
 * }, 'Morning Practice')
 * console.log(`Score: ${simulation.score}`)
 */
