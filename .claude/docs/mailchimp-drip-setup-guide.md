# Mailchimp Email Drip Campaigns Setup Guide

## Overview

Complete implementation of email drip campaigns for ENEM Pro using Mailchimp, featuring:
- **OAuth2 Integration** for secure credential management
- **5 Drip Campaigns** (12 total emails)
- **Segmentation Engine** with cohort, behavior, and ML-based churn risk scoring
- **Webhook Handler** for real-time sync with Mailchimp
- **A/B Testing Framework** for optimization
- **Metrics Dashboard** with comprehensive analytics

---

## 1. Mailchimp Setup & OAuth Integration

### 1.1 Create Mailchimp OAuth Application

1. Go to [Mailchimp Developer Account](https://mailchimp.com/developer/)
2. Create a new app:
   - **App Name**: ENEM Pro
   - **Description**: Email drip campaign automation
   - **Redirects**: `https://enempro.com.br/api/auth/mailchimp/callback`

3. Note your credentials:
   - **Client ID**: `abc123def456...`
   - **Client Secret**: `secret_abc123def456...`

### 1.2 Environment Variables

Add to `.env.local`:

```bash
# Mailchimp OAuth
MAILCHIMP_CLIENT_ID=abc123def456
MAILCHIMP_CLIENT_SECRET=secret_abc123def456
MAILCHIMP_REDIRECT_URI=https://enempro.com.br/api/auth/mailchimp/callback

# Mailchimp API (after OAuth)
MAILCHIMP_API_KEY=xxx-us1  # Auto-stored after OAuth
MAILCHIMP_SERVER=us1       # Region: us1, us2, us3, etc
MAILCHIMP_AUDIENCE_ID=abc123  # Your main list ID

# Webhook Secret
MAILCHIMP_WEBHOOK_SECRET=webhook_secret_from_mailchimp
```

### 1.3 OAuth Flow Implementation

Endpoint: `/api/auth/mailchimp/authorize`
```typescript
// 1. Redirect user to Mailchimp OAuth
const authUrl = MailchimpOAuthManager.getAuthorizationUrl(
  clientId,
  redirectUri
)

// 2. User logs in and authorizes
// 3. Mailchimp redirects back with code

// 4. Exchange code for token
const tokens = await MailchimpOAuthManager.exchangeCodeForToken(
  clientId,
  clientSecret,
  code,
  redirectUri
)

// 5. Store tokens in Supabase (encrypted)
await supabase.from('mailchimp_config').insert({
  api_key: tokens.access_token,
  oauth_refresh_token: tokens.refresh_token,
  oauth_expires_at: expiresAt,
})
```

---

## 2. Drip Campaigns Configuration

### 2.1 Campaign Structure

| Campaign | Type | Day Offsets | Emails | Use Case |
|----------|------|-------------|--------|----------|
| **Onboarding** | Welcome sequence | Day 0, 3, 7 | 3 emails | New signup |
| **Nurture** | Weekly engagement | Day 0, 7, 14, 21 | 4 emails | Active users |
| **Re-engagement** | Win-back campaign | Day 0, 7 | 2 emails | Inactive 30d+ |
| **Churn Risk** | Retention offers | Day 0, 3 | 2 emails | At-risk users |
| **Upgrade** | Premium promotion | Day 0 | 1 email | Trial expiring |

### 2.2 Setting Up Campaigns

```typescript
const campaignManager = new DripCampaignManager(mailchimpClient)

// Create all campaigns
await campaignManager.setupStandardCampaigns()

// Create automation workflow in Mailchimp
const automation = await mailchimpClient.createAutomation(
  audienceId,
  campaigns[0]  // onboarding campaign
)

// Add emails to workflow
for (let i = 0; i < 3; i++) {
  const template = getTemplate('onboarding', i + 1)
  await mailchimpClient.addWorkflowEmail(automation.id, {
    delay: dayOffsets[i] * 24, // Convert days to hours
    subject: template.subject,
    htmlContent: template.htmlContent,
    ...
  })
}
```

### 2.3 Email Templates

All HTML templates are in `lib/drip-email-templates.ts`:
- Responsive design (mobile-first)
- Personalization with merge fields
- Clear call-to-action buttons
- Unsubscribe & preference center links

**Available merge fields**:
- `*|FNAME|*` - First name
- `*|LNAME|*` - Last name
- `*|EMAIL|*` - Email address
- `*|CTAS|*` - Dynamic call-to-action

---

## 3. Segmentation Engine

### 3.1 Segment Types

#### **Cohort Segmentation**
```typescript
const segment = await segmentation.createCohortSegment('new')
// Returns: Users joined last 7 days
```

**Available cohorts**:
- `new` - Joined last 7 days
- `month_1` - 7-30 days old
- `power` - 20+ questions answered
- `inactive` - No activity in 30 days

#### **Behavior Segmentation**
```typescript
const segment = await segmentation.createBehaviorSegment('high_engagement')
```

**Available behaviors**:
- `high_engagement` - Opened 50%+ emails, clicked 20%+
- `question_solvers` - 5+ answers in last week
- `course_viewers` - 3+ videos watched
- `no_engagement` - Never opened/clicked
- `premium_ready` - 70%+ trial progress in <15 days

#### **ML Churn Risk**
```typescript
const segment = await segmentation.createChurnRiskSegment()
// Automatic calculation based on:
// - Last engagement (30 points: 60+ days = high risk)
// - Open rate (25 points: <10% = high risk)
// - Click rate (15 points: <5% = high risk)
// - Study streak (20 points: <3 days = high risk)
// - No purchase (10 points: >30 days since buy = risk)
```

**Risk Levels**:
- `high` (risk_score > 0.6) → Churn-risk campaign
- `medium` (0.3-0.6) → Nurture campaign
- `low` (<0.3) → Standard engagement

### 3.2 Syncing Segments to Mailchimp

```typescript
// Send segment to Mailchimp as audience filter
await mailchimpClient.createSegment(
  audienceId,
  'High Engagement',
  {
    type: 'behavior',
    filters: {
      minOpenRate: 0.5,
      minClickRate: 0.2,
    }
  }
)

// Tag users with segment ID
await mailchimpClient.updateMemberTags(
  audienceId,
  userEmail,
  ['segment:high-engagement']
)
```

---

## 4. Webhook Integration

### 4.1 Mailchimp Webhook Setup

1. In Mailchimp Admin:
   - Settings → Webhooks
   - URL: `https://enempro.com.br/api/webhooks/mailchimp`
   - Events: Subscribe, Unsubscribe, Campaign Send, Campaign Click/Open

2. Copy webhook secret and add to `.env.local`:
```bash
MAILCHIMP_WEBHOOK_SECRET=abc123def456
```

### 4.2 Webhook Handler

Endpoint: `POST /api/webhooks/mailchimp`

**Handled Events**:
- `subscribe` - Add/update subscriber
- `unsubscribe` - Mark unsubscribed
- `campaign` - Update campaign metrics
- `list` - Sync profile updates

**Example webhook payload**:
```json
{
  "type": "subscribe",
  "fired_at": "2024-10-27T12:00:00Z",
  "data": {
    "email": "user@example.com",
    "merges": {
      "FNAME": "João",
      "LNAME": "Silva"
    }
  }
}
```

### 4.3 Testing Webhooks

```bash
# Send test webhook
curl -X POST http://localhost:3000/api/webhooks/mailchimp \
  -H "Content-Type: application/json" \
  -H "X-Mailchimp-Request-Signature: <signature>" \
  -d '{
    "type": "subscribe",
    "data": {
      "email": "test@example.com"
    }
  }'
```

---

## 5. A/B Testing Configuration

### 5.1 Creating Tests

```typescript
const abTesting = new ABTestingManager()

// Create subject line test
const test = await abTesting.createTest('campaign-123', 'nurture', {
  testType: 'subject',
  winningMetric: 'open_rate',
  testDuration: 24, // hours
  variants: [
    {
      name: 'Curious',
      subjectLine: '10 questões que você provavelmente erra',
      allocation: 50,
    },
    {
      name: 'Direct',
      subjectLine: 'Aula: Funções Quadráticas',
      allocation: 50,
    },
  ]
})

// Start test
await abTesting.startTest(test.id)
```

### 5.2 Test Types

**Subject Line Testing**:
```typescript
{
  testType: 'subject',
  variants: [
    { subjectLine: 'Line A' },
    { subjectLine: 'Line B' }
  ],
  winningMetric: 'open_rate'
}
```

**Send Time Optimization**:
```typescript
{
  testType: 'sendtime',
  variants: [
    { sendTime: '08:00' },  // Morning
    { sendTime: '20:00' }   // Evening
  ],
  winningMetric: 'open_rate'
}
```

**Content Testing**:
```typescript
{
  testType: 'content',
  variants: [
    { htmlContent: '<html>Version A</html>' },
    { htmlContent: '<html>Version B</html>' }
  ],
  winningMetric: 'click_rate'
}
```

### 5.3 Recommended Tests by Campaign

```typescript
// Get recommended tests
const tests = abTesting.getRecommendedTests('churnrisk')
// Returns: [subject test, send time test]

// Each campaign type has preset variants
```

### 5.4 Results & Winner Selection

```typescript
// After test duration, calculate results
const results = await abTesting.calculateTestResults(testId)
// Results: [{variantId, openRate, clickRate, ...}]

// Determine and apply winner
const winner = await abTesting.concludeTest(testId)
// Winner applied to campaign automatically
```

---

## 6. Metrics Dashboard

### 6.1 Dashboard Endpoint

**GET `/api/metrics/email-drip`**

Parameters:
```
?campaignType=nurture&startDate=2024-10-01&endDate=2024-10-31&groupBy=day
```

**Response**:
```json
{
  "summary": {
    "totalEmailsSent": 50000,
    "totalOpened": 8500,
    "totalClicked": 1700,
    "overallOpenRate": 0.17,
    "overallClickRate": 0.034,
    "overallConversionRate": 0.008
  },
  "campaigns": [
    {
      "campaignId": "onboarding",
      "campaignName": "Onboarding Sequence",
      "metrics": {
        "emailsSent": 5000,
        "opened": 1200,
        "rates": {
          "openRate": 0.24,
          "clickRate": 0.06
        }
      }
    }
  ],
  "segments": [
    {
      "segmentName": "High Engagement",
      "size": 1500,
      "engagementScore": 0.85,
      "estimatedChurnRisk": 0.12
    }
  ],
  "topPerformers": [
    {
      "campaignName": "Nurture Week 1",
      "openRate": 0.32,
      "metric": "open_rate"
    }
  ],
  "recommendations": [
    "Open rate below 20%. Try A/B testing subject lines."
  ]
}
```

### 6.2 Event Tracking

**POST `/api/metrics/email-drip/track`**

```json
{
  "userId": "user-123",
  "campaignId": "onboarding",
  "campaignType": "onboarding",
  "eventType": "open",
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.1"
  }
}
```

### 6.3 Key Metrics to Monitor

| Metric | Formula | Target | Action |
|--------|---------|--------|--------|
| **Open Rate** | Opens / Sent | >20% | A/B test subject |
| **Click Rate** | Clicks / Sent | >5% | Review CTA |
| **Conversion Rate** | Conversions / Sent | >1% | Optimize landing page |
| **Unsubscribe Rate** | Unsubscribes / Sent | <5% | Reduce frequency |
| **Bounce Rate** | Bounces / Sent | <2% | Clean list |

---

## 7. Campaign Automation Flow

### 7.1 Trigger Points

**On User Signup**:
```
1. Add to Mailchimp audience (webhook)
2. Assign to "new" cohort segment
3. Start onboarding campaign (Day 0)
4. Calculate churn risk score
```

**On User Activity**:
```
1. Update behavior segment
2. Tag with engagement level
3. Route to nurture or re-engagement
4. Recalculate churn risk
```

**On Churn Risk Detection**:
```
1. ML score > 0.6
2. Add to churn-risk segment
3. Send churn-risk campaign (Day 0)
4. Monitor response
5. If no engagement: increase discount offer
```

### 7.2 Campaign Scheduling

Use Supabase cron functions or Bull queue:

```typescript
// Cron: Run daily at 2 AM
const job = new CronJob('0 2 * * *', async () => {
  // 1. Find users due for next email
  const dueDripEmails = await getDueEmails()
  
  // 2. Send each email
  for (const email of dueDripEmails) {
    const template = getTemplate(email.campaignType, email.emailNumber)
    const personalized = personalizeTemplate(template, email.user)
    
    await mailchimpClient.sendTestEmail(campaignId, [email.user.email])
  }
  
  // 3. Log results
  await logDripCampaignRun()
})
```

---

## 8. Retention Impact Estimates

Based on industry benchmarks for drip campaigns:

### 8.1 Expected Improvements

| Metric | Before | With Drip | Improvement |
|--------|--------|-----------|-------------|
| **30-day retention** | 35% | 55% | +20pp |
| **60-day retention** | 15% | 35% | +20pp |
| **Premium conversion** | 2% | 5% | +3pp |
| **Customer LTV** | $50 | $120 | +140% |

### 8.2 Segment-Specific Projections

**Onboarding Campaign**:
- 70% open rate (3 emails)
- 15% upgrade rate from onboarding

**Churn Risk Campaign**:
- 40% open rate on re-engagement email
- 8% conversion on discount offer
- 12% monthly churn reduction

**Upgrade Campaign**:
- 25% open rate
- 3-5% conversion rate
- Avg deal value: R$ 99/month

---

## 9. Configuration Checklist

- [ ] Create Mailchimp OAuth application
- [ ] Set environment variables (.env.local)
- [ ] Run database migration (mailchimp-email-drip-schema.sql)
- [ ] Implement OAuth callback endpoint
- [ ] Setup webhook in Mailchimp admin
- [ ] Create and test 5 drip campaigns
- [ ] Create 4 audience segments
- [ ] Setup A/B test framework
- [ ] Configure metrics tracking
- [ ] Test end-to-end flow
- [ ] Deploy to production
- [ ] Monitor metrics dashboard

---

## 10. Files Reference

| File | Purpose |
|------|---------|
| `lib/mailchimp.ts` | Mailchimp API client, OAuth manager |
| `lib/segmentation.ts` | Segmentation engine (cohort, behavior, churn) |
| `lib/ab-testing.ts` | A/B testing framework |
| `lib/drip-email-templates.ts` | Email templates (12 campaigns) |
| `app/api/webhooks/mailchimp/route.ts` | Webhook handler |
| `app/api/metrics/email-drip/route.ts` | Metrics & analytics |
| `migrations/mailchimp-email-drip-schema.sql` | Database schema |

---

## 11. Support & Troubleshooting

### Common Issues

**OAuth Token Expiration**:
```typescript
// Automatically refresh when expired
if (new Date() >= config.oauth_expires_at) {
  const refreshed = await MailchimpOAuthManager.refreshAccessToken(...)
  await updateConfig(refreshed)
}
```

**Webhook Signature Validation Fails**:
```bash
# Verify secret in .env matches Mailchimp
# Check request signature calculation
```

**Segments Not Syncing**:
```bash
# Ensure user tags are being sent to Mailchimp
# Check audience ID in config
# Verify API permissions
```

---

## Next Steps

1. **Week 1**: OAuth & infrastructure setup
2. **Week 2**: Campaign creation & testing
3. **Week 3**: Segmentation & audience sync
4. **Week 4**: A/B testing & optimization
5. **Week 5**: Production monitoring & refinement

Expected time to full implementation: **5 weeks**
