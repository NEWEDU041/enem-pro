# ENEM-Pro: GSC Monitoring & Weekly SEO Optimizer Setup

> Phase 6: Automated monitoring for 20+ ENEM keywords with weekly optimization

## Overview

This setup provides two complementary monitoring scripts for **ENEM-Pro**:

1. **gsc-monitoring.sh** - Tracks Google Search Console metrics, keyword rankings, indexation
2. **weekly-seo-optimizer.sh** - Audits blog posts for SEO best practices weekly

Both follow the proven pattern from **Clube-da-Escolha** but are tailored for ENEM-specific keywords and educational content.

---

## Quick Start

### 1. Run GSC Monitoring Setup

```bash
cd /root/projetos/enem-pro
bash scripts/gsc-monitoring.sh
```

**Output**: Creates 7 files in `monitoring/gsc-reports/`:
- `week-43-tracking.csv` - Weekly baseline metrics
- `keyword-rankings-20261102_200046.csv` - 20 target ENEM keywords
- `content-performance-20261102_200046.csv` - Post performance tracking
- `backlink-tracking-20261102_200046.csv` - Backlink opportunities
- `weekly-report-template.md` - Report template
- `alert-thresholds.json` - Alert triggers
- `weekly-optimization-checklist.md` - Weekly tasks

### 2. Run Weekly SEO Optimizer

```bash
cd /root/projetos/enem-pro
bash scripts/weekly-seo-optimizer.sh
```

**Output**: 
- Scans all blog posts for SEO compliance
- Generates `logs/seo-optimization-20261102.log`
- Reports on: meta descriptions, internal links, ENEM keywords, content length

### 3. Schedule as Cron Job (Every Monday 9 AM)

```bash
# Add to crontab
crontab -e

# Add this line:
0 9 * * MON cd /root/projetos/enem-pro && bash scripts/gsc-monitoring.sh && bash scripts/weekly-seo-optimizer.sh
```

---

## Target Keywords (20+ Tracked)

### Priority 1 (Immediate Focus)

| Keyword | Volume | Position | Target | Category |
|---------|--------|----------|--------|----------|
| questões ENEM 2026 | 3200 | 35 | 5 | Featured |
| simulado ENEM | 2100 | 42 | 8 | Featured |
| provas anteriores ENEM | 1800 | 38 | 6 | Featured |
| dicas ENEM | 1600 | 45 | 10 | Featured |
| como estudar ENEM | 2400 | 48 | 12 | Guide |
| resultado ENEM 2026 | 1500 | 28 | 5 | Seasonal |
| ENEM 2026 cronograma | 1200 | 18 | 3 | Seasonal |

### Priority 2 (Secondary Focus)

| Keyword | Volume | Position | Target | Category |
|---------|--------|----------|--------|----------|
| gabarito ENEM | 2800 | 52 | 15 | Reference |
| redação ENEM | 1900 | 40 | 8 | Content |
| nota ENEM | 1400 | 55 | 20 | Reference |
| inscrição ENEM | 980 | 32 | 6 | Seasonal |
| SISU ProUni ENEM | 1100 | 38 | 8 | Career |
| estudo ENEM método | 850 | 62 | 25 | Guide |
| revisão ENEM | 1000 | 45 | 12 | Guide |
| matemática ENEM | 1300 | 68 | 30 | Subject |

### Seasonal/Evergreen

| Keyword | Volume | Position | Target | Category |
|---------|--------|----------|--------|----------|
| português ENEM | 1100 | 65 | 28 | Subject |
| história ENEM | 980 | 72 | 35 | Subject |
| geografia ENEM | 920 | 70 | 32 | Subject |
| biologia ENEM | 1050 | 66 | 31 | Subject |

---

## Files Created & Their Purpose

### Monitoring Directory Structure

```
monitoring/gsc-reports/
├── week-43-tracking.csv              # Weekly baseline metrics
├── keyword-rankings-20261102.csv     # Keyword position tracking
├── content-performance-20261102.csv  # Blog post performance
├── backlink-tracking-20261102.csv    # Backlink opportunities
├── weekly-report-template.md         # For manual reporting
├── alert-thresholds.json             # Alert rules
└── weekly-optimization-checklist.md  # Weekly tasks
```

### CSV Format Examples

#### week-X-tracking.csv
Baseline metrics for each week:
```
date,metric,value,target,status,notes
2026-11-02,URLs Indexed,412,450,ongoing,430+ posts live
2026-11-02,Avg Position,28,12,ongoing,Baseline measurement
2026-11-02,Impressions,2400,8000,ongoing,Baseline week
```

#### keyword-rankings-20261102.csv
Position tracking for 20+ keywords:
```
keyword,search_volume,current_position,current_ctr,target_position,target_month,category,priority
questões ENEM 2026,3200,35,2.1%,5,month-3,featured,p1
simulado ENEM,2100,42,1.8%,8,month-3,featured,p1
```

#### content-performance-20261102.csv
Post-level metrics:
```
post_title,publish_date,views,clicks,avg_ctr,estimated_revenue,status,next_action
Questões ENEM 2026 com Respostas,2026-10-15,245,28,11.4%,R$42.00,live,Monitor performance
```

---

## Weekly Checklist Integration

The `weekly-optimization-checklist.md` provides a structured plan:

### Every Monday (15 min - GSC Check)

- [ ] **GSC Check** (5 min)
  - Check Coverage for crawl errors
  - Check Performance for position changes
  - Check Mobile Usability
  - Update week-[X]-tracking.csv

- [ ] **Keyword Monitoring** (5 min)
  - Search top 5 keywords on Google
  - Record positions
  - Update keyword-rankings.csv

- [ ] **Backlink Monitoring** (5 min)
  - Check Google Alerts
  - Search competitor backlinks
  - Send 3-5 guest post pitches

### Weekly (Continuous)

- [ ] **Content Updates**
  - Add 1 new ENEM post (800+ words)
  - Update 2-3 old posts with fresh data
  - Add 5+ internal links

- [ ] **Backlink Outreach**
  - Send 3-5 guest post pitches
  - Answer 10+ Quora questions
  - Post on Reddit (r/ENEM, r/college)

- [ ] **Meta Tag Optimization**
  - Review titles for top 10 posts
  - Update meta descriptions (120-160 chars)
  - Add power words to headlines

### Monthly (1st of Month)

- [ ] **Comprehensive Audit**
  - Check 404 errors
  - Analyze crawl stats
  - Review top 30 pages
  - Analyze mobile vs desktop CTR

- [ ] **Content Audit**
  - Identify posts with 0 clicks
  - Refresh top 5 posts
  - Optimize for new long-tail keywords

---

## Alert Thresholds

The `alert-thresholds.json` defines automated alerts:

### Indexing Alerts

```json
{
  "critical_drop": {
    "threshold": "10+ URLs removed from index",
    "action": "Email alert + immediate investigation"
  },
  "slow_crawl": {
    "threshold": "<5 URLs indexed per week",
    "action": "Resubmit sitemap + check robots.txt"
  }
}
```

### Ranking Alerts

```json
{
  "major_drop": {
    "threshold": ">10 positions down on priority keywords",
    "action": "Email alert + content review"
  },
  "breakthrough": {
    "threshold": "<10 position on ANY target keyword",
    "action": "Track closely + optimize + promote"
  }
}
```

### Traffic Alerts

```json
{
  "spike": {
    "threshold": "+300% weekly traffic",
    "action": "Investigate source + capitalize"
  },
  "drop": {
    "threshold": "-30% weekly traffic",
    "action": "Check for ranking drops + issues"
  }
}
```

---

## Optimization Script: What It Checks

The `weekly-seo-optimizer.sh` scans all blog posts for:

### 1. Meta Descriptions ✓
- ✅ Present
- ✅ 120-160 characters
- ✅ Includes keyword
- ⚠️ If missing or wrong length

### 2. Internal Links ✓
- ✅ 3+ links per post minimum
- ⚠️ Flags if <3 links
- Tracks total internal linking ratio

### 3. ENEM Keywords ✓
- ✅ Searches for ENEM, questão, prova, simulado, gabarito
- ⚠️ Flags if no ENEM keywords found
- Reports keyword density

### 4. Content Length ✓
- ✅ Target: 600+ words
- ⚠️ Flag: <300 words (thin content)
- ⚠️ Flag: 300-600 words (medium content)

### 5. Affiliate/Partnership Links ✓
- ✅ Links to study resources
- ✅ Amazon, Hotmart, Udemy, Coursera
- ⚠️ Flags if no external links

### 6. Title Optimization ✓
- ✅ Includes ENEM keywords
- ✅ Power words present
- ⚠️ Flags if keyword missing from title

---

## Expected Results (90 Days)

### Baseline (Today)
- URLs Indexed: **412**
- Avg Position: **28**
- Monthly Impressions: **2,400**
- Monthly Clicks: **145**
- CTR: **6%**

### Target (90 Days)
- URLs Indexed: **450** (+9%)
- Avg Position: **12** (-57%)
- Monthly Impressions: **8,000** (+233%)
- Monthly Clicks: **600** (+314%)
- CTR: **7.5%** (+25%)

### Milestones

| Month | Metric | Target |
|-------|--------|--------|
| **Month 1** | Position #1-5 on 3+ keywords | 3 |
| **Month 2** | Position #1-10 on 10+ keywords | 10 |
| **Month 3** | Position #1-20 on 15+ keywords | 15 |

---

## Integration with Clube-da-Escolha Pattern

This setup follows the same architecture as Clube-da-Escolha but adapts for ENEM content:

### Similarities
✓ Weekly monitoring templates
✓ CSV-based tracking
✓ Alert thresholds JSON
✓ Optimization checklist
✓ Git auto-commit support

### Differences
✓ 20 ENEM-specific keywords
✓ Educational content focus
✓ Seasonal tracking (ENEM dates, results)
✓ Stronger emphasis on question-based content
✓ Student audience optimization

---

## How to Use Each Script

### gsc-monitoring.sh

**When to run**: Once per week (Monday morning)
**Time to run**: < 1 minute
**What it does**:
1. Creates baseline metrics CSV
2. Initializes 20 keyword tracker
3. Sets up content performance tracker
4. Creates alert definitions
5. Generates weekly checklist

**Manual next steps**:
1. Open Google Search Console
2. Record current metrics in CSVs
3. Follow weekly checklist tasks
4. Update files with real data

### weekly-seo-optimizer.sh

**When to run**: Every Monday after gsc-monitoring.sh
**Time to run**: < 1 minute
**What it does**:
1. Scans all blog posts
2. Checks meta descriptions
3. Validates internal linking
4. Verifies ENEM keyword presence
5. Checks content length
6. Reports statistics
7. Creates optimization log

**Output**: `logs/seo-optimization-YYYYMMDD.log`

---

## Automation Setup

### Option 1: Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add (runs every Monday 9 AM)
0 9 * * MON cd /root/projetos/enem-pro && bash scripts/gsc-monitoring.sh >> logs/cron.log 2>&1 && bash scripts/weekly-seo-optimizer.sh >> logs/cron.log 2>&1
```

### Option 2: GitHub Actions

Create `.github/workflows/weekly-seo-check.yml`:

```yaml
name: Weekly SEO Monitoring

on:
  schedule:
    - cron: '0 9 * * MON'  # Monday 9 AM UTC

jobs:
  seo-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run GSC Monitoring
        run: bash scripts/gsc-monitoring.sh
      - name: Run SEO Optimizer
        run: bash scripts/weekly-seo-optimizer.sh
      - name: Commit results
        run: |
          git add monitoring/ logs/
          git commit -m "chore(seo): weekly monitoring [automated]" || true
          git push
```

### Option 3: Manual Hermes Scheduling

```bash
hermes schedule --name "ENEM SEO Check" --cron "0 9 * * MON" --task "cd /root/projetos/enem-pro && bash scripts/gsc-monitoring.sh && bash scripts/weekly-seo-optimizer.sh"
```

---

## File Locations

```
/root/projetos/enem-pro/
├── scripts/
│   ├── gsc-monitoring.sh              # Main monitoring script
│   └── weekly-seo-optimizer.sh        # Post optimization script
├── monitoring/
│   └── gsc-reports/                   # Generated reports
│       ├── week-43-tracking.csv
│       ├── keyword-rankings-*.csv
│       ├── content-performance-*.csv
│       ├── backlink-tracking-*.csv
│       ├── weekly-report-template.md
│       ├── alert-thresholds.json
│       └── weekly-optimization-checklist.md
└── logs/
    └── seo-optimization-*.log         # Optimization reports
```

---

## Next Steps

1. **This Week**:
   - [ ] Run both scripts
   - [ ] Review generated files
   - [ ] Submit sitemap to GSC
   - [ ] Enable email alerts

2. **Next Week**:
   - [ ] Manually populate real GSC data
   - [ ] Follow weekly checklist
   - [ ] Create first report
   - [ ] Set up cron scheduling

3. **Ongoing**:
   - [ ] Every Monday: Run scripts + checklist
   - [ ] Update CSVs with real data
   - [ ] Monitor alerts
   - [ ] Adjust targets based on performance

---

## Troubleshooting

### Scripts not executable?
```bash
chmod +x scripts/gsc-monitoring.sh scripts/weekly-seo-optimizer.sh
```

### Blog directory not found?
- Edit `weekly-seo-optimizer.sh`
- Change `BLOG_DIR="src/pages/blog"` to actual path
- Run `find /root/projetos/enem-pro -name "*.md" -type f | head -5` to find blog posts

### Git errors?
- Ensure `.git` directory exists
- Or remove git integration from scripts

---

## Success Metrics

**Week 1**: ✅ Files created, baselines captured
**Week 2**: ✅ Real GSC data populated, alerts working
**Week 4**: ✅ First position improvements visible
**Week 8**: ✅ 20%+ traffic increase
**Week 12**: ✅ Multiple keywords in top 10

---

## References

- Similar setup: `/root/projetos/clube-da-escolha/scripts/`
- GSC guide: https://support.google.com/webmasters/
- ENEM keyword data: `KEYWORD-GAP-ANALYSIS.json`
- Target keywords: `scripts/keywords-batch-1.json`

---

**Created**: 2026-11-02
**Last Updated**: 2026-11-02
**Status**: ✅ Ready to deploy
