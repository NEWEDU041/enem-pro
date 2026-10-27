/**
 * Mailchimp Integration
 * Handles OAuth, API interactions, contact sync, and campaign management
 */

import axios, { AxiosInstance } from 'axios'
import crypto from 'crypto'
import { createServerClient } from './supabase'

// Types
export interface MailchimpConfig {
  apiKey: string
  apiServer: string
  audienceId: string
  accountName: string
}

export interface MailchimpContact {
  email: string
  firstName?: string
  lastName?: string
  tags?: string[]
  interests?: Record<string, boolean>
  mergeFields?: Record<string, any>
}

export interface DripCampaign {
  id: string
  name: string
  type: 'onboarding' | 'nurture' | 'reengagement' | 'churnrisk' | 'upgrade'
  dayOffsets: number[] // Which days to send emails
  emailIds: string[] // Mailchimp email IDs
  segment?: string // Audience segment
}

export interface SegmentCriteria {
  type: 'cohort' | 'behavior' | 'churnrisk' | 'upgrade'
  filters: Record<string, any>
}

export interface ABTestConfig {
  campaignId: string
  variants: {
    subject: string
    sendTime?: string
    percentage: number
  }[]
}

export interface MailchimpMetrics {
  campaignId: string
  name: string
  sentCount: number
  openRate: number
  clickRate: number
  conversionRate: number
  unsubscribeRate: number
  bounceRate: number
  lastUpdated: Date
}

// Mailchimp Client
class MailchimpClient {
  private client: AxiosInstance
  private config: MailchimpConfig

  constructor(config: MailchimpConfig) {
    this.config = config
    this.client = axios.create({
      baseURL: `https://${config.apiServer}.api.mailchimp.com/3.0`,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Add or update a contact in Mailchimp
   */
  async syncContact(audience_id: string, contact: MailchimpContact): Promise<any> {
    try {
      const emailHash = this.hashEmail(contact.email)
      
      const response = await this.client.put(
        `/lists/${audience_id}/members/${emailHash}`,
        {
          email_address: contact.email,
          status: 'subscribed',
          merge_fields: {
            FNAME: contact.firstName || '',
            LNAME: contact.lastName || '',
            ...contact.mergeFields,
          },
          tags: contact.tags || [],
          interests: contact.interests || {},
        }
      )
      
      return response.data
    } catch (error) {
      console.error('Error syncing contact to Mailchimp:', error)
      throw error
    }
  }

  /**
   * Get list of all contacts in an audience
   */
  async getContacts(audience_id: string, params?: Record<string, any>) {
    try {
      const response = await this.client.get(`/lists/${audience_id}/members`, {
        params: {
          count: 1000,
          offset: 0,
          ...params,
        },
      })
      return response.data
    } catch (error) {
      console.error('Error fetching contacts:', error)
      throw error
    }
  }

  /**
   * Create or get automation workflow
   */
  async createAutomation(audience_id: string, campaign: DripCampaign) {
    try {
      // Check if automation exists
      const existingResponse = await this.client.get('/automations', {
        params: { status: 'all' },
      })

      const existing = existingResponse.data.automations?.find(
        (a: any) => a.settings.title === campaign.name
      )

      if (existing) {
        return existing
      }

      // Create new automation workflow
      const response = await this.client.post('/automations', {
        settings: {
          title: campaign.name,
          from_name: 'ENEM Pro',
          reply_to: 'support@enempro.com.br',
          use_conversation: false,
          to_name: '*|FNAME|*',
        },
        trigger: {
          runtime: {
            type: 'relative',
            unit: 'days',
            delay: campaign.dayOffsets[0] || 0,
          },
          workflow_emails_sent: 0,
        },
        list_id: audience_id,
      })

      return response.data
    } catch (error) {
      console.error('Error creating automation:', error)
      throw error
    }
  }

  /**
   * Add email to automation workflow
   */
  async addWorkflowEmail(automation_id: string, emailConfig: any) {
    try {
      const response = await this.client.post(
        `/automations/${automation_id}/emails`,
        {
          delay: emailConfig.delay || 0,
          settings: {
            title: emailConfig.title,
            subject_line: emailConfig.subject,
            preview_text: emailConfig.preview,
            from_name: 'ENEM Pro',
            reply_to: 'support@enempro.com.br',
          },
          content: {
            html: emailConfig.htmlContent,
            text: emailConfig.textContent,
          },
        }
      )

      return response.data
    } catch (error) {
      console.error('Error adding workflow email:', error)
      throw error
    }
  }

  /**
   * Create segment (audience filter)
   */
  async createSegment(audience_id: string, name: string, criteria: SegmentCriteria) {
    try {
      const response = await this.client.post(
        `/lists/${audience_id}/segments`,
        {
          name,
          static: false,
          options: {
            match: 'any',
            conditions: this.buildSegmentConditions(criteria),
          },
        }
      )

      return response.data
    } catch (error) {
      console.error('Error creating segment:', error)
      throw error
    }
  }

  /**
   * Update member tags
   */
  async updateMemberTags(audience_id: string, email: string, tags: string[]) {
    try {
      const emailHash = this.hashEmail(email)
      const response = await this.client.post(
        `/lists/${audience_id}/members/${emailHash}/tags`,
        {
          tags: tags.map((t) => ({ name: t, status: 'active' })),
        }
      )

      return response.data
    } catch (error) {
      console.error('Error updating member tags:', error)
      throw error
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaign_id: string): Promise<MailchimpMetrics> {
    try {
      const response = await this.client.get(`/reports/${campaign_id}`)
      const data = response.data

      return {
        campaignId: campaign_id,
        name: data.campaign_title,
        sentCount: data.emails_sent,
        openRate: data.opens?.open_rate || 0,
        clickRate: data.clicks?.click_rate || 0,
        conversionRate: data.conversions || 0,
        unsubscribeRate: data.unsubscribed || 0,
        bounceRate: data.hard_bounces?.bounce_rate || 0,
        lastUpdated: new Date(),
      }
    } catch (error) {
      console.error('Error fetching campaign stats:', error)
      throw error
    }
  }

  /**
   * Create A/B test variant
   */
  async createABTest(campaign_id: string, config: ABTestConfig) {
    try {
      // Note: This is a simplified version. Full A/B testing in Mailchimp
      // would be done through their campaign API
      const response = await this.client.put(`/campaigns/${campaign_id}`, {
        variate_settings: {
          test_type: 'subject',
          wait_time: 24,
          winning_combination_percent: 10,
          winning_mailchimp_goal: 'open_rate',
          combinations: config.variants.map((v, i) => ({
            subject_line: v.subject,
            send_time_optimization: v.sendTime || false,
          })),
        },
      })

      return response.data
    } catch (error) {
      console.error('Error creating A/B test:', error)
      throw error
    }
  }

  /**
   * Get audience analytics
   */
  async getAudienceAnalytics(audience_id: string) {
    try {
      const response = await this.client.get(`/lists/${audience_id}`)
      return {
        totalSubscribers: response.data.stats?.member_count || 0,
        unsubscribed: response.data.stats?.unsubscribe_count || 0,
        cleaned: response.data.stats?.cleaned_count || 0,
        avgOpenRate: response.data.stats?.avg_sub_rate || 0,
        campaignCount: response.data.stats?.campaign_count || 0,
      }
    } catch (error) {
      console.error('Error fetching audience analytics:', error)
      throw error
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(campaign_id: string, emailAddresses: string[]) {
    try {
      const response = await this.client.post(
        `/campaigns/${campaign_id}/actions/test`,
        {
          test_emails: emailAddresses,
          send_type: 'html',
        }
      )

      return response.data
    } catch (error) {
      console.error('Error sending test email:', error)
      throw error
    }
  }

  // Helpers
  private hashEmail(email: string): string {
    return crypto.createHash('md5').update(email.toLowerCase()).digest('hex')
  }

  private buildSegmentConditions(criteria: SegmentCriteria): any[] {
    // Implementation varies by segment type
    const conditions = []

    if (criteria.type === 'cohort') {
      // Cohort-based segmentation (join date, user activity, etc.)
      if (criteria.filters.joinDateStart) {
        conditions.push({
          condition_type: 'ConversionsDateRange',
          field: 'email_client',
          value: criteria.filters.joinDateStart,
          extra: criteria.filters.joinDateEnd,
        })
      }
    } else if (criteria.type === 'behavior') {
      // Behavior-based (opens, clicks, purchases)
      if (criteria.filters.minOpens) {
        conditions.push({
          condition_type: 'EmailOpens',
          field: 'opens_count_range',
          value: criteria.filters.minOpens,
        })
      }
    } else if (criteria.type === 'churnrisk') {
      // ML-based churn risk
      if (criteria.filters.lastEngagementDays) {
        conditions.push({
          condition_type: 'EmailOpens',
          field: 'opens_count_range',
          value: 0, // No opens in X days
          extra: criteria.filters.lastEngagementDays,
        })
      }
    }

    return conditions
  }
}

/**
 * Initialize Mailchimp client
 */
export function initializeMailchimp(): MailchimpClient {
  const apiKey = process.env.MAILCHIMP_API_KEY
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID
  const serverPrefix = process.env.MAILCHIMP_SERVER

  if (!apiKey || !audienceId || !serverPrefix) {
    throw new Error('Missing Mailchimp configuration')
  }

  // Extract server from API key (format: xxx-us1, xxx-us2, etc.)
  const apiServer = serverPrefix

  return new MailchimpClient({
    apiKey,
    apiServer,
    audienceId,
    accountName: 'ENEM Pro',
  })
}

/**
 * OAuth Token Management
 */
export class MailchimpOAuthManager {
  private static readonly OAUTH_URL = 'https://login.mailchimp.com/oauth2/authorize'
  private static readonly TOKEN_URL = 'https://login.mailchimp.com/oauth2/token'

  static getAuthorizationUrl(clientId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'audience:read audience:manage campaigns:read campaigns:manage',
    })

    return `${this.OAUTH_URL}?${params.toString()}`
  }

  static async exchangeCodeForToken(
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string
  ): Promise<{
    access_token: string
    refresh_token?: string
    expires_in?: number
  }> {
    try {
      const response = await axios.post(this.TOKEN_URL, {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      })

      return response.data
    } catch (error) {
      console.error('OAuth token exchange failed:', error)
      throw error
    }
  }

  static async refreshAccessToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string
  ): Promise<{
    access_token: string
    expires_in?: number
  }> {
    try {
      const response = await axios.post(this.TOKEN_URL, {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      })

      return response.data
    } catch (error) {
      console.error('OAuth token refresh failed:', error)
      throw error
    }
  }
}

/**
 * Drip Campaign Manager
 */
export class DripCampaignManager {
  private mailchimp: MailchimpClient
  private db = createServerClient()

  constructor(mailchimp: MailchimpClient) {
    this.mailchimp = mailchimp
  }

  /**
   * Create all standard drip campaigns
   */
  async setupStandardCampaigns() {
    const campaigns: DripCampaign[] = [
      // Onboarding (3 emails)
      {
        id: 'onboarding',
        name: 'Welcome to ENEM Pro - Onboarding',
        type: 'onboarding',
        dayOffsets: [0, 3, 7],
        emailIds: ['onboarding-1', 'onboarding-2', 'onboarding-3'],
      },
      // Nurture (4 emails)
      {
        id: 'nurture',
        name: 'Weekly Study Tips - Nurture Series',
        type: 'nurture',
        dayOffsets: [0, 7, 14, 21],
        emailIds: ['nurture-1', 'nurture-2', 'nurture-3', 'nurture-4'],
      },
      // Re-engagement (2 emails)
      {
        id: 'reengagement',
        name: 'We Miss You! - Re-engagement Campaign',
        type: 'reengagement',
        dayOffsets: [0, 7],
        emailIds: ['reeng-1', 'reeng-2'],
      },
      // Churn Risk (2 emails)
      {
        id: 'churnrisk',
        name: 'Special Offer - Churn Prevention',
        type: 'churnrisk',
        dayOffsets: [0, 3],
        emailIds: ['churn-1', 'churn-2'],
      },
      // Upgrade Offer (1 email)
      {
        id: 'upgrade',
        name: 'Unlock Premium Features',
        type: 'upgrade',
        dayOffsets: [0],
        emailIds: ['upgrade-1'],
      },
    ]

    for (const campaign of campaigns) {
      await this.db
        .from('drip_campaigns')
        .upsert({
          id: campaign.id,
          name: campaign.name,
          type: campaign.type,
          day_offsets: campaign.dayOffsets,
          email_ids: campaign.emailIds,
          is_active: true,
          created_at: new Date().toISOString(),
        })
    }

    return campaigns
  }

  /**
   * Send drip email to user
   */
  async sendDripEmail(
    userId: string,
    campaignType: DripCampaign['type'],
    dayOffset: number
  ) {
    // Fetch user profile
    const { data: user } = await this.db
      .from('user_profiles')
      .select('email, first_name, last_name')
      .eq('user_id', userId)
      .single()

    if (!user?.email) {
      throw new Error('User email not found')
    }

    // Get campaign template
    const { data: campaign } = await this.db
      .from('drip_campaigns')
      .select('*')
      .eq('type', campaignType)
      .single()

    if (!campaign) {
      throw new Error(`Campaign template not found: ${campaignType}`)
    }

    // Log the drip email event
    await this.db.from('drip_email_logs').insert({
      user_id: userId,
      campaign_type: campaignType,
      day_offset: dayOffset,
      sent_at: new Date().toISOString(),
      status: 'pending',
    })

    // In production, this would actually send via Mailchimp
    console.log(`📧 Drip email queued: ${user.email} - ${campaignType} - day ${dayOffset}`)

    return true
  }
}
