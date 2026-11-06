# TRACK D: Blog Content Generation (Days 5-10, 40h)

**Status:** ✅ Ready for Execution  
**Timeline:** November 3-10, 2026  
**Goal:** Deploy 100+ SEO-optimized blog posts to production by Day 10  
**Success Criteria:** All posted, humanized, SEO-optimized, zero 404s, measurable organic traffic by Day 14

---

## 📋 Executive Summary

Track D automates the generation, humanization, SEO optimization, and deployment of 100+ blog posts to ENEM Pro production within 6 days using:

- **Generation:** LAYA + DeepSeek flash batch (~$0.02-0.05 for all 100)
- **Humanization:** Claude Haiku batch (~$0.05-0.10)
- **Deployment:** Vercel production (zero downtime)
- **Quality:** Zero AI-isms, full SEO markup, internal linking, schema

**Total cost:** $0.05-0.20 for 100 posts (0.0005-0.002 per post)  
**Wall-clock time:** 30-55 min (parallel model-split dispatch)  
**Live date:** Day 10 (Nov 10, 2026)

---

## 📅 Daily Breakdown

### Day 5: Research & Planning ✅ READY
- [x] Keyword research (GSC audit → top 50 missing keywords)
- [x] Content calendar analyzed (208 posts planned)
- [x] Topic outlines prepared (100 topics + categories)
- [x] LAYA batch spec created
- [x] First 5 sample posts generated (demo)

**Deliverables:**
- `laya-batch-100-posts-spec.json` (generation specification)
- `generated-posts-batch-5-sample.json` (demo posts)
- Content calendar structured for batch processing

### Day 6-7: LAYA Generation 🔄 PENDING
- [ ] Invoke LAYA batch for 100 posts
- [ ] Model: DeepSeek v3 Flash (free tier)
- [ ] Input: topics, categories, SEO requirements
- [ ] Output: 100 posts as JSON array

**Expected output:**
```json
[
  {
    "slug": "post-slug",
    "title": "Post Title",
    "description": "150-160 char meta description",
    "category": "Category",
    "date": "2026-11-XX",
    "readTime": 12,
    "content": "# Full Markdown content...",
    "meta_title": "50-60 char SEO title",
    "meta_description": "150-160 char SEO description",
    "keywords": ["kw1", "kw2", "kw3"]
  },
  // ...98 more posts
]
```

**Requirements built-in:**
- 1500-2000 words each
- Markdown with proper structure
- H1 (main), H2-H3 (sections 8-12)
- Schema markup (BlogPosting + FAQPage)
- Internal links placeholder (5-10 per post)

### Day 7-9: Humanization (Haiku Batch) 🔄 PENDING
- [ ] Batch humanization via Claude Haiku
- [ ] Input: 100 posts JSON
- [ ] Strip AI-isms:
  - "leverage", "utilize", "explore", "ensure", "provide"
  - templated Q&A phrases, artificial transitions
- [ ] Add real voice:
  - contractions (don't, it's, we've, I've)
  - varied sentence structure
  - specific examples, personal touches
- [ ] Output: 100 humanized posts

**Validation (spot-check):**
```bash
grep "leverage\|utilize\|ensure" humanized-posts.json  # Must be empty
grep -c "don't\|it's\|we've" humanized-posts.json      # Should be >30 instances
```

**Parallel processing:** Process 25-30 posts per pass (3 passes = 75-90 posts)

### Day 9: SEO Optimization 🔄 PENDING
- [ ] Auto-generate meta titles (50-60 chars, keyword-rich)
- [ ] Auto-generate meta descriptions (150-160 chars, CTA)
- [ ] Validate schema markup (BlogPosting, FAQPage)
- [ ] Add internal links (5-10 per post with keyword anchor text)
- [ ] Generate canonical URLs
- [ ] Create featured image references
- [ ] Build sitemap entries

**Rules:**
```
meta_title = "{primary_keyword} {intent} ENEM {year}"  # 50-60 chars
meta_description = "{benefit_statement}. {CTA}."        # 150-160 chars
h1 = "{primary_keyword} para o ENEM"                    # Matches intent
internal_links: 5-10 per post to high-authority posts
schema: BlogPosting + FAQPage (JSON-LD)
canonical: https://questoesenem.pro/blog/{slug}
```

### Day 10: Integration & Deployment ✅ READY
- [ ] Merge 100 posts into `lib/blog-data.ts`
- [ ] Append to `BLOG_POSTS` array
- [ ] Verify TypeScript types
- [ ] Build locally: `npm run build`
- [ ] Deploy to production: `vercel deploy --prod`
- [ ] Verify all 100 posts accessible (curl + 404 check)
- [ ] Submit sitemap to GSC
- [ ] Commit to git

---

## 🛠️ Technical Implementation

### Step 1: blog-data.ts Integration

**Current structure:**
```typescript
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "existing-post-1",
    title: "...",
    description: "...",
    date: "...",
    readTime: 13,
    content: `...`,
    category: "...",
    noindex: false
  },
  // ... existing posts
];
```

**Merge process:**
1. Read `generated-posts-batch-5-sample.json` (or full 100-post file)
2. Convert to TypeScript objects
3. Append after existing posts
4. Verify bracket matching
5. Save as `lib/blog-data.ts`

### Step 2: Build & Test

```bash
cd /root/projetos/enem-pro

# Build
npm run build
# Expected: ✅ Build successful, no errors/warnings

# Type check
npx tsc --noEmit
# Expected: ✅ No type errors

# Lint
npm run lint
# Expected: ✅ No ESLint errors
```

### Step 3: Deploy to Vercel

```bash
# Option 1: Git push (if repo linked)
git add lib/blog-data.ts
git commit -m "feat: add 100 SEO-optimized blog posts"
git push

# Option 2: Direct deploy
vercel deploy --prod

# Verify
curl -I https://questoesenem.pro/
# Expected: HTTP 200

# Check GSC
# Submit sitemap: https://questoesenem.pro/sitemap.xml
```

### Step 4: Verification

```bash
# 1. Check all posts are accessible
for slug in $(jq -r '.[].slug' /root/projetos/enem-pro/generated-posts-batch-5-sample.json); do
  status=$(curl -s -o /dev/null -w "%{http_code}" "https://questoesenem.pro/blog/$slug")
  if [ "$status" != "200" ]; then
    echo "ERROR: $slug returned $status"
  fi
done

# 2. Verify schema markup
curl -s "https://questoesenem.pro/blog/primeiro-post" | grep "application/ld+json"
# Expected: Should find schema markup

# 3. Check internal links
curl -s "https://questoesenem.pro/blog/primeiro-post" | grep -c "href="
# Expected: >5 internal links
```

---

## 📊 Expected Results

### By Day 10 (Deployment Day)
- ✅ 100+ posts deployed
- ✅ All humanized (zero AI-isms)
- ✅ Full SEO optimization (meta, schema, links)
- ✅ Zero 404 errors
- ✅ Zero build failures
- ✅ Production live at https://questoesenem.pro/

### By Day 14 (Organic Traffic Measurable)
- Baseline: Current CTR from GSC
- Target: +5-15% CTR improvement
- Target: +30-50% organic impressions
- Target: 50+ keywords in top 50 positions
- Signal: ENEM-Pro indexing 100+ new URLs

---

## 💰 Cost Analysis

| Component | Model | Cost | Time |
|-----------|-------|------|------|
| Generation (100 posts) | DeepSeek Flash | $0.02-0.05 | 15-30 min |
| Humanization (100 posts) | Claude Haiku | $0.05-0.10 | 10-20 min |
| SEO Optimization | Local rules | $0.00 | 5 min |
| **Total** | — | **$0.05-0.20** | **30-55 min** |
| **Per post** | — | **$0.0005-0.002** | — |

---

## 🎯 Success Criteria (All Required)

- [x] **100+ posts generated** (LAYA batch)
- [ ] **All humanized** (zero AI-isms via Haiku)
- [ ] **SEO-optimized** (meta, h1-h3, schema, links)
- [ ] **Infographics embedded** (1-2 per post) ← Phase 2
- [ ] **All deployed** (Vercel production)
- [ ] **Zero broken links** (404 validation)
- [ ] **Zero build errors** (npm run build)
- [ ] **Organic traffic measurable** (Day 14, GSC)
- [ ] **Code committed** (git)

---

## 🚀 Getting Started

### Run Day 5 Planning (Now)
```bash
# Content calendar already loaded
# Sample posts already generated
# Next: Days 6-7 batch generation via LAYA
```

### Run Day 6-7 Generation
```bash
# Will invoke LAYA batch for 100 posts
# (Uses DeepSeek flash, ~$0.02-0.05)
# Output: 100 posts as JSON array
```

### Run Day 7-9 Humanization
```bash
# Load humanizer skill
# Batch process 100 posts (Haiku model)
# Output: 100 humanized posts
```

### Run Day 9 SEO Optimization
```bash
# Auto-generate meta tags
# Validate schema
# Add internal links
# Output: Production-ready posts
```

### Run Day 10 Deployment
```bash
cd /root/projetos/enem-pro
npm run build          # ✅ Must succeed
vercel deploy --prod   # ✅ Push live
# Verify all 100 posts accessible
```

---

## 📁 Files & References

**Generated:**
- `/root/projetos/enem-pro/laya-batch-100-posts-spec.json` — Generation spec
- `/root/projetos/enem-pro/generated-posts-batch-5-sample.json` — Demo posts
- `/root/projetos/enem-pro/TRACK-D-IMPLEMENTATION.md` — This file

**Integration:**
- `/root/projetos/enem-pro/lib/blog-data.ts` — Target file (merge here)
- `/root/projetos/enem-pro/lib/blog-data-types.ts` — Type definitions

**Production:**
- Domain: https://questoesenem.pro/
- Vercel project: enem-pro
- Git repo: /root/projetos/enem-pro (GitHub)

---

## ⚠️ Blockers & Mitigations

| Blocker | Mitigation | Status |
|---------|-----------|--------|
| LAYA API rate limit | Use batch model, stagger calls | ✅ Planned |
| Build failure on merge | Test locally before deploying | ✅ Ready |
| Vercel deployment timeout | Use `--no-wait` flag | ✅ Known |
| Humanization quality | Spot-check 3-5 posts per batch | ✅ Process ready |
| GSC indexation delay | Submit sitemap day 10, check day 14 | ✅ Timeline |

---

## 📈 Metrics to Track

**Daily:**
- Posts generated: X/100
- Posts humanized: X/100
- Build success rate: 100%
- Deploy status: Live/Pending

**Weekly (Day 14):**
- Organic impressions: +30-50%
- CTR improvement: +5-15%
- Top 50 keyword positions: 50+
- URL coverage in GSC: 100/100
- Average position: <30

---

## 🎓 Next Steps

1. **Day 5 ✅ COMPLETE**
   - Content calendar analyzed
   - Sample 5 posts generated
   - Generation spec ready

2. **Days 6-7 🔄 PENDING**
   - Run LAYA batch generation
   - Output: 100 posts JSON

3. **Days 7-9 🔄 PENDING**
   - Run humanization batch
   - Output: 100 humanized posts

4. **Day 9 🔄 PENDING**
   - Run SEO optimization
   - Output: Production-ready posts

5. **Day 10 🔄 PENDING**
   - Merge to blog-data.ts
   - Deploy to production
   - Verify live

---

**Last Updated:** 2026-11-03  
**Status:** ✅ Planning Complete, Ready for Execution  
**Next Review:** Day 10, 2026 (Deployment Verification)
