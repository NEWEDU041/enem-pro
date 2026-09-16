# Phase 1 — Email Lead Funnel + Nurture

**Opportunity:** Convert 3-5% of blog traffic to email subscribers  
**Expected revenue:** $800-2,000/mo (500-2K new subs/mo × 30% trial-to-paid)  
**Effort:** 16-20 hours  
**Timeline:** 4 weeks

---

## **1. Email Funnel Architecture**

### **Capture Points**

| Point | Format | Target CTR | Est. Conversions/mo |
|-------|--------|-----------|-------------------|
| **Blog sidebar** | Form (email) | 2-4% | 120-240 subs |
| **Post exit-intent** | Pop-up (discount) | 3-5% | 180-300 subs |
| **Newsletter CTA** (footer) | Banner link | 1-2% | 60-120 subs |
| **Free quiz/PDF** | Gated download | 8-12% | 480-720 subs |
| **TOTAL** | — | — | **500-1,380 subs/mo** |

**Conservative estimate:** 500-1K new subscribers/month  
**At 30% trial-to-paid:** 150-300 new paying users/month = $4.5K-9K MRR

---

## **2. Lead Magnets (High-Converting Downloadables)**

### **Primary: "ENEM 2026 Study Schedule — 90-Day Plan"** (Gated PDF)
- **Format:** Downloadable calendar (PDF + Google Sheets)
- **Content:** Day-by-day study schedule for 90 days before ENEM
- **Estimated conversions:** 480-720 downloads/mo
- **Est. value:** 150-220 trial signups/mo
- **Effort:** 4 hours (create template + design)

**Structure:**
- Week 1-4: Foundation (history, geography)
- Week 5-8: Core (math, Portuguese, science)
- Week 9-12: Practice tests + weak areas
- Daily breakdown (2-4 hours/day recommended)
- Printable + digital versions

### **Secondary: "ENEM Essay Template + 3 High-Scoring Examples"** (Email-gated)
- **Format:** Downloadable Word doc + PDF
- **Conversions:** 240-360/mo
- **Effort:** 3 hours

### **Tertiary: "ENEM Questions by Difficulty (500 Practice Questions)"** (Quiz-gated)
- **Format:** Quiz → filtered results → gate download
- **Conversions:** 180-300/mo
- **Effort:** 5 hours (curate + export)

---

## **3. Email Sequences (Nurture Path)**

### **Welcome Sequence (Day 1-3)**

**Email 1 (Day 0):** Welcome + deliver lead magnet
```
Subject: "Seu cronograma ENEM 2026 está pronto! 📅"
Body:
- Welcome to ENEM Pro
- Link: Download 90-day schedule
- CTA: Start free trial today
```
**Est. open rate:** 40-50%  
**Est. CTR:** 15-20%

**Email 2 (Day 1):** Social proof + free trial offer
```
Subject: "+2,000 students used this schedule to pass ENEM"
Body:
- Success stories (3 testimonials)
- CTA: Start 7-day free trial
```

**Email 3 (Day 3):** Educational content (top 3 ENEM tips)
```
Subject: "3 mistakes 95% of ENEM students make"
Body:
- Mistake 1 + how to avoid
- Mistake 2 + how to avoid
- Mistake 3 + how to avoid
- Soft CTA: Upgrade to Pro for detailed strategies
```

---

### **Weekly Engagement Sequence (Day 7+)**

**Monday:** Weekly study tip  
**Wednesday:** Problem set + solution  
**Friday:** Mindset/motivational email  

**Goal:** Keep 40%+ engagement, feed 10-15% to trial conversion

---

### **Trial Conversion Sequence (After signup)**

**Day 1:** First feature tutorial (practice test builder)  
**Day 3:** Aha moment (completion of 1st practice test)  
**Day 7:** "Your score improved by X%" (if available)  
**Day 14:** Upgrade offer (first discount, 50% off annual)  

---

## **4. Technical Setup (Resend + Supabase)**

### **Email Provider: Resend**
- Already integrated (dependency in package.json)
- Cost: $20-50/mo for 10K emails

### **Database: Supabase (PostgreSQL)**
- New table: `subscribers`
  ```sql
  CREATE TABLE subscribers (
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
  ```

---

## **5. Implementation Checklist (4 Weeks)**

### **Week 1: Sequence Design & Copy** (6h)
- [ ] Write 3 welcome emails (30 min each)
- [ ] Write 4 weekly emails template (45 min each)
- [ ] Write trial conversion sequence (2h)
- [ ] Design email templates (Resend templates)

### **Week 2: Lead Magnet Creation** (6h)
- [ ] Create 90-day study schedule PDF (3h)
- [ ] Create essay template + examples (2h)
- [ ] Set up quiz gating logic (1h)

### **Week 3: Frontend Integration** (4h)
- [ ] Add email capture form to blog sidebar (1.5h)
- [ ] Add exit-intent pop-up (1.5h)
- [ ] Add footer newsletter CTA (1h)

### **Week 4: Testing & Launch** (4h)
- [ ] Test capture forms (1h)
- [ ] Send test sequence (1h)
- [ ] Monitor deliverability (1h)
- [ ] Publish + monitor signup rate (1h)

### **TOTAL: 20h over 4 weeks**

---

## **6. Expected Outcomes (Month 1)**

| Metric | Conservative | Optimistic |
|--------|-------------|-----------|
| **Email signups** | 500 | 1,000 |
| **Welcome email opens** | 200 (40%) | 500 (50%) |
| **Free trial starts** | 75 (15% of opens) | 200 (40%) |
| **Trial → Paid conversion** | 22 (30%) | 60 (30%) |
| **New MRR from email** | $660 | $1,800 |

**6-month projection:** 3K-6K subscribers, $2K-5K/mo MRR

---

## **7. Integrations (Via Resend API)**

```javascript
// Subscribe endpoint (API route)
POST /api/subscribe
Body: { email, leadMagnet, utmSource }
Response: { success, downloadUrl, trialLink }

// Trigger welcome sequence
POST /api/email/welcome
Body: { email, leadMagnet }

// Track email opens/clicks
GET /api/email/stats/{campaignId}
```

---

## **Status**

- [ ] Email sequences drafted
- [ ] Lead magnets created
- [ ] Supabase table created
- [ ] Frontend forms built
- [ ] Resend configuration tested
- [ ] Launch

---

## **ROI Calculation**

```
Investment:
- Time: 20 hours @ $50/hr = $1,000
- Email service: $20-30/mo
- Total: ~$1,200 setup + $300/mo ongoing

Return (Year 1):
- 3K-6K subscribers × 30% trial → 900-1,800 paying users
- At R$99/yr = R$89.1K-178.2K revenue
- Cost: $1,200 setup + $3,600 service = $4,800
- ROI: 18.5x - 37x
```

**This is the highest-ROI project in Phase 1.**

