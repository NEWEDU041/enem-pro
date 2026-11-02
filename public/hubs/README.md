# Hub-and-Spoke Architecture for ENEM Pro

## Overview

This directory contains the hub-and-spoke architecture implementation for topical authority in ENEM Pro. The structure includes:

- **8 Hub Pages**: Comprehensive guides for each major subject/topic
- **100+ Internal Links**: Each hub links to 20+ spoke articles
- **Schema.org Markup**: Course, FAQ, BreadcrumbList, and CollectionPage schemas
- **SEO Optimization**: Designed for featured snippets, topical clusters, and E-E-A-T signals

## Hub Structure

### Hub Pages (HTML)

1. **matematica.html** - Mathematics (Álgebra, Geometria, Trigonometria, Análise Combinatória, etc.)
   - 1500+ words
   - 20+ internal links
   - 8 main topic sections
   - FAQ section with structured Q&A

2. **portugues.html** - Portuguese (Redação, Interpretação, Gramática, Crase, etc.)
   - 1500+ words
   - 15+ internal links
   - 5 competencies breakdown
   - FAQ section

3. **historia.html** - History (Períodos, Brasil Colonial, Revoluções, Ditadura, etc.)
   - 1500+ words
   - 15+ internal links
   - 4 topic sections
   - FAQ section

4. **geografia.html** - Geography (Biomas, Clima, Urbanização, Migrações, Globalização, etc.)
   - 1500+ words
   - 15+ internal links
   - 4 geography domains
   - FAQ section

5. **ciencias.html** - Natural Sciences (Biologia, Química, Física)
   - 1500+ words
   - 20+ internal links
   - Biology, Chemistry, Physics sections
   - FAQ section

6. **multidisciplinar.html** - Multi-subject (Contextualized Questions, Real-world Problems)
   - 1500+ words
   - 10+ internal links
   - Integration of multiple disciplines
   - FAQ section

7. **estrategias-prova.html** - Test Strategies (Time Management, Anxiety Control, Reading Techniques)
   - 1500+ words
   - 15+ internal links
   - Actionable test-day strategies
   - FAQ section

8. **revisao-preparacao.html** - Revision & Preparation (Study Techniques, Spaced Repetition, Schedules, Mock Exams)
   - 1500+ words
   - 20+ internal links
   - Evidence-based study methods
   - FAQ section

### Index Page

- **index.html** - Hub landing page with directory of all 8 hubs
  - CollectionPage schema
  - Stats (8 hubs, 100+ articles, 1500+ words per hub)
  - Cards with links to each hub

## Schema Markup

### product-schema-generator.js

A JavaScript module that generates schema.org markup for educational content:

```javascript
// Course Schema
generateCourseSchema({
  name: "Matemática no ENEM",
  description: "...",
  learningOutcomes: ["Álgebra", "Geometria", ...],
})

// FAQ Schema
generateFAQSchema(faqArray)

// Breadcrumb Schema
generateBreadcrumbSchema(breadcrumbItems)

// Comprehensive Hub Schema (combines Course + FAQ + BreadcrumbList)
generateHubSchema({
  courseName, courseDescription, courseUrl,
  faqs, breadcrumbs, relatedArticles
})
```

## Linking Strategy

### Hub Structure (Topical Clusters)

```
Hub (Pillar Page)
├── Section 1
│   └── 3-5 Spoke Articles (Internal Links)
├── Section 2
│   └── 3-5 Spoke Articles
├── Section 3
│   └── 3-5 Spoke Articles
└── ...
```

### Link Distribution

- **Hub → Spoke**: 20+ links from hub to related articles
- **Spoke → Hub**: Each spoke article should link back to hub
- **Spoke → Spoke**: Related articles should link to each other (contextual)

## SEO Benefits

### Topical Authority
- Google recognizes hubs with 1500+ words covering a topic deeply as authoritative
- Clusters (hub + spokes) signal topical expertise
- Links flowing from hub to spokes create topical relevance

### Featured Snippets
- FAQ sections are prime real estate for featured snippets
- Structured Q&A with 40-60 word answers optimizes for snippet capture
- Position 0 (featured snippet) drives 8-12% more CTR

### E-E-A-T Signals
- **Expertise**: Comprehensive coverage by subject matter experts
- **Experience**: Real-world examples, study techniques, ENEM-specific insights
- **Authoritativeness**: Internal linking shows topical depth
- **Trustworthiness**: Cited sources, numbers, verified information

### Expected Improvements

**Target Metrics:**
- Topical authority increase: +50%
- Featured snippets: +25%
- Click-through rate (CTR): +15-20%
- Average position: -2 to -3 (improvement)
- Organic traffic: +30-40% (first 3-6 months)

## Implementation Checklist

### Phase 1: Content Verification
- [x] 8 hub pages created with 1500+ words each
- [x] FAQ sections with 3-5 Q&A pairs per hub
- [x] Schema markup for Course, FAQ, Breadcrumb, CollectionPage
- [x] Hub index page with all 8 hubs listed

### Phase 2: Internal Linking
- [ ] Update blog posts to link to relevant hubs
- [ ] Add hub links to navigation/footer
- [ ] Create hub sitemap for XML sitemap
- [ ] Verify 20+ internal links per hub (check spoke accuracy)

### Phase 3: SEO Verification
- [ ] Test schema markup with Schema.org validator
- [ ] Verify breadcrumb implementation
- [ ] Check featured snippet opportunities
- [ ] Monitor SERP changes in Google Search Console

### Phase 4: Monitoring
- [ ] Track rankings for hub pages in GSC
- [ ] Monitor featured snippets (SEMrush, Ahrefs)
- [ ] Measure organic traffic increase
- [ ] A/B test CTA buttons and link placement

## File Structure

```
public/hubs/
├── index.html                          # Hub landing page
├── matematica.html                     # Math hub
├── portugues.html                      # Portuguese hub
├── historia.html                       # History hub
├── geografia.html                      # Geography hub
├── ciencias.html                       # Sciences hub
├── multidisciplinar.html               # Multi-subject hub
├── estrategias-prova.html              # Test strategies hub
├── revisao-preparacao.html             # Revision/prep hub
├── product-schema-generator.js         # Schema generator
└── README.md                           # This file
```

## Usage

### Accessing Hubs

Hubs are accessible at:
- https://enem-pro.com/hubs/ (index)
- https://enem-pro.com/hubs/matematica
- https://enem-pro.com/hubs/portugues
- https://enem-pro.com/hubs/historia
- https://enem-pro.com/hubs/geografia
- https://enem-pro.com/hubs/ciencias
- https://enem-pro.com/hubs/multidisciplinar
- https://enem-pro.com/hubs/estrategias-prova
- https://enem-pro.com/hubs/revisao-preparacao

### Schema Validation

To validate schema markup:
1. Use [Google Rich Results Test](https://search.google.com/test/rich-results)
2. Use [Schema.org Validator](https://validator.schema.org/)
3. Use [Structured Data Testing Tool](https://developers.google.com/webmasters/structured-data)

## Technical Details

### HTML Structure

Each hub page follows this structure:
```html
<head>
  <!-- Meta tags for SEO -->
  <meta name="description" content="...">
  <meta property="og:*" content="...">
  <link rel="canonical" href="...">
  
  <!-- Schema markup -->
  <script type="application/ld+json">{ Course, FAQ, Breadcrumb schemas }</script>
</head>
<body>
  <header>Navigation</header>
  <main>
    <breadcrumb>
    <hero>
    <section>Key Topics</section>
    <section>Quick Index (TOC)</section>
    <section id="section1">Section with Spokes</section>
    <section id="section2">Another Section</section>
    ...
    <section id="faq">FAQ</section>
  </main>
  <footer>
</body>
```

### Responsive Design

- Mobile-first approach
- CSS Grid for hub cards
- Flexbox for navigation
- Media queries for tablets and phones

### Performance Optimization

- Static HTML (no database queries)
- Minimal external dependencies
- Inline CSS (no separate stylesheet)
- Optimized for Core Web Vitals

## Future Improvements

1. **Dynamic Hub Generation**: Create a Node.js script to generate hubs from data
2. **Hub Templates**: Develop React/Next.js components for DRY hub generation
3. **Automated Linking**: Script to identify and add internal links to spokes
4. **Analytics**: Track hub traffic, engagement, conversion rates
5. **A/B Testing**: Test different CTA placements, hub sections, link colors
6. **Internationalization**: Translate hubs to Spanish, English for broader reach

## Notes

- All hubs are optimized for desktop and mobile
- Schema markup follows schema.org v1.0+
- Colors are consistent with ENEM Pro brand
- Links use relative URLs (`/blog/...`) for easier deployment
- Each hub includes a "Next Steps" section with call-to-action

## Questions?

For questions about hub structure, schema markup, or SEO implementation, refer to:
- [Hub-and-Spoke Strategy - Moz](https://moz.com/blog/hub-spoke)
- [Topical Authority - Search Engine Journal](https://www.searchenginejournal.com/topical-authority/)
- [Schema.org Documentation](https://schema.org)
- [Google Search Central](https://developers.google.com/search)
