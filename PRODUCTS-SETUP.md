# Premium Products Setup & Configuration

Quick reference for deploying the premium products system.

## Prerequisites

- ✅ Supabase project configured
- ✅ Next.js 13+ with App Router
- ✅ Zod for validation
- ✅ Node 18+

## Environment Variables

Add to `.env.local`:

```bash
# Existing (no changes needed)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# New (for email sending - optional for Phase 1)
RESEND_API_KEY=re_xxxx  # From resend.com
SENDGRID_API_KEY=SG.xxx # Alternative to Resend
```

## Deployment Steps

### 1. Run Supabase Migration

```bash
# Local development
supabase migration up

# Or apply manually in Supabase console:
# - Copy SQL from: supabase/migrations/20260916_premium_products.sql
# - Paste into SQL editor
# - Run
```

### 2. Verify Database Tables

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'premium_subscribers',
  'product_downloads',
  'trial_offers',
  'product_analytics',
  'email_verifications'
);
```

### 3. Test API Endpoints

```bash
# Test subscribe endpoint
curl -X POST http://localhost:3000/api/products/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "productId": "formula-sheet",
    "productName": "ENEM 2026 Formula Sheet"
  }'

# Expected response:
# {
#   "success": true,
#   "downloadUrl": "/downloads/formula-sheet.pdf",
#   "offerCode": "TRIALA1B2C3",
#   "message": "Email capturado com sucesso!"
# }

# Test analytics endpoint
curl http://localhost:3000/api/products/analytics?period=30

# Expected response:
# {
#   "summary": {
#     "totalSubscribers": 1,
#     "totalDownloads": 1,
#     ...
#   },
#   ...
# }
```

### 4. Create PDF Files

**Quick Option: Use Placeholder PDFs**

```bash
# For testing, create dummy PDFs in public/downloads/
mkdir -p public/downloads

# Create empty PDFs (for testing)
touch public/downloads/formula-sheet.pdf
touch public/downloads/practice-test.pdf
touch public/downloads/essay-template.pdf
touch public/downloads/study-checklist.pdf
```

**Proper Option: See PRODUCTS-PDF-CREATION.md**

### 5. Test Landing Pages

```bash
# Start dev server
npm run dev

# Visit pages:
# - http://localhost:3000/recursos (hub)
# - http://localhost:3000/recursos/formula-sheet
# - http://localhost:3000/recursos/practice-test
# - http://localhost:3000/recursos/essay-template
# - http://localhost:3000/recursos/study-checklist

# Try submitting email and downloading
```

### 6. Add Navigation Link

Edit `app/layout.tsx` or main navigation component:

```tsx
<Link href="/recursos">
  Recursos Premium
</Link>
```

Or in `app/page.tsx` (landing page):

```tsx
<Link href="/recursos" className="...">
  Baixe Recursos Grátis →
</Link>
```

### 7. Monitor with Analytics

Visit `/api/products/analytics?period=30` to see:
- Total subscribers
- Downloads by product
- Trial code metrics
- Email domain distribution

### 8. Setup Email Sending (Phase 2)

When ready, add email sending:

```bash
npm install resend
```

Create `app/api/products/send-confirmation/route.ts`:

```typescript
import { Resend } from 'resend';

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { email, productName, downloadUrl, offerCode } = await request.json();

  await resend.emails.send({
    from: 'noreply@enemprep.com.br',
    to: email,
    subject: `Seu ${productName} está pronto`,
    html: `
      <h2>Seu download está pronto!</h2>
      <p><a href="${downloadUrl}">Clique aqui para baixar</a></p>
      <hr />
      <h3>Ganhe 50% OFF no ENEM Pro</h3>
      <p>Código: <strong>${offerCode}</strong></p>
    `,
  });

  return Response.json({ success: true });
}
```

Then call from `/api/products/subscribe`:

```typescript
// After successful subscribe
await fetch('/api/products/send-confirmation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email,
    productName,
    downloadUrl: data.downloadUrl,
    offerCode: data.offerCode,
  }),
});
```

## Troubleshooting

### "Supabase tables not found"
- Ensure migration was run: `supabase migration up`
- Check Supabase console → SQL Editor
- Verify RLS policies are enabled

### "POST /api/products/subscribe returning 500"
- Check server logs: `npm run dev` console
- Verify Supabase env vars in `.env.local`
- Test Supabase connection: `curl http://localhost:3000/api/products/analytics`

### "PDF not downloading"
- Verify file exists: `ls -la public/downloads/`
- Check file permissions: `chmod 644 public/downloads/*.pdf`
- Test route: `curl -I http://localhost:3000/downloads/formula-sheet`

### "Analytics showing 0 subscribers"
- Check if records inserted: `SELECT * FROM premium_subscribers;` in Supabase
- Verify RLS allows reads: `SELECT * FROM product_analytics;`
- Check CORS headers in API response

## Performance Optimization

### Index Queries
Indexes are created by migration. Verify:

```sql
SELECT * FROM pg_indexes 
WHERE tablename IN (
  'premium_subscribers',
  'product_downloads',
  'trial_offers',
  'product_analytics'
);
```

### Cache Downloads
Download handler returns 24-hour cache header. Verify:

```bash
curl -I http://localhost:3000/downloads/formula-sheet
# Should show: Cache-Control: public, max-age=86400
```

### Optimize PDFs
Target file sizes:
- Formula Sheet: 2 MB
- Practice Test: 8 MB
- Essay Template: 6 MB
- Study Checklist: 3 MB

Total: ~19 MB (acceptable)

## Testing Checklist

- [ ] Supabase tables exist and are queryable
- [ ] Email form accepts and validates emails
- [ ] Download URLs are generated correctly
- [ ] Trial codes are unique and non-expired
- [ ] Analytics endpoint returns data
- [ ] PDF downloads work (test in browser)
- [ ] Landing pages load without errors
- [ ] Mobile responsive (test on phone)
- [ ] Links to `/planos` work
- [ ] Upsell cards display offer codes

## Production Deployment

```bash
# 1. Commit all changes
git add app/ supabase/
git commit -m "feat: Premium products system"

# 2. Push to production branch
git push origin main

# 3. Vercel will auto-deploy
# Check: https://vercel.com/your-project

# 4. Run migrations on production database
# Via Supabase console or CLI:
# supabase link --project-ref=xxx
# supabase migration push

# 5. Test production URLs
# https://yourdomain.com/recursos
# https://yourdomain.com/api/products/analytics
```

## Weekly Monitoring

```bash
# Check subscribers growth
curl https://yourdomain.com/api/products/analytics?period=7

# Monitor conversion rates
# - Email submissions → downloads
# - Downloads → trial claims
# - Trial claims → paid subscriptions

# Watch email delivery (if sending)
# - Bounce rates < 2%
# - Click rates > 20%

# Adjust based on data
# - Best-performing product
# - Best CTA copy
# - Best landing page design
```

## Support & Questions

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Zod Docs:** https://zod.dev

