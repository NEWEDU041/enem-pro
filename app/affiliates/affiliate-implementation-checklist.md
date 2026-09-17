# Affiliate Integration Implementation Checklist

Quick reference guide for integrating affiliate links into enem-pro blog posts.

---

## Pre-Implementation (Week 1)

### Enrollment & Account Setup

- [ ] **Udemy Affiliate Network**
  - [ ] Visit: https://www.udemy.com/affiliate/
  - [ ] Apply with site URL: questoesenem.pro
  - [ ] Wait for approval (1–3 days)
  - [ ] Note: Affiliate Dashboard URL
  - [ ] Generate test links for top 5 courses
  - [ ] Document: API credentials in secure password manager

- [ ] **Descomplica Direct Partnership**
  - [ ] Email: parcerias@descomplica.com.br
  - [ ] Subject: "Parceria Afiliado — questoesenem.pro"
  - [ ] Include: 3-month traffic projections, 3 sample posts
  - [ ] Request: CPA (R$40) + Revenue Share (18%)
  - [ ] Request: Promo code (e.g., ENEMPREP-DESCOMPLICA-2026)
  - [ ] Once approved, document contact person + contract terms

- [ ] **Stoodi/Hotmart Integration**
  - [ ] Visit: https://www.hotmart.com/
  - [ ] Search for: Stoodi ENEM courses
  - [ ] Create affiliate account
  - [ ] Generate sample links for 3 products
  - [ ] OR contact: vendas@stoodi.com.br for direct partnership
  - [ ] Note: Commission rates (20–30%)

- [ ] **Amazon Associates**
  - [ ] Visit: https://associados.amazon.com.br/
  - [ ] Create account + verify site
  - [ ] Generate 5 sample links for ENEM books
  - [ ] Enable Product Linking Tool
  - [ ] Note: API credentials (if available)

### Master Tracking Setup

- [ ] Create Google Sheet: "ENEM Pro — Affiliate Tracking"
- [ ] Columns to add:
  - [ ] Affiliate Name
  - [ ] Sign-up Date
  - [ ] API Credentials (encrypted)
  - [ ] Dashboard URL
  - [ ] Contact Person
  - [ ] Monthly Revenue
  - [ ] Status (Active/Paused/Inactive)
  - [ ] Last Updated
- [ ] Share with team (read-only link for stakeholders)

---

## Compliance & Templates (Week 2)

### Legal & Disclosure Pages

- [ ] Create `/divulgacao-afiliados` page (use provided MDX template)
  - [ ] LGPD disclosures
  - [ ] Partner list with commission rates
  - [ ] FAQ section
  - [ ] Privacy data sharing explanation
  
- [ ] Amend `/privacidade` page
  - [ ] Add section: "Links de Afiliados e Cookies"
  - [ ] Explain Descomplica, Udemy, Amazon cookies
  - [ ] Link to partner privacy policies
  - [ ] LGPD rights section

- [ ] Create inline disclosure banner
  - [ ] Text (PT-BR): "🔗 Divulgação de Afiliado: Este artigo contém links de afiliados..."
  - [ ] Text (EN): "🔗 Affiliate Disclosure: This post contains affiliate links..."
  - [ ] Add styling (background color: #f0f4f8, border-left: blue)

### Code Components

- [ ] Implement `AffiliateLink` React component (provided)
  - [ ] Location: `lib/components/AffiliateLink.tsx`
  - [ ] Props: href, affiliate, text, disclosure, className
  - [ ] Includes: UTM tracking, disclosure badge, styling
  
- [ ] Implement `AffiliateLinkGroup` component (optional)
  - [ ] For multi-affiliate comparison posts
  - [ ] Location: `lib/components/AffiliateLink.tsx` (same file)
  
- [ ] Implement `AffiliateDisclosure` component
  - [ ] For full disclosure box in posts
  - [ ] Region support: 'br' (LGPD) and 'us' (FTC)

---

## Content Placement (Week 3)

### Identify High-Intent Posts (60 posts)

- [ ] Pull traffic data from GA4 for 2 months
- [ ] Filter: posts with keywords like:
  - "Curso"
  - "Descomplica"
  - "Udemy"
  - "Melhor"
  - "Comparar"
  - "Guia Completo"
  - "1000 Pontos"
- [ ] Rank by traffic (monthly visitors)
- [ ] Select top 20 posts by traffic
- [ ] Document in spreadsheet: "Top 20 High-Intent Posts"

### Identify Medium-Intent Posts (150 posts)

- [ ] Filter: subject-specific posts (Math, Physics, Chemistry, etc.)
- [ ] Exclude low-traffic posts (<100 monthly visitors)
- [ ] Document top 50 posts in spreadsheet: "Medium-Intent Posts"

### Create Content Placement Map

**For each of top 20 high-intent posts:**

- [ ] Post Title: _______________
- [ ] Slug: _______________
- [ ] Primary Affiliate: [ ] Descomplica [ ] Udemy [ ] Stoodi [ ] Amazon
- [ ] Secondary Affiliate (optional): _______________
- [ ] Placement Options:
  - [ ] Inline CTA (text section)
  - [ ] Sidebar widget
  - [ ] Footer resource box
  - [ ] Both inline + sidebar
- [ ] CTA Text: _______________
- [ ] Affiliate Link (final URL with UTM): _______________
- [ ] Expected Traffic/Month: _______________
- [ ] Expected CTR: _____ %

**Template Row:**
| Post Slug | Title | Primary | Secondary | Placement | CTA Text | Link | Status |
|-----------|-------|---------|-----------|-----------|----------|------|--------|
| preparar-redacao-enem-2026 | Como Preparar Redação para ENEM 2026 | Descomplica | Udemy | Inline + Footer | Comece com Descomplica | [link] | Pending |

---

## Implementation in Blog Posts (Week 3-4)

### For Each Selected Post:

1. **Inline CTA** (High-intent posts only)
   ```markdown
   ## Acelere Sua Preparação
   
   <AffiliateLink
     href="https://descomplica.com.br/?ref=ENEMPREP-DESC"
     affiliate="descomplica"
     text="👉 Comece com Descomplica (Aulas ao Vivo)"
   />
   ```

2. **Sidebar Widget** (Medium & High-intent)
   ```jsx
   <AffiliateWidget 
     type="course-recommendation"
     programs={['descomplica']}
     className="sidebar-widget"
   />
   ```

3. **Footer Resource Box** (All posts with links)
   ```markdown
   ---
   
   **Recursos Adicionais:**
   - [Aulas Descomplica](link with UTM)
   - [Livros ENEM Amazon](link with UTM)
   
   > **Divulgação:** Links de afiliado — sem custo adicional
   ```

4. **Frontmatter Metadata** (Required for all posts with affiliates)
   ```yaml
   ---
   title: "Post Title"
   affiliates:
     - name: "descomplica"
       link: "https://..."
       placement: "inline"
       disclosure: true
   ---
   ```

### Testing Checklist (Before Publishing)

- [ ] Link is not broken (HTTP 200)
- [ ] Link has correct UTM parameters
- [ ] Disclosure badge appears correctly
- [ ] Link opens in new tab (if external)
- [ ] Mobile rendering looks good
- [ ] Disclosure text is visible and clear
- [ ] Affiliate URL has correct promo code
- [ ] Post grammar/spelling reviewed
- [ ] Internal links still work

---

## Launch & Monitoring (Week 4)

### Go-Live Preparation

- [ ] `/divulgacao-afiliados` page is published
- [ ] `/privacidade` page is updated with LGPD section
- [ ] 5–10 high-intent posts have affiliate links added
- [ ] `AffiliateLink` component is built and tested
- [ ] GA4 custom reports are created (see below)
- [ ] Affiliate dashboards are accessible

### GA4 Setup

**Create custom report: "Affiliate Performance"**

- [ ] Filter: `utm_medium = "affiliate"`
- [ ] Dimensions: `utm_source`, `utm_campaign`, `utm_content`
- [ ] Metrics: Sessions, Users, Conversions, Revenue
- [ ] Time period: Monthly
- [ ] Set up real-time alerts for high-traffic affiliates

**Create dashboard: "Monthly Affiliate Metrics"**

- [ ] Metric 1: Total clicks by affiliate (utm_source)
- [ ] Metric 2: Click-through rate by post
- [ ] Metric 3: Time-on-page for affiliate pages
- [ ] Metric 4: Top 10 posts by affiliate traffic
- [ ] Metric 5: Trend (month-over-month)

### First 30 Days Monitoring

**Daily (First 7 Days):**
- [ ] Check affiliate dashboards for link validity
- [ ] Monitor GA4 real-time data
- [ ] Check for reader complaints (email/comments)
- [ ] Verify disclosure badges are visible on all posts

**Weekly (Weeks 1-4):**
- [ ] Compile weekly affiliate click data (from GA4 + dashboards)
- [ ] Update master tracking sheet
- [ ] Identify top 3 performing posts
- [ ] Identify 0-click posts (remove/optimize)
- [ ] A/B test CTA button colors/text on 2 posts

**Monthly (End of Month):**
- [ ] Generate full affiliate revenue report (all 4 platforms)
- [ ] Calculate ROI: revenue / content creation cost
- [ ] Compare projections vs actual data
- [ ] Plan optimizations for next month

---

## Ongoing Operations (Monthly)

### 1st of Every Month

- [ ] [ ] Export earnings from all affiliate dashboards (PDF/CSV)
- [ ] [ ] Cross-reference GA4 UTM data
- [ ] [ ] Update master tracking sheet
- [ ] [ ] Calculate total revenue by affiliate
- [ ] [ ] Calculate RPM (revenue per 1,000 visitors)
- [ ] [ ] Generate client report (if applicable)

### Mid-Month

- [ ] [ ] A/B test 3 posts:
  - Button text: "Explore" vs "Learn More" vs "Start Now"
  - Button color: Primary vs secondary brand color
  - Placement: Inline vs sidebar
- [ ] [ ] Review underperforming posts:
  - 0 clicks in 30 days? → Remove or reposition link
  - <1% CTR? → Improve CTA relevance or placement
- [ ] [ ] Reach out to affiliates for new products/promotions
  - Descomplica: New courses? Updated pricing?
  - Udemy: Course sales/bundles?
  - Amazon: New ENEM book releases?

### End of Month

- [ ] [ ] Finalize monthly report
- [ ] [ ] Plan next month's content & affiliate strategy
- [ ] [ ] Review reader feedback on affiliate links
- [ ] [ ] Update `/divulgacao-afiliados` with new programs (if added)

---

## Red Flags & Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Affiliate link returns 404 | Partner updated URL | Contact partner, update link |
| 0 clicks in 7 days | Link not visible or CTR too low | Reposition, improve CTA text, A/B test |
| Affiliate dashboard shows no earnings | Click not attributed | Check UTM parameters, contact support |
| Reader complaints about disclosure | Disclosure not visible | Increase font size, change colors, top of post |
| High CTR but low conversion | Wrong audience | Ensure link matches post intent |
| Commission rate changed | Affiliate policy update | Review contract, renegotiate or switch |

---

## Success Metrics

**Target KPIs (First Month):**
- [ ] 10–20 clicks per high-intent post (by CTR 3–5%)
- [ ] 1–2 clicks per medium-intent post (by CTR 0.5–1%)
- [ ] 0 reader complaints about affiliate links
- [ ] 100% of disclosure badges visible
- [ ] 0 broken links

**Target Revenue (3–6 Months):**
- Conservative: R$6,240/month (US$1,250)
- Moderate: R$9,059/month (US$1,812)
- Optimistic: R$14,100/month (US$2,820)

---

## Resources & Links

**Affiliate Programs:**
- Udemy: https://www.udemy.com/affiliate/
- Descomplica: parcerias@descomplica.com.br
- Stoodi/Hotmart: https://www.hotmart.com/ or vendas@stoodi.com.br
- Amazon: https://associados.amazon.com.br/

**Tools:**
- GA4 URL builder: https://ga-dev-tools.google/ga4/campaign-url-builder/
- Link shortener: https://bit.ly/ or https://short.link/
- Component: `lib/components/AffiliateLink.tsx`

**Documentation:**
- Main strategy: `enem-pro-affiliate-strategy.md`
- Disclosure page: `divulgacao-afiliados-page.mdx`
- Compliance: `/privacidade`, `/terms`

**Contact:**
- Affiliate coordination: [owner email]
- Technical questions: [dev email]
- Legal/compliance: [legal email]

---

**Last Updated:** September 16, 2026
**Next Review:** October 16, 2026 (post-launch audit)
