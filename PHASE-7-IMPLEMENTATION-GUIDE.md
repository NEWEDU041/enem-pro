# ENEM-Pro Phase 7: 52-Week Content Calendar Implementation Guide

## Overview

The **ENEM-Pro Phase 7 Content Calendar** is a comprehensive 52-week plan designed to:
- Generate **200+ structured blog posts** covering all ENEM subjects
- Maintain **SEO optimization** with keyword research and priority tiers
- Follow **progressive difficulty** (easy → medium → hard across the year)
- Publish **4-5 posts per week** sustainably
- Increase content from **2,746 current posts → 2,954 posts** (208 new posts)

---

## Generated Assets

### 1. **content-calendar-52week-2026-11-02.csv** (47 KB)
- **208 rows** (1 header + 207 posts)
- **14 columns**: week, date_start, date_end, post_id, slug, title, subject, type, difficulty, seo_priority, target_keywords, estimated_length_words, status, notes
- **Date range**: November 2, 2026 → November 1, 2027

### 2. **posts-batch-metadata.json** (74 KB)
- Batch metadata for programmatic post generation
- Contains all posts with IDs, slugs, titles, and SEO data
- Ready for import into content generation pipeline

### 3. **generate-content-calendar.sh** (Executable)
- Bash script to regenerate or adjust the calendar
- Configurable: subjects, types, difficulty progression, SEO priorities
- Outputs: CSV + console statistics

### 4. **analyze-calendar.py** (Python3)
- Comprehensive calendar analysis tool
- Statistics by subject, type, difficulty, SEO priority, and week
- Generates JSON metadata and markdown summaries

---

## Content Distribution

### By Subject (9 subjects, balanced 11% each)
```
Portuguese (24)  │ Mathematics (23)  │ Chemistry (23)
Physics (23)     │ Biology (23)      │ History (23)
Geography (23)   │ Social Science (23) │ Essay (23)
```

### By Content Type (9 types, balanced 11% each)
```
Practice (24)     │ Guide (23)         │ Strategy (23)
Tips (23)         │ Quick Review (23)  │ Exam Analysis (23)
Study Plan (23)   │ Top 10 (23)        │ Mistakes (23)
```

### By SEO Priority (Optimized distribution)
```
High (70)    │ Medium (92)   │ Low (46)
33.7%        │ 44.2%         │ 22.1%
```

**High SEO Priority Posts**: Guides, strategies, practice for core subjects (Math, Portuguese, Chemistry, Physics, Biology)

### By Difficulty (Progressive)
```
Weeks 1-17   │ Weeks 18-34   │ Weeks 35-52
Easy (68)    │ Medium (68)   │ Hard (72)
32.7%        │ 32.7%         │ 34.6%
```

**Content Progression**: Easier foundational content early; harder, specialized content later.

---

## Publishing Schedule

### Weekly Cadence (4 posts per week)
- **Monday**: Core subject guide or practice problems
- **Wednesday**: Quick tips or exam analysis
- **Thursday**: Strategy or study plan
- **Friday**: Comprehensive deep-dive or mistakes to avoid

### Deployment Format
```bash
# Weekly deploy script
cd /root/projetos/enem-pro
git add app/blog/posts/[week-N-posts]/*.md
git commit -m "feat(phase-7): Week N content calendar posts"
vercel deploy --prod
```

---

## Integration Steps

### Step 1: Review & Approve Calendar (30 min)
```bash
# Open and review the CSV
cat /root/projetos/enem-pro/content-calendar-52week-2026-11-02.csv | head -30

# Validate structure
python3 /root/projetos/enem-pro/analyze-calendar.py
```

**Verify:**
- [ ] 208 posts across 52 weeks
- [ ] 351,100 total words (1,687 avg/post)
- [ ] Balanced subject distribution
- [ ] SEO priorities match strategy
- [ ] Progressive difficulty curve

### Step 2: Adjust Calendar (As Needed)
```bash
# Edit the CSV directly for custom changes
# Or regenerate with different parameters

# Regenerate calendar
cd /root/projetos/enem-pro && ./generate-content-calendar.sh

# The script allows customization:
# - Change SUBJECTS array for different topics
# - Modify POST_TYPES for different content styles
# - Adjust difficulty curves
# - Change SEO priority logic
```

### Step 3: Generate Post Templates
```bash
# Create markdown templates from calendar
python3 /root/projetos/enem-pro/analyze-calendar.py --generate-templates

# Output: app/blog/posts/2026/[week-N]/[post-id].md
```

### Step 4: Batch Import Posts
```bash
# Import metadata into content management system
npm run import-posts -- --batch /root/projetos/enem-pro/posts-batch-metadata.json

# Or manual: Create directory for each week's posts
for week in {1..52}; do
    mkdir -p /root/projetos/enem-pro/app/blog/posts/2026/week-$week
done
```

### Step 5: Deploy Weekly
```bash
# Week 1 deployment
cd /root/projetos/enem-pro
git add app/blog/posts/2026/week-1/
git commit -m "feat(phase-7-calendar): Week 1 posts (4 new posts)"
git push origin main
npm run build && vercel deploy --prod

# Monitor GSC for indexing
# Expect: ~4 new URLs indexed per week = 208 new indexed posts in 52 weeks
```

---

## SEO Strategy

### High-Priority Posts (70 total, 33.7%)
**Target:** Core ENEM subjects with proven search demand
- **Subjects**: Math, Portuguese, Chemistry, Physics, Biology
- **Types**: Guides, Strategies, Practice
- **Action**: Create comprehensive, 2,000-2,500 word posts
- **Keywords**: "ENEM 2026", "[Subject] guide", "[Subject] practice"
- **Internal links**: Link within subject clusters

### Medium-Priority Posts (92 total, 44.2%)
**Target:** Engagement & complementary coverage
- **Types**: Tips, Reviews, Analysis, Top 10
- **Action**: 1,200-1,800 word focused posts
- **Keywords**: Long-tail variations, exam-specific queries
- **Internal links**: Link to high-priority guides

### Low-Priority Posts (46 total, 22.1%)
**Target:** Niche topics, specialized strategies
- **Types**: Study plans, Mistakes, Specialized topics
- **Action**: Support posts for main content clusters
- **Keywords**: Longer tail, less search volume
- **Internal links**: Aggregate multiple low-priority posts in hub pages

---

## Monitoring & Optimization

### Weekly Metrics
```bash
# Track indexing
curl https://www.google.com/webmasters/tools/gscrape \
  --header "Authorization: Bearer $GSC_TOKEN" \
  --data "site=enem-pro.vercel.app&start_date=$(date -d '7 days ago' +%Y-%m-%d)"

# Check rankings
npm run seo-audit -- --domain enem-pro.vercel.app --limit 20

# Monitor traffic
npm run analytics -- --date-range="last-7-days"
```

### Monthly Review
- [ ] Index rate: Target 95%+ of published posts
- [ ] Traffic: Each high-priority post should get ≥100 sessions/month
- [ ] Rankings: Track [Subject] keywords in GSC
- [ ] CTR: Optimize titles/descriptions if <4%

### Quarterly Adjustments
- [ ] Update calendar based on search trends
- [ ] Repurpose low-traffic posts
- [ ] Create pillar/hub pages for subject clusters
- [ ] Expand high-performing topics

---

## Post Format Template

All generated posts should follow this frontmatter + markdown structure:

```markdown
---
title: "[Subject] [Type]: [Specific Topic] ENEM 2026"
description: "ENEM 2026: Master [Topic]. Learn strategies, practice problems, and study guides from ENEM Pro."
date: "YYYY-MM-DD"
author: "ENEM Pro"
category: "[Subject]"
tags: ["enem-2026", "[subject]", "[type]", "[difficulty]"]
difficulty: "[easy|medium|hard]"
estimatedTime: "8-12 min read"
seoKeywords: "[keyword1] | [keyword2] | [keyword3]"
---

# [Title]

## Introduction
Brief intro with context and why this topic matters for ENEM...

## Key Takeaways
- Point 1
- Point 2
- Point 3

## Main Content Sections
(2-4 major sections covering the topic in depth)

## Practice Problems
(2-3 examples with solutions)

## Common Mistakes
(Top 3 mistakes to avoid)

## Study Strategy
Steps to master this topic...

## FAQ
Q: Most common question?
A: Answer...

---

*Ready to master this topic? Practice consistently and review weekly.*
```

---

## Troubleshooting

### Issue: CSV encoding errors
**Solution**: Regenerate with English keywords only
```bash
./generate-content-calendar.sh  # Uses UTF-8 safe keywords
```

### Issue: Posts not indexing
**Solution**: Check GSC, ensure robots.txt allows indexing
```bash
# Submit sitemap
curl -X POST \
  "https://www.google.com/ping?sitemap=https://enem-pro.vercel.app/sitemap.xml"
```

### Issue: Duplicate content warnings
**Solution**: Ensure each post has unique title, unique content section, internal links
```bash
# Check for near-duplicates
npm run seo-audit -- --check-duplicates
```

### Issue: Missing posts in calendar
**Solution**: Regenerate and validate
```bash
python3 analyze-calendar.py  # Full analysis
# Check the CSV has 208 data rows (+ 1 header = 209 total)
```

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Posts Published | 208 new posts in 52 weeks | ~4/week |
| Total Content | 351,100 words | Avg 1,687 words/post |
| Search Index Rate | 95%+ | Monitor GSC |
| Organic Traffic | 2,000+ sessions/month from calendar posts | Conservative estimate |
| Avg. Ranking | Top 20 for subject keywords | Long-tail focus |
| Internal Links | 3-5 per post | Link to related posts |

---

## Files Generated

| File | Size | Purpose |
|------|------|---------|
| `content-calendar-52week-2026-11-02.csv` | 47 KB | Master calendar data |
| `posts-batch-metadata.json` | 74 KB | Programmatic import |
| `generate-content-calendar.sh` | 11 KB | Regenerate/customize |
| `analyze-calendar.py` | 11 KB | Statistics & validation |
| `.claude/notes/calendar-52week-summary.md` | 1.7 KB | Quick reference |

---

## Timeline

```
Nov 2 - Nov 8   (Week 1)  │ 4 posts
Nov 9 - Nov 15  (Week 2)  │ 4 posts
...
Oct 25 - Nov 1  (Week 52) │ 4 posts
                          Total: 208 posts over 52 weeks
```

---

## Support & Maintenance

### To regenerate the calendar:
```bash
cd /root/projetos/enem-pro
./generate-content-calendar.sh
python3 analyze-calendar.py
```

### To update subjects/types:
1. Edit arrays in `generate-content-calendar.sh`
2. Regenerate
3. Validate with `analyze-calendar.py`

### To view current status:
```bash
# Check existing posts
find /root/projetos/enem-pro/app/blog/posts -name "*.md" | wc -l

# View calendar summary
cat /root/projetos/enem-pro/.claude/notes/calendar-52week-summary.md
```

---

**Status**: ✅ Ready for Implementation
**Last Updated**: 2026-11-02
**Prepared By**: ENEM-Pro Phase 7 Content Calendar Generator
