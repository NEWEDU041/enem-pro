# 📊 Plano de Performance e SEO - ENEM Pro

**Data:** 31/07/2026  
**Objetivo:** Otimizar PageSpeed, Core Vitals e GSC

---

## 🚀 FASE 2A: TESTAR PERFORMANCE (2-3 horas)

### Passo 1: Deploy em Produção
```bash
# Build otimizado
npm run build

# Deploy (ajuste conforme seu provider)
vercel deploy --prod
# OU
netlify deploy --prod
```

### Passo 2: Testar com Lighthouse
```bash
npm install -g lighthouse

# Testar cada página crítica
lighthouse https://seu-site.com --view
lighthouse https://seu-site.com/questoes --view
lighthouse https://seu-site.com/blog --view
lighthouse https://seu-site.com/simulado --view
lighthouse https://seu-site.com/dashboard --view
```

### Passo 3: Analisar Relatório
**Métricas principais:**
- **Performance Score:** > 80 ✅
- **LCP (Largest Contentful Paint):** < 2.5s ✅
- **FID (First Input Delay):** < 100ms ✅
- **CLS (Cumulative Layout Shift):** < 0.1 ✅

### Passo 4: Otimizar Problemas Encontrados

#### ❌ Se LCP > 2.5s (imagem grande é o culpado)
```bash
# 1. Converter imagens para WebP
npm install sharp
node -e "
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

fs.readdirSync('./public').forEach(file => {
  if (['.png', '.jpg'].includes(path.extname(file))) {
    const src = path.join('./public', file);
    const dest = src.replace(/\.[^.]+$/, '.webp');
    sharp(src)
      .webp({ quality: 80 })
      .toFile(dest)
      .then(() => console.log(\`✅ \${file}\`));
  }
});
"

# 2. Usar next/image com priority
# Em componentes: <Image ... priority loading="eager" />

# 3. Add preconnect ao CDN
# Em app/layout.tsx: <link rel="preconnect" href="https://seu-cdn.com" />
```

#### ❌ Se Performance < 70 (bundle size grande)
```bash
# Analisar bundle
npm run build
npm install -g next-bundle-analyzer

# Remover dependências desnecessárias
npm list | grep deduped

# Code splitting
# Usar dynamic imports:
import dynamic from 'next/dynamic'
const HeavyComponent = dynamic(() => import('./heavy'), { ssr: false })
```

#### ❌ Se CLS alto (layout shifts)
```typescript
// Use aspect-ratio para imagens
<img ... style={{ aspectRatio: '16/9' }} />

// Evite fonts que mudam tamanho
@font-face { font-display: swap; }
```

---

## 🔗 FASE 2B: SUBMETER AO GOOGLE SEARCH CONSOLE (1-2 horas)

### Passo 1: Criar Sitemap
```typescript
// public/sitemap.xml deve existir automaticamente
// Se não, criar manualmente:

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://seu-site.com</loc>
    <lastmod>2026-07-31</lastmod>
  </url>
  <url>
    <loc>https://seu-site.com/questoes</loc>
    <lastmod>2026-07-31</lastmod>
  </url>
  <url>
    <loc>https://seu-site.com/blog</loc>
    <lastmod>2026-07-31</lastmod>
  </url>
  <!-- adicionar todas as URLs principais -->
</urlset>`

// Salvar em public/sitemap.xml
```

### Passo 2: Verificar robots.txt
```
# public/robots.txt
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: https://seu-site.com/sitemap.xml
```

### Passo 3: Google Search Console
1. **Abrir:** https://search.google.com/search-console
2. **Adicionar propriedade:**
   - Tipo: URL Prefix
   - URL: https://seu-site.com
3. **Verificação:**
   - Usar HTML file upload OU
   - Usar DNS TXT record OU
   - Usar Google Analytics
4. **Submeter Sitemap:**
   - Ir em "Sitemaps"
   - Clicar "Add/test sitemap"
   - Entrar: `https://seu-site.com/sitemap.xml`
   - Clicar "Submit"

### Passo 4: Monitorar Cobertura
```
No GSC:
1. Ir em "Coverage"
2. Verificar:
   ✅ Quantas URLs foram indexadas
   ⚠️  "Valid but not indexed" (aguardar 48h)
   ❌ "Error" (corrigir issues)
   ⚠️  "Excluded" (verificar robots.txt)
```

### Passo 5: Submeter URLs Manualmente (se necessário)
```bash
# Se alguma URL não foi indexada após 48h:
# 1. No GSC, clicar "Inspect URL"
# 2. Colar URL (ex: https://seu-site.com/blog/post)
# 3. Clicar "Request indexing"
# 4. Aguardar resposta
```

---

## 📈 FASE 3: MONITORAMENTO CONTÍNUO

### Performance Dashboard
```bash
# Monitorar regularmente (weekly)
lighthouse https://seu-site.com --output-path=./reports/$(date +%Y-%m-%d).html

# Arquivar histórico
mkdir -p ./reports
# Rodá-lo em schedule (CI/CD)
```

### GSC - Métricas Importantes
```
Monitorar periodicamente:
- "Performance" → Click-through rate por query
- "Coverage" → Novas URLs sendo indexadas
- "Mobile Usability" → Erros de mobile
- "Core Web Vitals" → LCP, CLS, FID
- "Crawl Stats" → Quando o Google varre
```

### Analytics
```bash
# Em app/layout.tsx, adicionar Google Analytics:
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXX');
</script>

# Depois acompanhar em: google.com/analytics
```

---

## ✅ CHECKLIST FINAL

### Performance
- [ ] Lighthouse Score > 80 em todas as páginas
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Images em WebP ou otimizadas
- [ ] CSS/JS minificados
- [ ] Cache headers configurados

### SEO
- [ ] Sitemap criado e submetido
- [ ] robots.txt correto
- [ ] Meta tags em todas as páginas
- [ ] Schema.org markup (Article, FAQ, etc)
- [ ] Open Graph tags para social
- [ ] Canonical URLs
- [ ] Internal linking strategy

### GSC
- [ ] Propriedade verificada
- [ ] Sitemap submetido
- [ ] URLs indexadas > 90%
- [ ] Sem erros de cobertura
- [ ] Mobile usability > 95%
- [ ] Core Web Vitals OK

---

## 📊 Métricas a Rastrear

| Métrica | Target | Atual | Status |
|---------|--------|-------|--------|
| Lighthouse Score | 80+ | ? | ❌ |
| LCP | 2.5s | ? | ❌ |
| CLS | 0.1 | ? | ❌ |
| URLs Indexadas | 100% | 0% | ❌ |
| Bounce Rate | <50% | ? | ❌ |
| Avg Session Duration | >2min | ? | ❌ |

---

## 🛠️ Comandos Rápidos

```bash
# Verificar explicações
npm run check-explanations

# Gerar explicações
npm run generate-all-explanations

# Auditar blog
npm run audit-blog-posts

# Build
npm run build

# Lighthouse
lighthouse https://seu-site.com --view

# Testar localmente
npm run dev
```

---

**Próximo:** Executar FASE 2A (Performance) depois FASE 2B (GSC)
