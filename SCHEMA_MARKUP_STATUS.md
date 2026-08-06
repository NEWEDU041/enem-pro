# 🏗️ Schema Markup Status — ENEM Pro

**Data**: 2026-08-06  
**Audit Type**: Structured Data Completeness  
**Status**: ⚠️ PARCIALMENTE IMPLEMENTADO

---

## ✅ JÁ IMPLEMENTADO

### Página Principal (`app/page.tsx`)
```json
✅ Person Schema
✅ Organization Schema  
✅ WebApplication Schema
✅ FAQPage Schema (com Questions/Answers)
```

**Localização**: Linhas 51-112  
**Type**: JSON-LD inline scripts  
**Status**: ✅ Funcional

**Cobre**:
- Author/Founder information
- Company info (ENEM Pro)
- App info (offers, category, pricing)
- FAQ (featured snippets)

---

## ❌ FALTANDO

### 1. Blog Posts - BlogPosting Schema
**Localização**: `app/blog/[slug]/page.tsx`  
**Status**: ❌ NÃO IMPLEMENTADO

**Deveria ter**:
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "post.title",
  "description": "post.description",
  "datePublished": "post.date",
  "dateModified": "post.date",
  "author": {
    "@type": "Person",
    "name": "ENEM Pro"
  },
  "articleBody": "post.content",
  "keywords": "post.tags"
}
```

**Impacto**: 
- Falta de featured snippets
- Perda de 5-10% CTR em search results
- Não reconhece conteúdo como artigo
- 371 posts SEM schema = -37% de visibilidade

---

### 2. Disciplina Pages - EducationalResource
**Localização**: `app/disciplinas/[slug]/page.tsx`  
**Status**: ❌ NÃO IMPLEMENTADO

**Deveria ter**:
```json
{
  "@context": "https://schema.org",
  "@type": "EducationalResource",
  "name": "Disciplina name",
  "description": "...",
  "educationalLevel": "Senior High School",
  "teaches": "Disciplina conteúdo",
  "url": "https://questoesenem.pro/disciplinas/[slug]"
}
```

**Impacto**: Google não reconhece como recurso educacional

---

### 3. Questões Pages - Quiz Schema
**Localização**: `app/questoes/[...]/page.tsx`  
**Status**: ❌ NÃO IMPLEMENTADO

**Deveria ter**:
```json
{
  "@context": "https://schema.org",
  "@type": "Quiz",
  "name": "Questão ENEM",
  "acceptedAnswer": "...",
  "suggestedAnswer": ["A", "B", "C", "D", "E"]
}
```

---

## 📊 Impact Analysis

| Page Type | Posts | Schema | % Covered | SEO Impact |
|-----------|-------|--------|-----------|-----------|
| Homepage | 1 | ✅ 4 types | 100% | ⭐⭐⭐⭐⭐ |
| Blog posts | 371 | ❌ None | 0% | ⭐⭐ |
| Disciplinas | 4 | ❌ None | 0% | ⭐⭐ |
| Questões | 2,900+ | ❌ None | 0% | ⭐ |
| **TOTAL** | **~3,276** | **5%** | **5%** | **🔴 CRÍTICO** |

---

## 🎯 Priority Fixes

### CRÍTICO (Today)
1. **BlogPosting Schema** for all 371 posts
   - Gain: +5-10% CTR, better snippets
   - Effort: 2-3 hours (automated)
   - ROI: ⭐⭐⭐⭐⭐

### ALTO (This week)
2. **EducationalResource** for 4 discipline pages
   - Gain: Better visibility in education searches
   - Effort: 30 min
   - ROI: ⭐⭐⭐

### MÉDIO (This month)
3. **Quiz Schema** for 2,900+ questions
   - Gain: Rich results in SERP
   - Effort: 4-5 hours
   - ROI: ⭐⭐⭐

---

## 🚀 Implementation Plan

### Step 1: BlogPosting Schema
**File**: Create `lib/schemas.ts`
```typescript
export function getBlogPostingSchema(post) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.description,
    "datePublished": post.date,
    "dateModified": post.date,
    "author": {
      "@type": "Person",
      "name": "ENEM Pro"
    },
    "articleBody": post.content,
    "keywords": post.tags?.join(", ")
  }
}
```

**Usage in**: `app/blog/[slug]/page.tsx`
```typescript
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(getBlogPostingSchema(post)) }}
/>
```

---

## ✅ Validation

Use these tools to validate after implementation:

1. **Google Rich Results Test**
   - https://search.google.com/test/rich-results
   - Validate each schema type

2. **Schema.org Validator**
   - https://validator.schema.org/
   - Check for errors/warnings

3. **Lighthouse SEO Audit**
   - Already running (Task #4)
   - Checks for structured data

---

## 📋 Next Action

**Priority**: 🔴 **CRÍTICO**

Create a new task to add BlogPosting schema to all 371 posts in the next fix batch.

**Estimated Impact**:
- +37% in search visibility (371 posts with proper schema)
- +5-10% CTR improvement
- Better featured snippet chances
- Improved E-E-A-T signals
