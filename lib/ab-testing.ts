/**
 * A/B Testing Configuration for Email Campaigns
 * Handles subject line testing, send time optimization, and content variants
 */

import { createServerClient } from '@/lib/supabase'

export interface ABTestVariant {
  id: string
  name: string
  subjectLine: string
  previewText?: string
  sendTime?: string
  allocation: number // Percentage (0-100)
  winner?: boolean
}

export interface ABTest {
  id: string
  campaignId: string
  campaignType: string
  testType: 'subject' | 'sendtime' | 'content' | 'multivariate'
  variants: ABTestVariant[]
  winningMetric: 'open_rate' | 'click_rate' | 'conversion_rate'
  testDuration: number // hours
  startTime: Date
  endTime?: Date
  status: 'planning' | 'running' | 'completed'
  winner?: ABTestVariant
  results?: ABTestResults
}

export interface ABTestResults {
  variantId: string
  variantName: string
  emailsSent: number
  opens: number
  openRate: number
  clicks: number
  clickRate: number
  conversions: number
  conversionRate: number
  unsubscribes: number
  bounces: number
}

export class ABTestingManager {
  private db = createServerClient()

  /**
   * Create a new A/B test for a campaign
   */
  async createTest(
    campaignId: string,
    campaignType: string,
    testConfig: {
      testType: 'subject' | 'sendtime' | 'content'
      variants: Omit<ABTestVariant, 'id'>[]
      winningMetric: 'open_rate' | 'click_rate' | 'conversion_rate'
      testDuration?: number // hours, default 24
    }
  ): Promise<ABTest> {
    // Validate allocation percentages
    const totalAllocation = testConfig.variants.reduce((sum, v) => sum + v.allocation, 0)
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error(`Variant allocation must sum to 100%, got ${totalAllocation}%`)
    }

    // Validate test type specific requirements
    if (testConfig.testType === 'subject') {
      testConfig.variants.forEach((v) => {
        if (!v.subjectLine) {
          throw new Error('Subject line variant must have subjectLine')
        }
      })
    }

    if (testConfig.testType === 'sendtime') {
      testConfig.variants.forEach((v) => {
        if (!v.sendTime) {
          throw new Error('Send time variant must have sendTime')
        }
      })
    }

    const testDuration = testConfig.testDuration || 24
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + testDuration * 60 * 60 * 1000)

    // Create test record
    const { data: test, error } = await this.db
      .from('ab_tests')
      .insert({
        campaign_id: campaignId,
        campaign_type: campaignType,
        test_type: testConfig.testType,
        winning_metric: testConfig.winningMetric,
        test_duration_hours: testDuration,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'planning',
        variants: testConfig.variants.map((v, i) => ({
          id: `variant-${i}`,
          ...v,
        })),
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create A/B test: ${error.message}`)
    }

    return {
      id: test.id,
      campaignId,
      campaignType,
      testType: testConfig.testType as any,
      variants: testConfig.variants.map((v, i) => ({
        id: `variant-${i}`,
        ...v,
      })),
      winningMetric: testConfig.winningMetric,
      testDuration,
      startTime,
      endTime,
      status: 'planning',
    }
  }

  /**
   * Start an A/B test
   */
  async startTest(testId: string): Promise<void> {
    const { error } = await this.db
      .from('ab_tests')
      .update({
        status: 'running',
        start_time: new Date().toISOString(),
      })
      .eq('id', testId)

    if (error) {
      throw new Error(`Failed to start test: ${error.message}`)
    }

    console.log(`🧪 A/B Test started: ${testId}`)
  }

  /**
   * Select variant for user (for send time optimization)
   */
  selectVariantForUser(testId: string, userId: string): ABTestVariant {
    // Use hash to deterministically assign variant
    const seed = `${testId}:${userId}`
    let hash = 0

    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }

    const randomValue = Math.abs(hash % 100)
    const cumulative = 0

    // This would be fetched from DB in real implementation
    // For now, returning a placeholder
    return {
      id: 'variant-0',
      name: 'Control',
      subjectLine: '',
      allocation: 50,
    }
  }

  /**
   * Record engagement metrics for variant
   */
  async recordVariantEvent(
    testId: string,
    variantId: string,
    userId: string,
    eventType: 'sent' | 'open' | 'click' | 'conversion' | 'unsubscribe' | 'bounce'
  ): Promise<void> {
    await this.db.from('ab_test_events').insert({
      test_id: testId,
      variant_id: variantId,
      user_id: userId,
      event_type: eventType,
      created_at: new Date().toISOString(),
    })
  }

  /**
   * Calculate results for completed test
   */
  async calculateTestResults(testId: string): Promise<ABTestResults[]> {
    const { data: test } = await this.db
      .from('ab_tests')
      .select('variants')
      .eq('id', testId)
      .single()

    if (!test) {
      throw new Error('Test not found')
    }

    const variants = test.variants || []
    const results: ABTestResults[] = []

    for (const variant of variants) {
      // Get all events for this variant
      const { data: events } = await this.db
        .from('ab_test_events')
        .select('event_type')
        .eq('test_id', testId)
        .eq('variant_id', variant.id)

      if (!events) continue

      const eventTypes = events.map((e: any) => e.event_type)
      const sentCount = eventTypes.filter((e) => e === 'sent').length
      const openCount = eventTypes.filter((e) => e === 'open').length
      const clickCount = eventTypes.filter((e) => e === 'click').length
      const conversionCount = eventTypes.filter((e) => e === 'conversion').length
      const unsubscribeCount = eventTypes.filter((e) => e === 'unsubscribe').length
      const bounceCount = eventTypes.filter((e) => e === 'bounce').length

      results.push({
        variantId: variant.id,
        variantName: variant.name,
        emailsSent: sentCount,
        opens: openCount,
        openRate: sentCount > 0 ? openCount / sentCount : 0,
        clicks: clickCount,
        clickRate: sentCount > 0 ? clickCount / sentCount : 0,
        conversions: conversionCount,
        conversionRate: sentCount > 0 ? conversionCount / sentCount : 0,
        unsubscribes: unsubscribeCount,
        bounces: bounceCount,
      })
    }

    return results
  }

  /**
   * Determine test winner and apply to campaign
   */
  async concludeTest(testId: string): Promise<ABTestVariant> {
    const results = await this.calculateTestResults(testId)

    if (results.length === 0) {
      throw new Error('No results available for test')
    }

    // Determine winner based on winning metric
    const { data: test } = await this.db
      .from('ab_tests')
      .select('winning_metric')
      .eq('id', testId)
      .single()

    const winningMetric = test.winning_metric as keyof ABTestResults
    const winner = results.reduce((best, current) => {
      const bestMetric = best[winningMetric] as number
      const currentMetric = current[winningMetric] as number
      return currentMetric > bestMetric ? current : best
    })

    // Save test results
    await this.db.from('ab_test_results').insert({
      test_id: testId,
      winner_variant_id: winner.variantId,
      winner_metric_value: winner[winningMetric],
      all_results: results,
      calculated_at: new Date().toISOString(),
    })

    // Update test status
    await this.db
      .from('ab_tests')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
      })
      .eq('id', testId)

    console.log(`✅ A/B Test completed: ${testId}, winner: ${winner.variantId}`)

    // Get the actual variant object
    const { data: winnerVariant } = await this.db
      .from('ab_tests')
      .select('variants')
      .eq('id', testId)
      .single()

    const variant = (winnerVariant?.variants || []).find(
      (v: any) => v.id === winner.variantId
    )

    return variant || { id: winner.variantId, name: 'Winner', subjectLine: '', allocation: 100 }
  }

  /**
   * Recommended A/B test configurations based on campaign type
   */
  getRecommendedTests(campaignType: string): Partial<ABTest>[] {
    const recommendations: Record<string, Partial<ABTest>[]> = {
      onboarding: [
        {
          testType: 'subject',
          variants: [
            {
              id: 'subject-1',
              name: 'Welcome to ENEM Pro',
              subjectLine: '🎓 Bem-vindo ao ENEM Pro - Seu guia completo para o ENEM',
              allocation: 50,
            },
            {
              id: 'subject-2',
              name: 'Get Started',
              subjectLine: 'Comece a estudar agora: 3 passos para o sucesso no ENEM',
              allocation: 50,
            },
          ],
          winningMetric: 'open_rate',
        },
      ],
      nurture: [
        {
          testType: 'subject',
          variants: [
            {
              id: 'subject-1',
              name: 'Curiosity',
              subjectLine: '10 questões ENEM que você provavelmente acerta errado',
              allocation: 50,
            },
            {
              id: 'subject-2',
              name: 'Direct',
              subjectLine: 'Aula: Funções quadráticas no ENEM',
              allocation: 50,
            },
          ],
          winningMetric: 'click_rate',
        },
      ],
      reengagement: [
        {
          testType: 'subject',
          variants: [
            {
              id: 'subject-1',
              name: 'Incentive',
              subjectLine: 'Volta aqui! Ganhe 7 dias de acesso premium',
              allocation: 50,
            },
            {
              id: 'subject-2',
              name: 'FOMO',
              subjectLine: 'Veja as novidades do ENEM Pro desde quando saiu',
              allocation: 50,
            },
          ],
          winningMetric: 'click_rate',
        },
      ],
      churnrisk: [
        {
          testType: 'subject',
          variants: [
            {
              id: 'subject-1',
              name: 'Offer',
              subjectLine: '50% de desconto - Oferecimento limitado por hoje',
              allocation: 50,
            },
            {
              id: 'subject-2',
              name: 'Value',
              subjectLine: 'Usuários premium estudam 3x mais questões',
              allocation: 50,
            },
          ],
          winningMetric: 'conversion_rate',
        },
        {
          testType: 'sendtime',
          variants: [
            {
              id: 'time-1',
              name: 'Morning',
              sendTime: '08:00',
              allocation: 50,
            },
            {
              id: 'time-2',
              name: 'Evening',
              sendTime: '20:00',
              allocation: 50,
            },
          ],
          winningMetric: 'open_rate',
        },
      ],
      upgrade: [
        {
          testType: 'subject',
          variants: [
            {
              id: 'subject-1',
              name: 'Feature-focused',
              subjectLine: 'Explicações com IA + Simulados ilimitados',
              allocation: 50,
            },
            {
              id: 'subject-2',
              name: 'Result-focused',
              subjectLine: 'Usuários premium aumentam nota em média 40 pontos',
              allocation: 50,
            },
          ],
          winningMetric: 'conversion_rate',
        },
      ],
    }

    return recommendations[campaignType] || []
  }

  /**
   * Get test history and performance metrics
   */
  async getTestHistory(campaignType?: string, limit: number = 20) {
    let query = this.db
      .from('ab_tests')
      .select('*, ab_test_results(*)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (campaignType) {
      query = query.eq('campaign_type', campaignType)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch test history: ${error.message}`)
    }

    return data || []
  }
}
