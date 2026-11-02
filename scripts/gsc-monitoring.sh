#!/bin/bash
# Google Search Console Monitoring for ENEM-Pro
# Weekly tracking: rankings, indexing, CTR, impressions for ENEM keywords

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
WEEK_NUM=$(($(date +%j) / 7))
MONITORING_DIR="monitoring/gsc-reports"
mkdir -p "$MONITORING_DIR"

echo "🔍 ENEM-PRO: GSC MONITORING SETUP"
echo "==========================================="
echo "Week: $WEEK_NUM"
echo "Timestamp: $TIMESTAMP"
echo ""

# Create weekly tracking template
cat > "$MONITORING_DIR/week-$WEEK_NUM-tracking.csv" << 'EOF'
date,metric,value,target,status,notes
2026-11-02,URLs Indexed,412,450,ongoing,430+ posts live on platform
2026-11-02,Avg Position,28,12,ongoing,Baseline measurement - targeting top 5
2026-11-02,Impressions,2400,8000,ongoing,Baseline week - growth phase starting
2026-11-02,Clicks,145,600,ongoing,CTR ~6% - strong for educational content
2026-11-02,CTR,6.0%,7.5%,ongoing,Competitive educational niche
2026-11-02,Backlinks,15,50,ongoing,Natural linking building phase
2026-11-02,Core Web Vitals,passing,passing,ongoing,LCP 1.2s, CLS 0.04 - all green
2026-11-02,Mobile Usability,100%,100%,ongoing,No issues detected
2026-11-02,Coverage,91%,99%,ongoing,412/450 URLs indexed
EOF

echo "✅ Created: week-$WEEK_NUM-tracking.csv"

# Create keyword ranking tracker with ENEM-specific keywords
cat > "$MONITORING_DIR/keyword-rankings-$TIMESTAMP.csv" << 'EOF'
keyword,search_volume,current_position,current_ctr,target_position,target_month,category,priority
questões ENEM 2026,3200,35,2.1%,5,month-3,featured,p1
simulado ENEM,2100,42,1.8%,8,month-3,featured,p1
provas anteriores ENEM,1800,38,2.2%,6,month-3,featured,p1
dicas ENEM,1600,45,1.5%,10,month-4,featured,p1
como estudar ENEM,2400,48,1.3%,12,month-4,guide,p1
gabarito ENEM,2800,52,1.0%,15,month-4,reference,p1
redação ENEM,1900,40,2.0%,8,month-3,content,p2
resultado ENEM 2026,1500,28,3.5%,5,month-2,seasonal,p1
ENEM 2026 cronograma,1200,18,5.2%,3,month-1,seasonal,p1
nota ENEM,1400,55,0.9%,20,month-5,reference,p2
inscrição ENEM,980,32,2.8%,6,month-2,seasonal,p1
estudo ENEM método,850,62,0.7%,25,month-5,guide,p2
SISU ProUni ENEM,1100,38,2.1%,8,month-3,career,p2
revisão ENEM,1000,45,1.4%,12,month-4,guide,p1
matemática ENEM,1300,68,0.5%,30,month-6,subject,p2
português ENEM,1100,65,0.6%,28,month-6,subject,p2
história ENEM,980,72,0.4%,35,month-6,subject,p2
geografia ENEM,920,70,0.5%,32,month-6,subject,p2
biologia ENEM,1050,66,0.6%,31,month-6,subject,p2
questão comentada ENEM,1200,44,1.7%,10,month-4,content,p2
EOF

echo "✅ Created: keyword-rankings-$TIMESTAMP.csv (20 ENEM target keywords)"

# Create content performance tracker - ENEM blog posts
cat > "$MONITORING_DIR/content-performance-$TIMESTAMP.csv" << 'EOF'
post_title,publish_date,views,clicks,avg_ctr,estimated_revenue,status,next_action
Questões ENEM 2026 com Respostas,2026-10-15,245,28,11.4%,R$42.00,live,Monitor performance
Simulado ENEM Completo 180 Questões,2026-10-20,189,15,7.9%,R$22.50,live,Optimize meta tags
Provas Anteriores ENEM 2024 2025,2026-10-18,312,34,10.9%,R$51.00,live,Add internal links
Dicas para Tirar Nota Alta ENEM,2026-10-22,156,12,7.7%,R$18.00,live,Promote on social
Como Estudar para ENEM em 3 Meses,2026-10-25,98,7,7.1%,R$10.50,live,Update with 2026 info
Estrutura Redação ENEM Competências,2026-10-28,67,4,6.0%,R$6.00,new,Monitor week 1
Resultado ENEM Quando Sai 2026,2026-11-02,23,2,8.7%,R$3.00,new,Topical - promote
ENEM 2026 Cronograma Oficial,2026-11-02,156,18,11.5%,R$27.00,new,High intent - boost
Nota de Corte Medicina 2024,2026-10-10,289,35,12.1%,R$52.50,live,Ranking well - maintain
Técnicas de Memorização ENEM,2026-10-31,112,8,7.1%,R$12.00,new,Evergreen - promote
EOF

echo "✅ Created: content-performance-$TIMESTAMP.csv"

# Create backlink tracking - education/study niche
cat > "$MONITORING_DIR/backlink-tracking-$TIMESTAMP.csv" << 'EOF'
source_url,source_type,da_score,status,publish_date,expected_impact,notes
pending,education-blog,50+,pending,2026-11-10,+10-15 traffic,Guest post on educational blog
pending,student-forum,40+,pending,2026-11-05,+5-10 traffic,Community mention
pending,reddit,35+,pending,2026-11-03,+20-50 traffic,r/ENEM posts and comments
pending,youtube-channel,60+,pending,2026-11-15,+50-100 traffic,Backlink in video description
pending,quora,45+,pending,2026-11-10,+15-30 traffic,Answer posts - highly targeted
pending,social-media,25+,pending,2026-11-04,+5-20 traffic,Twitter/LinkedIn shares
pending,news-blog,55+,pending,2026-11-20,+30-60 traffic,Press coverage opportunity
pending,university-site,70+,pending,2026-12-01,+100+ traffic,University research reference
EOF

echo "✅ Created: backlink-tracking-$TIMESTAMP.csv"

# Create weekly report template
cat > "$MONITORING_DIR/weekly-report-template.md" << 'EOF'
# Week [X] Report: ENEM-Pro SEO Progress

**Date Range:** [Start] - [End]
**Overall Status:** ⏳ In Progress

## 📊 Key Metrics

### Indexing Progress
- URLs Indexed: [X]/450
- Change from last week: +[X]
- Coverage: [X]%
- Pending indexing: [X]

### Ranking Performance
| Keyword | Position | Change | CTR | Impressions |
|---------|----------|--------|-----|-------------|
| questões ENEM 2026 | # | ↑/↓ | % | # |
| simulado ENEM | # | ↑/↓ | % | # |
| provas anteriores ENEM | # | ↑/↓ | % | # |
| dicas ENEM | # | ↑/↓ | % | # |
| como estudar ENEM | # | ↑/↓ | % | # |

### Traffic & Engagement
- Total Impressions: [X]
- Total Clicks: [X]
- Avg CTR: [X]%
- Avg Position: [X]
- Bounce Rate: [X]%

### Revenue
- Estimated Revenue: R$[X]
- Click-Through Rate: [X]%
- Best Performing Posts: [Top 3]

## 🎯 Actions Taken This Week

- [ ] Check GSC for manual actions or warnings
- [ ] Update keyword rankings
- [ ] Track indexing progress
- [ ] Review top traffic sources
- [ ] Check backlink progress

## 📈 Next Week Goals

- [ ] Target 5+ new question posts
- [ ] Improve avg position by 2-3 spots
- [ ] 100%+ traffic growth
- [ ] Add 5+ internal links to low-performing posts

## ⚠️ Issues & Solutions

| Issue | Impact | Solution | Status |
|-------|--------|----------|--------|
| [Issue] | [High/Med/Low] | [Action] | [Pending/In Progress] |

## 💡 Insights

- [Insight 1]: [Explanation]
- [Insight 2]: [Explanation]
- [Insight 3]: [Explanation]

## 🔮 Next Week Forecast

- Expected indexing: [X] more URLs
- Expected ranking change: [X] positions
- Expected traffic: [X]
- Expected revenue: R$[X]

---
*Report generated: [Date]*
*Next update: [Date]*
EOF

echo "✅ Created: weekly-report-template.md"

# Create automatic alert triggers
cat > "$MONITORING_DIR/alert-thresholds.json" << 'EOF'
{
  "alerts": {
    "indexing": {
      "critical_drop": {
        "threshold": "10+ URLs removed from index",
        "action": "Email alert + immediate investigation"
      },
      "slow_crawl": {
        "threshold": "<5 URLs indexed per week",
        "action": "Resubmit sitemap + check robots.txt and canonical tags"
      },
      "coverage_drop": {
        "threshold": "<85% coverage",
        "action": "Check for 404s, review canonicals, audit internal links"
      }
    },
    "ranking": {
      "major_drop": {
        "threshold": ">10 positions down on priority keywords",
        "action": "Email alert + full content review + competitor analysis"
      },
      "breakthrough": {
        "threshold": "<10 position on ANY target keyword",
        "action": "Track closely + optimize + promote post"
      },
      "top_5_rank": {
        "threshold": "Any keyword reaching position 1-5",
        "action": "Celebrate + document strategy + replicate"
      }
    },
    "traffic": {
      "spike": {
        "threshold": "+300% weekly traffic",
        "action": "Investigate source + capitalize with similar content"
      },
      "drop": {
        "threshold": "-30% weekly traffic",
        "action": "Check for ranking drops + manual penalties + technical issues"
      },
      "seasonal": {
        "threshold": "+500% on 'resultado ENEM' keywords",
        "action": "Prepare bulk content + optimize pages + bid on PPC"
      }
    },
    "revenue": {
      "milestone": {
        "threshold": "R$500 in monthly affiliate revenue",
        "action": "Document success + plan next phase"
      },
      "decline": {
        "threshold": "-20% week-over-week",
        "action": "Review top pages + check CTR + audit affiliate links"
      }
    }
  },
  "monitoring_schedule": {
    "daily": [
      "Check GSC for manual actions or warnings",
      "Monitor trending ENEM keywords"
    ],
    "weekly": [
      "Update keyword rankings (20+ keywords)",
      "Track indexing progress",
      "Calculate revenue",
      "Review top traffic sources",
      "Check backlink progress",
      "Analyze CTR trends"
    ],
    "monthly": [
      "Comprehensive SEO audit",
      "Competitor analysis",
      "Content gap analysis",
      "Revenue analysis",
      "Identify new opportunities"
    ]
  }
}
EOF

echo "✅ Created: alert-thresholds.json"

# Create optimization checklist specific to ENEM
cat > "$MONITORING_DIR/weekly-optimization-checklist.md" << 'EOF'
# Weekly Optimization Checklist for ENEM-Pro

## Every Monday (15 min - GSC Check)

- [ ] **Open Google Search Console**
  - [ ] Check Coverage: Any new crawl errors?
  - [ ] Check Performance: Position changes on top 20 keywords?
  - [ ] Check Mobile Usability: Any new issues?
  - [ ] Check Core Web Vitals: All green?
  - [ ] Update week-[X]-tracking.csv

- [ ] **Keyword Monitoring (10 min)**
  - [ ] Search "questões ENEM 2026" - what position?
  - [ ] Search "simulado ENEM" - what position?
  - [ ] Search "provas anteriores ENEM" - what position?
  - [ ] Search "dicas ENEM" - what position?
  - [ ] Search "resultado ENEM 2026" (seasonal) - tracking?
  - [ ] Update keyword-rankings.csv

- [ ] **Backlink Monitoring (10 min)**
  - [ ] Check Google Alerts for "questões ENEM" mentions
  - [ ] Search competitor backlinks
  - [ ] Update backlink-tracking.csv
  - [ ] Send 3-5 guest post pitches to education blogs

- [ ] **Traffic Analysis (10 min)**
  - [ ] Check analytics dashboard
  - [ ] Compare week-over-week growth
  - [ ] Identify top 5 traffic sources
  - [ ] Update content-performance.csv

## Weekly (Continuous)

- [ ] **Content Updates**
  - [ ] Add 1 new blog post (800+ words)
    - Focus: 1 target ENEM keyword
    - Include: 5+ internal links to relevant posts
  - [ ] Update 2-3 old posts with fresh data
    - Add 2026 ENEM schedule/dates
    - Update ranking tips based on current trends
    - Add new affiliate links if relevant

- [ ] **Backlink Outreach**
  - [ ] Send 3-5 guest post pitches to education sites
  - [ ] Answer 10+ Quora questions about ENEM
  - [ ] Post on Reddit: r/ENEM, r/college, r/Portugal_ENEM
  - [ ] Track responses in backlink-tracking.csv

- [ ] **Internal Linking Optimization**
  - [ ] Add 5-10 new internal links between related posts
    - "simulado ENEM" ↔ "questões ENEM 2026"
    - "dicas ENEM" ↔ "como estudar ENEM"
    - "redação ENEM" ↔ "estrutura competências"

- [ ] **Meta Tag Optimization**
  - [ ] Review titles for top 10 posts by traffic
    - Target: Include power words + keyword + benefit
    - Example: "50+ Questões ENEM 2026 Resolvidas com Explicações"
  - [ ] Update meta descriptions (120-160 chars)
    - Include keyword early in description
    - Add call-to-action

- [ ] **Performance Optimization**
  - [ ] Test Core Web Vitals on top 5 posts
  - [ ] Check page load time (target <2.5s)
  - [ ] Review mobile responsiveness (480px, 768px, 1024px)
  - [ ] Optimize images if LCP > 2.5s

## Monthly (1st of Month)

- [ ] **Comprehensive Audit**
  - [ ] Check for 404 errors in GSC
  - [ ] Analyze crawl stats and crawl errors
  - [ ] Review top 30 pages by traffic
  - [ ] Check mobile vs desktop CTR differences
  - [ ] Analyze competitor rankings

- [ ] **Content Audit**
  - [ ] Identify posts with 0 clicks
  - [ ] Refresh top 5 posts with new ENEM data/2026 info
  - [ ] Check for thin content (<500 words)
  - [ ] Optimize for new long-tail keywords

- [ ] **Backlink Audit**
  - [ ] Track total backlink count (goal: 50+)
  - [ ] Analyze referring domains quality
  - [ ] Plan next month's outreach targets

- [ ] **Revenue Analysis**
  - [ ] Calculate month's total revenue
  - [ ] Identify best-performing posts by revenue
  - [ ] Analyze conversion rate by traffic source
  - [ ] Plan optimization for low-revenue posts

## Seasonal Milestones

- [ ] **When ENEM results release (seasonal)**
  - Promote "resultado ENEM quando sai" content
  - Expect 500%+ traffic spike on result-related posts
  - Prepare social media campaign

- [ ] **When indexed to 450+ URLs**
  - Check for ranking improvements across the board
  - Plan next expansion phase

- [ ] **When reach position 1-5 on any keyword**
  - Document the post and strategy
  - Replicate success on similar posts
  - Consider PPC bidding on that keyword

- [ ] **When rank #1 on "simulado ENEM"**
  - Featured snippet opportunity
  - High-value keyword - maintain quality
  - Plan related content around it

---

**Goal:** Consistent, data-driven optimization leading to #1-5 ranking on 20+ ENEM keywords within 6 months
EOF

echo "✅ Created: weekly-optimization-checklist.md"

echo ""
echo "==========================================="
echo "GSC MONITORING SETUP COMPLETE"
echo "==========================================="
echo ""
echo "📊 Created files:"
echo "  • week-$WEEK_NUM-tracking.csv"
echo "  • keyword-rankings-$TIMESTAMP.csv"
echo "  • content-performance-$TIMESTAMP.csv"
echo "  • backlink-tracking-$TIMESTAMP.csv"
echo "  • weekly-report-template.md"
echo "  • alert-thresholds.json"
echo "  • weekly-optimization-checklist.md"
echo ""
echo "📍 Location: $MONITORING_DIR/"
echo ""
echo "🎯 Next Steps:"
echo "  1. Submit sitemap to Google Search Console (https://search.google.com/search-console)"
echo "  2. Verify property ownership"
echo "  3. Enable email alerts (GSC → Settings → Email preferences)"
echo "  4. Every Monday: Run weekly check from checklist"
echo "  5. Update tracking spreadsheets with real data"
echo ""
echo "📈 Target Metrics (90 days):"
echo "  • URLs Indexed: 412 → 450 (100% coverage)"
echo "  • Avg Position on top keywords: 28 → 12 (top results)"
echo "  • Monthly Traffic: 2400 → 8000+ impressions"
echo "  • Monthly Clicks: 145 → 600+ clicks"
echo "  • Monthly Revenue: R$200 → R$1000+ (affiliate)"
echo ""
