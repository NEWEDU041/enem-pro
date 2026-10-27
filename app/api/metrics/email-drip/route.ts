import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { withErrorHandling } from '@/lib/api-helpers'

interface MetricsQuery {
  campaignType?: string
  dateRange?: {
    startDate: string
    endDate: string
  }
  groupBy?: 'day' | 'week' | 'month'
}

interface CampaignMetrics {
  campaignId: string
  campaignType: string
  campaignName: string
  period: string
  metrics: {
    emailsSent: number
    delivered: number
    opened: number
    clicked: number
    converted: number
    unsubscribed: number
    bounced: number
    complained: number
  }
  rates: {
    deliveryRate: number
    openRate: number
    clickRate: number
    conversionRate: number
    unsubscribeRate: number
    bounceRate: number
    complaintRate: number
  }
  trends: {
    openRate24h: number
    clickRate24h: number
    conversionRate24h: number
  }
}

interface DashboardMetrics {
  summary: {
    totalEmailsSent: number
    totalOpened: number
    totalClicked: number
    totalConverted: number
    overallOpenRate: number
    overallClickRate: number
    overallConversionRate: number
  }
  campaigns: CampaignMetrics[]
  segments: Array<{
    segmentId: string
    segmentName: string
    size: number
    engagementScore: number
    estimatedChurnRisk: number
  }>
  topPerformers: Array<{
    campaignId: string
    campaignName: string
    openRate: number
    clickRate: number
    metric: 'open_rate' | 'click_rate' | 'conversion_rate'
  }>
  recommendations: string[]
}

/**
 * GET /api/metrics/email-drip
 * Fetch email campaign metrics and dashboard data
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const auth = await requireAuth(req)
  if (!auth.ok) {
    return auth.response
  }

  // Check admin permission
  const { data: user } = await createServerClient()
    .from('user_profiles')
    .select('role')
    .eq('user_id', auth.userId)
    .single()

  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const campaignType = searchParams.get('campaignType') || undefined
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const groupBy = (searchParams.get('groupBy') || 'day') as 'day' | 'week' | 'month'

  const query: MetricsQuery = {
    campaignType,
    groupBy,
  }

  if (startDate && endDate) {
    query.dateRange = { startDate, endDate }
  }

  try {
    const db = createServerClient()

    // Fetch campaign metrics
    const { data: campaigns } = await db
      .from('campaign_metrics')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50)

    // Fetch engagement events
    const { data: engagementEvents } = await db
      .from('email_engagement')
      .select('user_id, event_type, campaign_id')
      .order('created_at', { ascending: false })
      .limit(10000)

    // Fetch drip logs
    const { data: dripLogs } = await db
      .from('drip_email_logs')
      .select('campaign_type, status')
      .order('sent_at', { ascending: false })
      .limit(10000)

    // Fetch segments
    const { data: segments } = await db
      .from('email_segments')
      .select('id, name, segment_size, type')
      .order('created_at', { ascending: false })

    // Process metrics
    const processedCampaigns = processCampaignMetrics(campaigns || [])
    const summary = calculateSummaryMetrics(dripLogs || [], engagementEvents || [])
    const topPerformers = getTopPerformers(processedCampaigns)
    const segmentMetrics = await calculateSegmentMetrics(segments || [], db)
    const recommendations = generateRecommendations(summary, processedCampaigns)

    const dashboard: DashboardMetrics = {
      summary,
      campaigns: processedCampaigns,
      segments: segmentMetrics,
      topPerformers,
      recommendations,
    }

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Metrics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/metrics/email-drip/track
 * Track email events (opens, clicks, conversions)
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const db = createServerClient()

  try {
    const {
      userId,
      campaignId,
      campaignType,
      eventType,
      metadata,
    } = await req.json()

    if (!userId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert event
    await db.from('email_engagement').insert({
      user_id: userId,
      campaign_id: campaignId,
      campaign_type: campaignType,
      event_type: eventType,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Event tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
})

// Helper functions

function processCampaignMetrics(campaigns: any[]): CampaignMetrics[] {
  return campaigns.map((campaign) => {
    const emailsSent = campaign.emails_sent || 0
    const opened = campaign.opens || 0
    const clicked = campaign.clicks || 0
    const converted = campaign.conversions || 0
    const unsubscribed = campaign.unsubscribes || 0
    const bounced = campaign.bounces || 0

    return {
      campaignId: campaign.mailchimp_campaign_id,
      campaignType: campaign.campaign_type || 'unknown',
      campaignName: campaign.campaign_name,
      period: new Date(campaign.sent_at).toISOString().split('T')[0],
      metrics: {
        emailsSent,
        delivered: emailsSent - bounced,
        opened,
        clicked,
        converted,
        unsubscribed,
        bounced,
        complained: campaign.abuse_reports || 0,
      },
      rates: {
        deliveryRate: emailsSent > 0 ? (emailsSent - bounced) / emailsSent : 0,
        openRate: emailsSent > 0 ? opened / emailsSent : 0,
        clickRate: emailsSent > 0 ? clicked / emailsSent : 0,
        conversionRate: emailsSent > 0 ? converted / emailsSent : 0,
        unsubscribeRate: emailsSent > 0 ? unsubscribed / emailsSent : 0,
        bounceRate: emailsSent > 0 ? bounced / emailsSent : 0,
        complaintRate: emailsSent > 0 ? (campaign.abuse_reports || 0) / emailsSent : 0,
      },
      trends: {
        openRate24h: 0, // Would be calculated from time-series data
        clickRate24h: 0,
        conversionRate24h: 0,
      },
    }
  })
}

function calculateSummaryMetrics(dripLogs: any[], events: any[]) {
  const totalEmailsSent = dripLogs.filter((l) => l.status === 'sent').length
  const uniqueOpens = new Set(
    events.filter((e) => e.event_type === 'open').map((e) => e.user_id)
  ).size
  const uniqueClicks = new Set(
    events.filter((e) => e.event_type === 'click').map((e) => e.user_id)
  ).size
  const uniqueConversions = new Set(
    events.filter((e) => e.event_type === 'conversion').map((e) => e.user_id)
  ).size

  return {
    totalEmailsSent,
    totalOpened: uniqueOpens,
    totalClicked: uniqueClicks,
    totalConverted: uniqueConversions,
    overallOpenRate: totalEmailsSent > 0 ? uniqueOpens / totalEmailsSent : 0,
    overallClickRate: totalEmailsSent > 0 ? uniqueClicks / totalEmailsSent : 0,
    overallConversionRate: totalEmailsSent > 0 ? uniqueConversions / totalEmailsSent : 0,
  }
}

function getTopPerformers(campaigns: CampaignMetrics[]) {
  const byOpenRate = [...campaigns]
    .sort((a, b) => b.rates.openRate - a.rates.openRate)
    .slice(0, 3)
    .map((c) => ({
      campaignId: c.campaignId,
      campaignName: c.campaignName,
      openRate: c.rates.openRate,
      clickRate: c.rates.clickRate,
      metric: 'open_rate' as const,
    }))

  const byClickRate = [...campaigns]
    .sort((a, b) => b.rates.clickRate - a.rates.clickRate)
    .slice(0, 3)
    .map((c) => ({
      campaignId: c.campaignId,
      campaignName: c.campaignName,
      openRate: c.rates.openRate,
      clickRate: c.rates.clickRate,
      metric: 'click_rate' as const,
    }))

  const byConversionRate = [...campaigns]
    .sort((a, b) => b.rates.conversionRate - a.rates.conversionRate)
    .slice(0, 3)
    .map((c) => ({
      campaignId: c.campaignId,
      campaignName: c.campaignName,
      openRate: c.rates.openRate,
      clickRate: c.rates.clickRate,
      metric: 'conversion_rate' as const,
    }))

  return [...byOpenRate, ...byClickRate, ...byConversionRate].slice(0, 5)
}

async function calculateSegmentMetrics(segments: any[], db: any) {
  return Promise.all(
    segments.map(async (segment) => {
      // Calculate engagement score for segment
      const { data: events } = await db
        .from('email_engagement')
        .select('user_id')
        .in('user_id', segment.user_ids || [])

      const engagementScore =
        segment.segment_size > 0 ? (events?.length || 0) / segment.segment_size : 0

      // Get churn risk scores
      const { data: churnScores } = await db
        .from('churn_risk_scores')
        .select('risk_score')
        .in('user_id', segment.user_ids || [])

      const avgChurnRisk =
        churnScores && churnScores.length > 0
          ? churnScores.reduce((sum: number, s: any) => sum + s.risk_score, 0) /
            churnScores.length
          : 0

      return {
        segmentId: segment.id,
        segmentName: segment.name,
        size: segment.segment_size || 0,
        engagementScore,
        estimatedChurnRisk: avgChurnRisk,
      }
    })
  )
}

function generateRecommendations(
  summary: any,
  campaigns: CampaignMetrics[]
): string[] {
  const recommendations: string[] = []

  // Check open rate
  if (summary.overallOpenRate < 0.2) {
    recommendations.push(
      '⚠️ Open rate below 20%. Try A/B testing subject lines or send time.'
    )
  }

  // Check click rate
  if (summary.overallClickRate < 0.05) {
    recommendations.push(
      '⚠️ Click rate below 5%. Review email content and CTA placement.'
    )
  }

  // Check conversion rate
  if (summary.overallConversionRate < 0.01) {
    recommendations.push(
      '⚠️ Conversion rate below 1%. Consider stronger offers or landing page optimization.'
    )
  }

  // Identify underperforming segments
  if (campaigns.length > 0) {
    const avgOpenRate =
      campaigns.reduce((sum, c) => sum + c.rates.openRate, 0) / campaigns.length
    const lowPerformers = campaigns.filter((c) => c.rates.openRate < avgOpenRate * 0.7)

    if (lowPerformers.length > 0) {
      recommendations.push(
        `📊 ${lowPerformers.length} campaigns underperforming. Consider re-segmenting or updating content.`
      )
    }
  }

  // Check unsubscribe rate
  const avgUnsubscribeRate =
    campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + c.rates.unsubscribeRate, 0) / campaigns.length
      : 0

  if (avgUnsubscribeRate > 0.05) {
    recommendations.push(
      '📉 Unsubscribe rate above 5%. Review email frequency or content relevance.'
    )
  }

  return recommendations
}
