# ENEM Pro Blog Optimization Checklist

## Phase 1: Quick Wins (Target: +15-20 points average)

### 1. Image Optimization
- [ ] Install `sharp` for image processing
- [ ] Convert all PNG/JPG to WebP
- [ ] Add `width` and `height` attributes to all images
- [ ] Implement `loading="lazy"` for below-fold images
- [ ] Create image optimization script
  
**Expected Impact:** +8-12 points Performance, +5 points CLS

**Files to Update:**
- `app/blog/[slug]/page.tsx` - Add Next.js Image component
- `lib/blog-data.ts` - Add image metadata
- All blog post markdown files - Add image dimensions

### 2. Heading Hierarchy & Semantic HTML
- [ ] Ensure h1 only appears once (in metadata, not content)
- [ ] Fix h2/h3 hierarchy in markdown content
- [ ] Use semantic HTML tags (article, section, aside)

**Expected Impact:** +3-5 points Accessibility

**Files to Update:**
- `app/blog/[slug]/page.tsx` - Fix renderContent function

### 3. Missing Alt Text
- [ ] Audit all 6 images in blog posts
- [ ] Add descriptive alt text to 6 images

**Expected Impact:** +2-3 points Accessibility

**Status:**
- Total images: 6
- With alt text: 6 (100%) ✅

### 4. CSS Optimization
- [ ] Extract critical CSS for above-fold
- [ ] Defer non-critical styles
- [ ] Enable gzip compression (Vercel default ✅)
- [ ] Remove unused CSS (Tailwind purging ✅)

**Expected Impact:** +3-5 points Performance

**Files to Update:**
- `next.config.ts` - Add critical CSS extraction
- `app/globals.css` - Optimize imports

### 5. Defer Non-Critical JavaScript
- [ ] Add `defer` to script tags
- [ ] Implement dynamic imports for heavy components
- [ ] Move tracking scripts to load after interactive

**Expected Impact:** +2-3 points Performance

**Files to Update:**
- `app/layout.tsx` - Optimize script loading

---

## Phase 2: Medium Effort (Target: +10-15 points average)

### 1. Code Splitting for Long Posts
- [ ] Identify posts > 2000 words (8 posts)
- [ ] Implement section-based lazy loading
- [ ] Add skeleton loaders for sections

**Expected Impact:** +8-12 points Performance (LCP)

**Files to Create:**
- `components/LazyBlogSection.tsx`
- `hooks/useLazyLoad.ts`

**Posts to Update:**
1. questoes-matematica-enem-2021 (currently 68)
2. questoes-linguagens-enem-2021 (currently 71)
3. questoes-ciencias-natureza-enem-2020 (currently 72)
4. questoes-humanas-enem-2020 (currently 74)
5. cronograma-trabalhador-enem (currently 76)
6. questoes-de-matematica-enem (currently 78)
7. questoes-de-portugues-enem (currently 80)
8. questoes-de-historia-enem (currently 81)

### 2. Table Virtualization
- [ ] Identify tables with > 50 rows (6 posts affected)
- [ ] Install `react-window` for virtual scrolling
- [ ] Implement virtual table component

**Expected Impact:** +5-8 points Performance

**Files to Create:**
- `components/VirtualTable.tsx`

**Posts to Update:**
1. questoes-matematica-enem-2021
2. questoes-linguagens-enem-2021
3. questoes-ciencias-natureza-enem-2020
4. questoes-humanas-enem-2020
5. cronograma-trabalhador-enem
6. banco-de-questoes-enem-gratis

### 3. JSON-LD Structured Data
- [ ] Add Article schema to all posts
- [ ] Add BreadcrumbList schema
- [ ] Add Organization schema
- [ ] Add FAQSchema where applicable

**Expected Impact:** +2-3 points SEO

**Files to Update:**
- `app/blog/[slug]/page.tsx` - Add structured data

### 4. Performance Monitoring
- [ ] Add Web Vitals tracking
- [ ] Implement Lighthouse CI
- [ ] Create performance dashboard

**Expected Impact:** Ongoing monitoring

**Files to Create:**
- `lib/web-vitals.ts`
- `.lighthouse-ci.json`

---

## Phase 3: Advanced (Target: +5-10 points average)

### 1. Progressive Image Loading
- [ ] Implement blur-up effect for images
- [ ] Add LQIP (Low Quality Image Placeholder)
- [ ] Optimize image serving with srcset

**Expected Impact:** +3-5 points Performance, +2 points CLS

### 2. Service Worker Caching
- [ ] Implement SW for blog post caching
- [ ] Cache images with long expiry
- [ ] Implement stale-while-revalidate

**Expected Impact:** +2-3 points Performance

### 3. Bundle Analysis & Optimization
- [ ] Analyze bundle size
- [ ] Remove unused dependencies
- [ ] Implement route-based code splitting

**Expected Impact:** +2-5 points Performance

### 4. Accessibility Audit
- [ ] Full WCAG AA audit
- [ ] Color contrast fixes
- [ ] Keyboard navigation testing
- [ ] Screen reader testing

**Expected Impact:** +3-5 points Accessibility

---

## Posts Requiring Priority Attention

### Critical (Score < 75)
```
1. questoes-matematica-enem-2021      (68) → 85+ target
2. questoes-linguagens-enem-2021      (71) → 85+ target
3. questoes-ciencias-natureza-enem-20 (72) → 85+ target
4. questoes-humanas-enem-2020         (74) → 85+ target
5. cronograma-trabalhador-enem        (76) → 90+ target
```

### High Priority (Score 75-90)
```
6. questoes-de-matemática-enem        (78) → 90+ target
7. questoes-de-português-enem         (80) → 90+ target
8. questoes-de-historia-enem          (81) → 90+ target
9. simulado-enem-online-completo      (82) → 90+ target
10. banco-de-questoes-enem-gratis     (83) → 90+ target
11. cronograma-enem-3-meses           (84) → 90+ target
12. cronograma-enem-6-meses           (85) → 90+ target
13. enem-vs-vestibular-diferenca      (86) → 90+ target
14. como-estudar-para-enem-em-3-meses (87) → 90+ target
15. dicas-ultima-hora-enem            (88) → 90+ target
```

---

## Testing Strategy

### Before Optimization
```bash
# Run baseline Lighthouse on all 73 posts
./scripts/run-lighthouse-blog.sh https://enem-pro.vercel.app 73

# Generate baseline report
npm run lighthouse:report > baseline-report.json
```

### Phase 1 Testing
```bash
# After Phase 1, re-test critical posts
./scripts/run-lighthouse-blog.sh http://localhost:3000 5

# Expected: 5 critical posts should improve by 8-12 points
```

### Phase 2 Testing
```bash
# After Phase 2, re-test all below-90 posts
./scripts/run-lighthouse-blog.sh http://localhost:3000 15

# Expected: 15 posts should reach 90+
```

### Phase 3 Testing
```bash
# After Phase 3, full re-test
./scripts/run-lighthouse-blog.sh https://enem-pro.vercel.app 73

# Expected: All 73 posts achieve 90+
```

---

## Deployment Strategy

### 1. Feature Branch
```bash
git checkout -b feat/blog-lighthouse-optimization
```

### 2. Implement Phase 1
- Make code changes
- Test locally
- Commit changes
- Create PR

### 3. Staging Deployment
```bash
# Deploy to staging
vercel deploy --prod

# Run Lighthouse on staging
./scripts/run-lighthouse-blog.sh https://enem-pro-staging.vercel.app 73

# Verify improvements
```

### 4. Production Deployment
```bash
# Merge PR
git merge feat/blog-lighthouse-optimization

# Deploy to production
vercel deploy --prod

# Monitor production metrics
npm run lighthouse:monitor
```

### 5. Post-Deployment
```bash
# Run Lighthouse on production
./scripts/run-lighthouse-blog.sh https://enem-pro.vercel.app 73

# Generate final report
npm run lighthouse:report

# Document results
git commit -m "docs: Lighthouse optimization complete - all posts 90+"
```

---

## Success Metrics

| Metric | Baseline | Target | Status |
|--------|----------|--------|--------|
| Posts 90+ | 58/73 (79.5%) | 73/73 (100%) | 🎯 |
| Avg Score | 91.2 | 95.2 | 🎯 |
| Performance | 85 | 92 | 🎯 |
| Accessibility | 91 | 96 | 🎯 |
| Best Practices | 92 | 96 | 🎯 |
| SEO | 94 | 97 | 🎯 |

---

## Timeline

| Phase | Duration | Start | End | Status |
|-------|----------|-------|-----|--------|
| Phase 1 | 3-5 days | 2026-08-06 | 2026-08-10 | 📅 |
| Phase 2 | 5-7 days | 2026-08-11 | 2026-08-17 | 📅 |
| Phase 3 | 3-5 days | 2026-08-18 | 2026-08-22 | 📅 |
| **Total** | **11-17 days** | **2026-08-06** | **2026-08-22** | **📅** |

---

## Notes

- All changes maintain backward compatibility
- No database migrations required
- Can be implemented incrementally
- Each phase is deployable independently
- Performance gains are cumulative

---

## Dependencies to Install

```bash
npm install sharp react-window
npm install -D @lighthouse-ci/cli
```

## Scripts to Create

```bash
# Image optimization
npm run optimize:images

# Lighthouse testing
npm run lighthouse:test

# Report generation  
npm run lighthouse:report

# Monitoring
npm run lighthouse:monitor
```

---

**Last Updated:** 2026-08-06  
**Next Review:** 2026-08-13  
**Target Completion:** 2026-08-22
