# 🚀 GUIA DE DEPLOYMENT - ENEM Pro Blog

## Status Atual

✅ **Projeto 100% Pronto para Produção**

- 434 posts indexados
- Qualidade média: 84.5/100
- Sitemap submetido ao Google
- Schema.org otimizado (366 posts)
- Analytics configurável
- CI/CD automático

## Deploy Manual (Vercel)

### Opção 1: Via Git (Recomendado)

```bash
# 1. Commit suas mudanças
git add .
git commit -m "🚀 Deploy blog com 434 posts"

# 2. Push para main
git push origin main

# 3. Vercel faz deploy automático
# (espere ~5 minutos)

# 4. Verifique
curl https://questoesenem.pro/blog
```

### Opção 2: Via Vercel CLI

```bash
# 1. Instale Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Aguarde conclusão
```

### Opção 3: Via Dashboard Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione projeto "enem-pro"
3. Seção "Deployments"
4. Clique "Deploy" na versão desejada

## Verificação Pós-Deploy

### ✅ Checklist Rápido (5 min)

```bash
# 1. Site está no ar?
curl -I https://questoesenem.pro

# 2. Blog carrega?
curl -I https://questoesenem.pro/blog

# 3. Posts aparecem?
curl https://questoesenem.pro/blog | grep "class=\"post\""

# 4. Sitemap gerado?
curl https://questoesenem.pro/sitemap.xml | head -20

# 5. Schema.org válido?
curl https://questoesenem.pro/blog/comparativo-apps-enem | grep "application/ld+json"
```

### 🔍 Testes Automáticos

```bash
# Rodar testes localmente antes de fazer push
npm test

# Build production
npm run build

# Verificar bundle size
npm run build -- --analyze
```

## Monitoramento Pós-Deploy

### 📊 Google Search Console

1. **Imediato (0h):**
   - Verificar se sitemap foi recebido
   - URL: https://search.google.com/search-console

2. **24-48h:**
   - Google faz crawl
   - Verificar "Cobertura" > "Indexado"

3. **3-7 dias:**
   - Posts começam a indexar
   - Monitorar erros em "Cobertura"

### 📈 Google Analytics

1. **Setup (5 min):**
   - Measurement ID: G-XXXXXXXX
   - Adicionar em `.env.production`
   - Deploy

2. **Monitoramento (contínuo):**
   - Seção "Realtime" → visitantes agora
   - Seção "Audience" → geografia/device
   - Seção "Content" → posts mais acessados

### ⚡ Performance

```bash
# Testar performance online
# Google Lighthouse: https://developers.google.com/web/tools/lighthouse

# Testar cada post
lighthouse https://questoesenem.pro/blog/comparativo-apps-enem --view

# Core Web Vitals
curl https://questoesenem.pro/blog/comparativo-apps-enem | grep -o '"cls".*'
```

## Rollback (Se Necessário)

### Opção 1: Revert Git

```bash
# Ver histórico
git log --oneline

# Revert para commit anterior
git revert HEAD

# Push
git push origin main
# Vercel faz redeploy automático
```

### Opção 2: Vercel Dashboard

1. Acesse https://vercel.com/dashboard
2. Deployments
3. Clique em versão anterior
4. "Promote to Production"

## Problemas Comuns

### ❌ "Blog não carrega" ou "0 posts"

**Causa:** blog-index.json corrompido

**Solução:**
```bash
# Regenerar
node scripts/force-regenerate-index.js

# Fazer push
git add lib/blog-index.json
git commit -m "🔧 Fix: Regenerate blog index"
git push origin main
```

### ❌ "Heap out of memory" durante build

**Causa:** Dynamic loading não está ativo

**Solução:**
```bash
# Verificar lib/blog-loader-server.ts existe
ls -la lib/blog-loader-server.ts

# Se não, restaurar:
git checkout HEAD~1 -- lib/blog-loader-server.ts

# Fazer push
git commit -am "🔧 Fix: Restore dynamic loader"
git push origin main
```

### ❌ "Sitemap não enviado ao GSC"

**Causa:** Service account sem permissões

**Solução:**
1. Verificar `.env.production.local` tem `GOOGLE_SERVICE_ACCOUNT_KEY`
2. Testar manualmente em `.docs-gsc/MANUAL-GSC-SUBMISSION.txt`
3. Se tudo OK, rodas:
```bash
node scripts/submit-to-gsc.js
```

## Automações Ativas

### CI/CD Pipeline

```
Push to main
    ↓
GitHub Actions
    ├─ npm ci
    ├─ npm run build
    ├─ npm test (se tiver)
    └─ blog quality check
         ↓
    Vercel Deploy (~5 min)
         ↓
    Auto-index GSC
         ↓
    ✅ Done
```

### Monitoramento Contínuo

- **Erros de build:** notificação GitHub
- **Falha de indexação:** email GSC (configure em Search Console)
- **Performance:** Vercel Analytics (dashboard automático)

## Próximos Passos

### 🎯 Curto Prazo (1-2 semanas)

1. ✅ Deploy para produção
2. ⏳ Aguardar Google crawl (3-7 dias)
3. ⏳ Verificar indexação (Cobertura no GSC)
4. ⏳ Configurar Google Analytics

### 🎯 Médio Prazo (1-2 meses)

1. Monitorar rankings (Resultados de Pesquisa no GSC)
2. Otimizar posts com baixo CTR
3. Adicionar links internos estratégicos
4. Análise de traffic via Analytics

### 🎯 Longo Prazo (3+ meses)

1. Link building externo
2. Criação de novos posts baseado em keywords
3. Otimização contínua de Core Web Vitals
4. A/B testing de meta descriptions

## Perguntas Frequentes

**P: Quanto tempo leva para posts aparecerem no Google?**
R: 3-7 dias para indexação, 1-4 semanas para primeiros rankings.

**P: Posso fazer deploy várias vezes por dia?**
R: Sim, sem limite. Mas evite spam de commits.

**P: Como desabilitar um post?**
R: Adicione `noindex: true` no frontmatter do post.

**P: Preciso renovar o Google Service Account?**
R: Não, ele nunca expira (usando chave JSON).

## Suporte

- 📚 Documentação: `.docs-gsc/` e este arquivo
- 🔍 Logs: `git log` e Vercel Dashboard
- 📊 Status: `FINAL-PROJECT-REPORT.json`
- ✅ Checklist: `MONITORING-CHECKLIST.md`

---

**Versão:** 1.0  
**Data:** 2026-08-09  
**Status:** ✅ Pronto para Produção
