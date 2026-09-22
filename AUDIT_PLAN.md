# 🔍 AUDIT PLAN — ENEM PRO PRODUCTION READINESS

Data: 2026-09-22
Objetivo: Auditoria + Correção Completa para Deploy

---

## ✅ STATUS ATUAL (Pré-Auditoria)

### Infraestrutura
- ✅ `.github/workflows/deploy.yml` — branches master, secrets Vercel OK
- ✅ `vercel.json` — regiões gru1, crons configurados
- ✅ `next.config.js` — PWA, cache-control, redirects OK
- ✅ `.github/workflows/` — 10+ workflows ativos

### Blog Data
- ✅ **411 posts** em `lib/blog-data.ts`
- ✅ **411/411 (100%)** com BlogPosting schema
- ✅ **411/411 (100%)** com FAQPage schema
- ✅ **412 readTime fields** (411 posts + 1 interface)

---

## 📋 CHECKLIST EXECUTIVO

### 1️⃣ VERIFICAR WORKFLOWS (Passo 1)
**Status:** ✅ DONE
- Deploy to Vercel: branches master ✅
- Submit GSC: post-deploy ✅
- Blog quality check: validate-blog-quality.js ✅

### 2️⃣ VERIFICAR VERCEL CONFIG (Passo 2)
**Status:** ✅ DONE
- vercel.json: regiões gru1 ✅
- Crons: refresh-stats, email-drip, gsc-weekly-report ✅
- Production apontado para master ✅

### 3️⃣ VERIFICAR NEXT.CONFIG.JS (Passo 3)
**Status:** ✅ DONE
- buildCache: não configurado (Vercel default)
- Rewrites: vazio (ok)
- Redirects: /inicio → / ✅
- Headers: cache-control por rota ✅
- PWA: habilitado ✅

### 4️⃣ AUDITAR 411 POSTS (Passo 4)
**Status:** 🟡 PARTIAL
- Posts totais: 411 ✅
- BlogPosting schema: 411/411 (100%) ✅
- FAQPage schema: 411/411 (100%) ✅
- **FALTAM MÉTRICAS:**
  - readTime >= 7?
  - score >= 80?
  - wordCount >= 1500?
  - Ligações internas (internal links)?
  - OG images?

### 5️⃣ CORRIGIR POSTS < 80 SCORE (Passo 5)
**Status:** ⏳ PENDING
- Requer análise de cada post
- Implementação de enriquecimento

### 6️⃣ CORRIGIR POSTS < 1500 PALAVRAS (Passo 6)
**Status:** ⏳ PENDING
- Requer expansão de conteúdo
- ~73 posts estimados

### 7️⃣ CORRIGIR POSTS SEM FAQ SCHEMA (Passo 7)
**Status:** ✅ DONE (411/411 já têm)

### 8️⃣ CORRIGIR POSTS COM READTIME < 7 (Passo 8)
**Status:** ⏳ PENDING
- Requer análise de readTime
- ~6 posts estimados

### 9️⃣ DEPLOY (Passo 9)
**Status:** ⏳ PENDING
- Commit final
- Push master
- Trigger GitHub Actions
- Monitor Vercel build

### 🔟 VERIFICAR GSC (Passo 10)
**Status:** ⏳ PENDING
- Reenviar sitemap
- Monitorar 404s
- Verif indexação

---

## 🎯 PRÓXIMOS PASSOS

### Passo 4.1: Analisar Métricas dos Posts
```bash
# Criar script para extrair:
# - readTime de cada post
# - score (se existir)
# - wordCount
# - internal links
# - OG images

node scripts/audit-detailed.js > audit-results.json
```

### Passo 4.2: Gerar Relatório Detalhado
```
- Posts com readTime < 7 (lista + slugs)
- Posts com < 1500 palavras (lista + slugs)
- Posts com score < 80 (se campo existe)
- Posts com < 3 internal links
- Posts sem OG image
```

### Passo 5-8: Bulk Fixes
- Implementar enriquecimento automático (script Python)
- Adicionar mais conteúdo aos posts curtos
- Adicionar internal links estratégicos
- Validar readTime automático

### Passo 9: Commit + Deploy
```bash
git add .
git commit -m "refactor: comprehensive audit + content enrichment — all posts >= 80 score, >= 1500 words, >= 7 min readTime"
git push origin master
# GitHub Actions dispara
# Vercel faz build e deploy
```

### Passo 10: GSC + Monitor
- Reenviar sitemap em Google Search Console
- Monitorar erros de indexação
- Verificar Core Web Vitals

---

## 📊 MÉTRICAS-ALVO (Após Correção)

| Métrica | Atual | Alvo |
|---------|-------|------|
| Posts com readTime >= 7 min | ? | 411/411 (100%) |
| Posts com score >= 80 | ? | 411/411 (100%) |
| Posts com >= 1500 palavras | ? | 411/411 (100%) |
| BlogPosting schema | 411/411 | 411/411 ✅ |
| FAQPage schema | 411/411 | 411/411 ✅ |
| Internal links >= 3 | ? | 411/411 |
| OG images | ? | 411/411 |
| Mobile score (Lighthouse) | ? | >= 80 |

---

## ⏱️ TIMELINE

- **Passo 1-3:** Já feito (infraestrutura OK)
- **Passo 4:** Hoje — análise detalhada (30 min)
- **Passo 5-8:** Hoje — bulk fixes (2-3 h)
- **Passo 9:** Hoje — commit + deploy (30 min)
- **Passo 10:** Amanhã — monitor GSC (monitoramento contínuo)

---

## 🔗 Recursos

- [ENEM Pro Deployment Guide](./DEPLOYMENT.md)
- [Blog Quality Checklist](./scripts/validate-blog-quality.js)
- [Google Search Console](https://search.google.com/search-console?resource_id=https%3A%2F%2Fquestoesenem.pro%2F)
- [Vercel Dashboard](https://vercel.com/dashboard)

---

**Responsável:** Claude Code
**Status:** Em Progresso 🟡
