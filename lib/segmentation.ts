/**
 * Email Segmentation Engine
 * Segments subscribers based on cohort, behavior, and ML-based churn risk
 */

import { createServerClient } from '@/lib/supabase'

export interface Segment {
  id: string
  name: string
  type: 'cohort' | 'behavior' | 'churnrisk'
  userIds: string[]
  criteria: Record<string, any>
  count: number
  createdAt: Date
}

export interface ChurnRiskScore {
  userId: string
  riskScore: number // 0-1, higher = more likely to churn
  factors: {
    lastEngagementDays: number
    openRate: number
    clickRate: number
    studyStreak: number
    daysSincePurchase?: number
    supportTickets: number
  }
  riskLevel: 'low' | 'medium' | 'high'
}

export class SegmentationEngine {
  private db = createServerClient()

  /**
   * Create cohort-based segment (new users, power users, etc.)
   */
  async createCohortSegment(cohortType: string): Promise<Segment> {
    let query = this.db
      .from('user_profiles')
      .select('user_id, created_at, email')

    let name = ''
    const criteria: Record<string, any> = {}

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    switch (cohortType) {
      case 'new':
        // New users in last 7 days
        name = 'New Users (Week 1)'
        criteria.joinDate = `last_7_days`
        query = query.gte('created_at', oneWeekAgo.toISOString())
        break

      case 'month_1':
        // Users 7-30 days old
        name = 'Month 1 Cohort'
        query = query
          .lt('created_at', oneWeekAgo.toISOString())
          .gte('created_at', oneMonthAgo.toISOString())
        break

      case 'power':
        // Users with high activity (>20 questions answered)
        name = 'Power Users'
        criteria.minQuestionsAnswered = 20
        break

      case 'inactive':
        // No activity in last 30 days
        name = 'Inactive Users'
        criteria.lastActivityDaysAgo = '>30'
        break

      default:
        throw new Error(`Unknown cohort type: ${cohortType}`)
    }

    const { data: users, error } = await query

    if (error) {
      throw new Error(`Failed to create segment: ${error.message}`)
    }

    const userIds = (users || []).map((u: any) => u.user_id)

    // Save segment
    const { data: segment } = await this.db
      .from('email_segments')
      .insert({
        name,
        type: 'cohort',
        user_ids: userIds,
        criteria,
        segment_size: userIds.length,
      })
      .select()
      .single()

    return {
      id: segment?.id || '',
      name,
      type: 'cohort',
      userIds,
      criteria,
      count: userIds.length,
      createdAt: new Date(),
    }
  }

  /**
   * Create behavior-based segment
   */
  async createBehaviorSegment(behaviorType: string): Promise<Segment> {
    let name = ''
    const criteria: Record<string, any> = {}
    const query = this.db
      .from('user_profiles')
      .select('user_id, email')

    switch (behaviorType) {
      case 'high_engagement':
        // Opened last 3 emails + clicked links
        name = 'High Engagement'
        criteria.minOpenRate = 0.5
        criteria.minClickRate = 0.2
        break

      case 'question_solvers':
        // Users who solve questions regularly
        name = 'Question Solvers'
        criteria.answeredQuestionsLastWeek = '>5'
        break

      case 'course_viewers':
        // Users who frequently watch explanation videos
        name = 'Course Viewers'
        criteria.videosWatchedLastWeek = '>3'
        break

      case 'no_engagement':
        // Never opened or clicked
        name = 'Non-Engaged'
        criteria.neverOpened = true
        criteria.neverClicked = true
        break

      case 'premium_ready':
        // Users showing strong trial engagement
        name = 'Premium-Ready Users'
        criteria.trialProgress = '>70%'
        criteria.daysSinceTrial = '<15'
        break

      default:
        throw new Error(`Unknown behavior type: ${behaviorType}`)
    }

    // Build complex query based on behavior
    const { data: users, error } = await this.buildBehaviorQuery(behaviorType)

    if (error) {
      throw new Error(`Failed to create segment: ${error.message}`)
    }

    const userIds = (users || []).map((u: any) => u.user_id)

    // Save segment
    const { data: segment } = await this.db
      .from('email_segments')
      .insert({
        name,
        type: 'behavior',
        user_ids: userIds,
        criteria,
        segment_size: userIds.length,
      })
      .select()
      .single()

    return {
      id: segment?.id || '',
      name,
      type: 'behavior',
      userIds,
      criteria,
      count: userIds.length,
      createdAt: new Date(),
    }
  }

  /**
   * Create ML-based churn risk segment
   */
  async createChurnRiskSegment(): Promise<Segment> {
    // Calculate churn risk scores for all users
    const churnScores = await this.calculateChurnRiskScores()

    // Segment users by risk level
    const highRiskUsers = churnScores
      .filter((s) => s.riskLevel === 'high')
      .map((s) => s.userId)

    const mediumRiskUsers = churnScores
      .filter((s) => s.riskLevel === 'medium')
      .map((s) => s.userId)

    // Save high-risk segment (for immediate intervention)
    const { data: highRiskSegment } = await this.db
      .from('email_segments')
      .insert({
        name: 'Churn Risk - High',
        type: 'churnrisk',
        user_ids: highRiskUsers,
        criteria: { riskLevel: 'high' },
        segment_size: highRiskUsers.length,
      })
      .select()
      .single()

    // Save medium-risk segment (for nurture)
    const { data: mediumRiskSegment } = await this.db
      .from('email_segments')
      .insert({
        name: 'Churn Risk - Medium',
        type: 'churnrisk',
        user_ids: mediumRiskUsers,
        criteria: { riskLevel: 'medium' },
        segment_size: mediumRiskUsers.length,
      })
      .select()
      .single()

    // Save all scores to database for tracking
    for (const score of churnScores) {
      await this.db.from('churn_risk_scores').upsert({
        user_id: score.userId,
        risk_score: score.riskScore,
        risk_level: score.riskLevel,
        factors: score.factors,
        calculated_at: new Date().toISOString(),
      })
    }

    return {
      id: highRiskSegment?.id || '',
      name: 'Churn Risk - High',
      type: 'churnrisk',
      userIds: highRiskUsers,
      criteria: { riskLevel: 'high' },
      count: highRiskUsers.length,
      createdAt: new Date(),
    }
  }

  /**
   * Calculate churn risk score for each user using ML features
   */
  private async calculateChurnRiskScores(): Promise<ChurnRiskScore[]> {
    // Fetch all users with their activity data
    const { data: users } = await this.db
      .from('user_profiles')
      .select(
        `
        user_id, 
        email,
        created_at,
        last_login
      `
      )

    if (!users) return []

    const scores: ChurnRiskScore[] = []

    for (const user of users) {
      // Get user engagement metrics
      const [answers, engagementMetrics, lastPurchase] = await Promise.all([
        this.getUserAnswers(user.user_id),
        this.getUserEngagementMetrics(user.user_id),
        this.getLastPurchase(user.user_id),
      ])

      // Calculate individual factors
      const now = new Date()
      const lastLoginDate = user.last_login ? new Date(user.last_login) : new Date(0)
      const lastEngagementDays = Math.floor(
        (now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      const openRate = engagementMetrics.totalOpens / Math.max(engagementMetrics.emailsSent, 1)
      const clickRate = engagementMetrics.totalClicks / Math.max(engagementMetrics.emailsSent, 1)
      const studyStreak = this.calculateStudyStreak(answers)
      const daysSincePurchase = lastPurchase
        ? Math.floor((now.getTime() - new Date(lastPurchase).getTime()) / (1000 * 60 * 60 * 24))
        : null

      // Get support tickets
      const { count: supportTickets } = await this.db
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user_id)

      // ML Risk Scoring
      let riskScore = 0

      // Factor 1: Inactivity (highest weight: 0.3)
      if (lastEngagementDays > 60) {
        riskScore += 0.3
      } else if (lastEngagementDays > 30) {
        riskScore += 0.15
      } else if (lastEngagementDays > 14) {
        riskScore += 0.05
      }

      // Factor 2: Low engagement rates (weight: 0.25)
      if (openRate < 0.1) {
        riskScore += 0.25
      } else if (openRate < 0.2) {
        riskScore += 0.15
      }

      // Factor 3: Low click rate (weight: 0.15)
      if (clickRate < 0.05) {
        riskScore += 0.15
      }

      // Factor 4: Broken study streak (weight: 0.2)
      if (studyStreak < 3) {
        riskScore += 0.2
      } else if (studyStreak < 7) {
        riskScore += 0.1
      }

      // Factor 5: No purchase (recent trial expiry) (weight: 0.1)
      if (daysSincePurchase && daysSincePurchase > 30) {
        riskScore += 0.1
      }

      // Determine risk level
      const riskLevel: 'low' | 'medium' | 'high' =
        riskScore > 0.6 ? 'high' : riskScore > 0.3 ? 'medium' : 'low'

      scores.push({
        userId: user.user_id,
        riskScore: Math.min(riskScore, 1.0),
        factors: {
          lastEngagementDays,
          openRate,
          clickRate,
          studyStreak,
          daysSincePurchase: daysSincePurchase || 0,
          supportTickets: supportTickets || 0,
        },
        riskLevel,
      })
    }

    return scores
  }

  /**
   * Helper: Get user's answered questions
   */
  private async getUserAnswers(userId: string) {
    const { data } = await this.db
      .from('user_answers')
      .select('answered_at')
      .eq('user_id', userId)

    return data || []
  }

  /**
   * Helper: Get user engagement metrics (emails sent, opened, clicked)
   */
  private async getUserEngagementMetrics(userId: string) {
    const { data: drips } = await this.db
      .from('drip_email_logs')
      .select('status')
      .eq('user_id', userId)

    const { data: opens } = await this.db
      .from('email_engagement')
      .select('event_type')
      .eq('user_id', userId)
      .eq('event_type', 'open')

    const { data: clicks } = await this.db
      .from('email_engagement')
      .select('event_type')
      .eq('user_id', userId)
      .eq('event_type', 'click')

    return {
      emailsSent: drips?.length || 0,
      totalOpens: opens?.length || 0,
      totalClicks: clicks?.length || 0,
    }
  }

  /**
   * Helper: Calculate study streak
   */
  private calculateStudyStreak(answers: any[]): number {
    if (!answers.length) return 0

    const now = new Date()
    let streak = 0
    let currentDate = new Date(now)

    // Sort answers by date (newest first)
    const sortedAnswers = answers.sort(
      (a, b) => new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime()
    )

    for (const answer of sortedAnswers) {
      const answerDate = new Date(answer.answered_at)
      const dayDiff = Math.floor(
        (currentDate.getTime() - answerDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (dayDiff === 0) {
        streak++
        currentDate = answerDate
      } else if (dayDiff === 1) {
        streak++
        currentDate = answerDate
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Helper: Get last purchase date
   */
  private async getLastPurchase(userId: string) {
    const { data } = await this.db
      .from('purchases')
      .select('purchased_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('purchased_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return data?.purchased_at
  }

  /**
   * Helper: Build complex behavior query
   */
  private async buildBehaviorQuery(behaviorType: string) {
    // This would be implemented with RPC functions or complex queries
    // For now, returning a basic structure

    switch (behaviorType) {
      case 'high_engagement':
        return this.db
          .from('user_profiles')
          .select('user_id, email')
          .filter('engagement_score', 'gte', 0.7)

      case 'question_solvers':
        return this.db
          .from('user_profiles')
          .select('user_id, email')
          .filter('recent_answers_count', 'gte', 5)

      case 'course_viewers':
        return this.db
          .from('user_profiles')
          .select('user_id, email')
          .filter('videos_watched_count', 'gte', 3)

      case 'no_engagement':
        return this.db
          .from('user_profiles')
          .select('user_id, email')
          .filter('total_opens', 'eq', 0)
          .filter('total_clicks', 'eq', 0)

      case 'premium_ready':
        return this.db
          .from('user_profiles')
          .select('user_id, email')
          .filter('trial_progress', 'gte', 0.7)

      default:
        return { data: null, error: new Error('Unknown behavior type') }
    }
  }

  /**
   * Get all active segments
   */
  async getAllSegments(): Promise<Segment[]> {
    const { data, error } = await this.db
      .from('email_segments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch segments: ${error.message}`)
    }

    return (data || []).map((seg: any) => ({
      id: seg.id,
      name: seg.name,
      type: seg.type,
      userIds: seg.user_ids || [],
      criteria: seg.criteria || {},
      count: seg.segment_size || 0,
      createdAt: new Date(seg.created_at),
    }))
  }
}
