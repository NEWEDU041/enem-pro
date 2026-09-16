# Email Lead Capture Funnel — Integration Guide

This guide explains how to use the email lead capture components in your enem-pro app.

## Components Overview

### 1. **BlogSidebarForm** ✅
Email capture form for blog sidebars. Displays a clean form asking for email in exchange for a 90-day study schedule.

**Location:** `/components/BlogSidebarForm.tsx`

**Usage in Blog Sidebar:**
```tsx
// app/blog/[slug]/page.tsx (or any blog template)
import BlogSidebarForm from '@/components/BlogSidebarForm'

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return (
    <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <article className="lg:col-span-2">
        {/* Your blog content */}
      </article>

      <aside className="space-y-6">
        <BlogSidebarForm leadMagnet="cronograma_enem" />
        {/* Other sidebar widgets */}
      </aside>
    </main>
  )
}
```

**Props:**
- `leadMagnet?`: `string` — Type of lead magnet (default: `"cronograma_enem"`)

**Features:**
- Mobile-responsive form
- Email validation
- Success feedback
- Error handling with user-friendly messages
- Accessible (ARIA labels, keyboard navigation)

---

### 2. **ExitIntentPopup** ✅
Triggers a high-converting popup when the user attempts to leave (mouse leaves viewport). Shows a discount offer (50% off first month).

**Location:** `/components/ExitIntentPopup.tsx`

**Global Integration:**
The component is already added to `/app/layout.tsx`, so it appears on all pages automatically.

**Features:**
- Fires only once per session (uses `sessionStorage`)
- Exit-intent detection via `mouseleave` event
- 50% discount offer for conversion lift
- Success confirmation state
- Accessible close button and keyboard support

**Customization:**
To adjust trigger timing or appearance, edit:
- Line 20: `if (e.clientY <= 0)` — Adjust sensitivity
- Line 29: `setIsOpen(true)` — Add delay before showing
- Props: None (global component)

---

### 3. **FooterNewsletterCTA** ✅
Simple, branded newsletter signup banner for footers. Converts weekly newsletter signups.

**Location:** `/components/FooterNewsletterCTA.tsx`

**Usage in Footer:**
```tsx
// app/layout.tsx or a Footer component
import FooterNewsletterCTA from '@/components/FooterNewsletterCTA'

export default function Footer() {
  return (
    <footer className="bg-zinc-50 border-t border-zinc-200">
      <div className="container mx-auto px-4 py-12 space-y-8">
        <FooterNewsletterCTA />
        
        {/* Other footer content */}
      </div>
    </footer>
  )
}
```

**Props:** None

**Features:**
- Gradient background for visual appeal
- Success feedback after submission
- Mobile-responsive design
- Accessible form with ARIA labels

---

## API Endpoint

### POST `/api/subscribe`

**Location:** `/app/api/subscribe/route.ts`

**Request Body:**
```typescript
{
  email: string                    // User's email (required)
  leadMagnet?: string             // Type of lead magnet (default: "cronograma_enem")
  utmSource?: string              // UTM source (default: "website")
  utmMedium?: string              // UTM medium (default: "organic")
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Inscrição realizada com sucesso! Verifique seu email.",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2026-09-16T..."
  }
}
```

**Error Responses:**
- **400**: Invalid email format
- **409**: Email already subscribed
- **500**: Database error

**Database Table:** `subscribers`
```sql
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  subscribed_at TIMESTAMP DEFAULT NOW(),
  lead_magnet VARCHAR(255) DEFAULT 'cronograma_enem',
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100)
);
```

---

## Integration Steps

### Step 1: Add to Blog Template
Edit `/app/blog/[slug]/page.tsx` to add the sidebar form:

```tsx
import BlogSidebarForm from '@/components/BlogSidebarForm'

export default function BlogPostPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <article className="lg:col-span-2">
        {/* Blog content */}
      </article>
      <aside className="space-y-6">
        <BlogSidebarForm leadMagnet="cronograma_enem" />
      </aside>
    </div>
  )
}
```

### Step 2: Add to Footer (Optional)
Edit your footer component:

```tsx
import FooterNewsletterCTA from '@/components/FooterNewsletterCTA'

export default function Footer() {
  return (
    <footer>
      <FooterNewsletterCTA />
    </footer>
  )
}
```

### Step 3: Verify Database Table
Ensure the `subscribers` table exists in Supabase:

```sql
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  subscribed_at TIMESTAMP DEFAULT NOW(),
  trial_started_at TIMESTAMP,
  trial_expires_at TIMESTAMP,
  is_paid BOOLEAN DEFAULT FALSE,
  lead_magnet VARCHAR(255),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100)
);

CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_created_at ON subscribers(created_at);
CREATE INDEX idx_subscribers_lead_magnet ON subscribers(lead_magnet);
```

### Step 4: Test Locally
```bash
npm run dev
# Visit http://localhost:3000/blog
# Test sidebar form
# Move mouse out of window to trigger exit-intent popup
# Test success/error states
```

### Step 5: Deploy
```bash
git add .
git commit -m "feat: add email lead capture funnel (sidebar, exit-intent, footer)"
git push origin main
```

---

## Lead Magnet Types

Track different conversion sources by setting the `leadMagnet` field:

| Value | Description | Used By |
|-------|-------------|---------|
| `cronograma_enem` | 90-day study schedule | Blog sidebar |
| `plano_estudos_desconto` | Study plan + 50% discount | Exit-intent popup |
| `newsletter_semanal` | Weekly tips newsletter | Footer CTA |

---

## Analytics Integration

### Track Conversions in GA4
Add event tracking to components:

```tsx
// In any component's handleSubmit:
import { useEffect } from 'react'

useEffect(() => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'lead_form_submit', {
      'event_category': 'engagement',
      'event_label': 'blog_sidebar_form',
      'lead_magnet': 'cronograma_enem'
    })
  }
}, [submitted])
```

### Segment Subscribers
Query Supabase to segment by lead magnet:

```sql
-- Count by lead magnet
SELECT lead_magnet, COUNT(*) as count
FROM subscribers
GROUP BY lead_magnet
ORDER BY count DESC;

-- Daily signups
SELECT 
  DATE(created_at) as date,
  COUNT(*) as signups
FROM subscribers
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top sources
SELECT utm_source, utm_medium, COUNT(*) as count
FROM subscribers
GROUP BY utm_source, utm_medium
ORDER BY count DESC;
```

---

## Expected Performance

Based on industry benchmarks:

| Metric | Conservative | Optimistic |
|--------|-------------|-----------|
| Blog sidebar CTR | 2-4% | 5-8% |
| Exit-intent conversion | 3-5% | 7-10% |
| Footer newsletter CTR | 1-2% | 2-3% |
| **Monthly subscribers** | **500-600** | **1,000-1,200** |

At 30% trial-to-paid conversion:
- Conservative: 150-180 paying users/month × R$99 = R$14.8K-17.8K MRR
- Optimistic: 300-360 paying users/month × R$99 = R$29.7K-35.6K MRR

---

## Troubleshooting

### Form not submitting
1. Check that `/api/subscribe` endpoint exists
2. Verify Supabase credentials in `.env.local`
3. Check browser console for network errors
4. Ensure CORS is configured if using a different domain

### Email validation failing
1. Check email regex in `/app/api/subscribe/route.ts` (line ~50)
2. Ensure input type is `email`

### Database insert failing
1. Verify `subscribers` table exists in Supabase
2. Check that service role key has write permissions
3. Ensure `email` column has UNIQUE constraint

### Exit-intent not triggering
1. Check browser's mouse position detection
2. Verify `sessionStorage` is enabled
3. Test in incognito mode (fresh session)
4. Check developer console for errors

---

## Next Steps

### Immediate
- [ ] Add `BlogSidebarForm` to all blog post templates
- [ ] Test all three components locally
- [ ] Deploy to staging and verify database writes

### Short-term (Week 1-2)
- [ ] Set up email automation with Resend/Brevo
- [ ] Create welcome email sequence (3 emails)
- [ ] Monitor analytics dashboard

### Medium-term (Month 1)
- [ ] A/B test copy variations
- [ ] Adjust form placement and styling
- [ ] Analyze which lead magnets convert best
- [ ] Launch secondary lead magnets

### Long-term (Quarter 1)
- [ ] Build email nurture sequence (12 emails)
- [ ] Create gated PDF resources
- [ ] Implement SMS follow-up
- [ ] Launch referral program

---

## Questions?

Reference the Phase 1 Email Funnel plan:
`/content-sprints/PHASE1_EMAIL_FUNNEL.md`
