# Phase 7 Deployment Checklist

## Pre-Deployment Review (Complete before going live)

- [ ] **Calendar Review**
  - [ ] CSV file exists and contains 208 posts (209 rows with header)
  - [ ] All 52 weeks covered with 4 posts per week
  - [ ] Date ranges are continuous and correct
  - [ ] No encoding errors in titles or keywords

- [ ] **Content Distribution Check**
  - [ ] All 9 subjects covered equally (~23 posts each)
  - [ ] All 9 content types represented
  - [ ] SEO priorities: 70 high, 92 medium, 46 low
  - [ ] Difficulty progression: easy→medium→hard

- [ ] **SEO Preparation**
  - [ ] Keywords updated in GSC Search Console
  - [ ] Sitemap submission scheduled
  - [ ] robots.txt allows /blog/ indexing
  - [ ] Open Graph tags in post templates
  - [ ] Meta descriptions populated

- [ ] **Technical Setup**
  - [ ] Post template created and tested
  - [ ] Markdown formatting validated
  - [ ] Category taxonomy ready (9 subjects)
  - [ ] Tag standardization complete

## Week 1 Deployment (Approval Gate)

- [ ] **Content Generation**
  - [ ] Generate 4 posts for Week 1
  - [ ] Proof-read and edit
  - [ ] Add internal links to existing high-traffic posts
  - [ ] Optimize title/description for CTR

- [ ] **Testing**
  - [ ] Run `npm run build` - no errors
  - [ ] Test local deployment: `npm run dev`
  - [ ] Verify post pages render correctly
  - [ ] Check mobile responsiveness

- [ ] **Version Control**
  - [ ] Commit: `git add . && git commit -m "feat(phase-7): Week 1 content calendar posts"`
  - [ ] Push: `git push origin main`
  - [ ] Verify CI/CD pipeline passes

- [ ] **Vercel Deployment**
  - [ ] Deploy to staging: `vercel deploy`
  - [ ] Test staging URLs load correctly
  - [ ] Deploy to production: `vercel deploy --prod`
  - [ ] Verify production URLs working

- [ ] **Post-Deployment Verification**
  - [ ] URLs indexable in GSC
  - [ ] Canonical tags set correctly
  - [ ] No 404s or redirects needed
  - [ ] Analytics tracking firing

## Ongoing Weekly Deployment

### Each Monday (before deployment)
- [ ] Generate 4 posts for the current week
- [ ] Edit and proof-read
- [ ] Add internal cross-links
- [ ] Schedule social media posts

### Each Wednesday
- [ ] Test staging: `vercel deploy`
- [ ] QA check: all pages rendering correctly
- [ ] Verify no build errors: `npm run build`

### Each Thursday (Deployment Day)
- [ ] Commit: `git add . && git commit -m "feat(phase-7): Week N posts"`
- [ ] Push: `git push origin main`
- [ ] Deploy to production: `vercel deploy --prod`
- [ ] Verify production deployment

### Each Friday (Post-Deployment)
- [ ] Check GSC for indexing (new URLs discovered)
- [ ] Monitor analytics for traffic
- [ ] Verify no crawl errors
- [ ] Record performance in analytics dashboard

## Monthly Review (1st of each month)

- [ ] **Performance Metrics**
  - [ ] GSC: % indexed (target 95%+)
  - [ ] Analytics: sessions from new posts
  - [ ] Rankings: keyword tracking for top 5 subjects
  - [ ] CTR: avg. click-through rate (target 4%+)

- [ ] **Content Quality**
  - [ ] Bounce rate analysis
  - [ ] Avg. time on page
  - [ ] Internal link click-through rate
  - [ ] Scroll depth (aim for 50%+)

- [ ] **Adjustments**
  - [ ] Update low-performing topics
  - [ ] Create pillar pages for high-traffic subjects
  - [ ] Add/expand FAQ sections based on search queries
  - [ ] Improve internal linking strategy

## Quarterly Review (Every 13 weeks)

- [ ] **Strategic Assessment**
  - [ ] Total posts published: target 52 (52 weeks ÷ 4 posts/week = 52 weeks on track)
  - [ ] Total indexed: target 49+ (95% of 52)
  - [ ] Organic traffic: baseline established
  - [ ] Ranking position: keywords tracked

- [ ] **Content Gap Analysis**
  - [ ] Top missing topics from GSC Search Queries
  - [ ] Competitor analysis: what they're ranking for
  - [ ] Internal search analysis (if available)
  - [ ] Create supplementary posts if gaps found

- [ ] **Calendar Adjustments**
  - [ ] Regenerate calendar with trending keywords
  - [ ] Adjust SEO priorities based on performance
  - [ ] Rebalance subject mix if needed
  - [ ] Update difficulty curve if learner feedback suggests change

## Success Metrics (End of 52 Weeks)

| Metric | Target | Achieved |
|--------|--------|----------|
| Posts Published | 208 | __ |
| Posts Indexed | 198+ (95%) | __ |
| New Organic Traffic | 2,000+ sessions/month | __ |
| Avg. Ranking | Top 20 for [Subject] | __ |
| Internal Links | 3-5 per post | __ |
| Engagement | 50%+ scroll depth | __ |

---

## Rollback Plan (If Needed)

If critical issues found:

1. **Immediate Rollback**
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push origin main
   vercel deploy --prod
   ```

2. **Issue Investigation**
   - Check build logs: `vercel logs`
   - Check analytics for anomalies
   - Review GSC for crawl errors

3. **Fix & Redeploy**
   - Identify and fix issue
   - Test locally: `npm run dev`
   - Redeploy: `npm run build && vercel deploy --prod`

---

**Status**: Ready for Week 1 Deployment
**Current Phase**: Phase 7 - Content Calendar (52-week plan)
**Next Review**: Weekly on Thursdays before deployment

