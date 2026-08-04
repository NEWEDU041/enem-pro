# ⚡ EXECUTE AGORA - GUIA COMPLETO COM COMANDOS

**Status:** Pronto para começar AGORA  
**Tempo Total:** 14-22 horas em paralelo  
**Impacto:** Transformação completa do projeto

---

## 🔴 FASE 1: CRÍTICA (2-3 DIAS) - COMEÇAR AGORA!

### ✅ 1.1 VERIFICAR ENCODING
**Status:** ✅ CONCLUÍDO - Sem problemas encontrados!

Já verificamos e confirmamos:
- 180 questões analisadas
- 0 caracteres corrompidos
- ✅ JSON está 100% válido

### 🚀 1.2 GERAR EXPLICAÇÕES (4-6 horas)

#### Setup
```bash
cd C:\Projetos\enem-pro

# Verificar variáveis de ambiente
echo %NEXT_PUBLIC_SUPABASE_URL%
echo %SUPABASE_SERVICE_ROLE_KEY%
echo %ANTHROPIC_API_KEY%

# Se não estiver configurado, adicionar ao .env.local:
# NEXT_PUBLIC_SUPABASE_URL=seu-url
# SUPABASE_SERVICE_ROLE_KEY=sua-chave
# ANTHROPIC_API_KEY=sua-chave-anthropic
```

#### Verificar Situação Atual
```bash
npm run check-explanations

# Output esperado:
# ✅ Explicações no banco: X
# 📌 Questões com explicação: Y
# ❌ Questões sem explicação: Z
# 📊 Cobertura: XX%
```

#### COMEÇAR GERAÇÃO
```bash
# OPÇÃO 1: Gerar todas as faltando (RECOMENDADO)
npm run generate-all-explanations

# OPÇÃO 2: Se existir script no package.json
npm run bulk-generate-explanations-v2

# OPÇÃO 3: Se nem option 1 nem 2 existirem
npx ts-node scripts/generate-all-explanations.ts

# Tempo: ~2-4 horas dependendo de quantas faltam
# Custo: ~$30-50 (API Anthropic)
```

#### Validar Resultado
```bash
npm run validate-explanations

# Output esperado:
# ✅ 900/900 questões com explicação
# 📊 Cobertura: 100%
```

---

## 🟠 FASE 2: IMPORTANTE (3-5 DIAS) - DURANTE OU APÓS FASE 1

### 2.1 OTIMIZAR BLOG POSTS (2-3 horas)

#### Auditar Status Atual
```bash
npm run audit-blog-posts

# Output mostrará:
# ✅ Posts com boa pontuação
# ⚠️ Posts que precisam de ajuste
# ❌ Problemas críticos
```

#### Revisar Cada Post
```bash
# Abrir cada post em editor:
code blog-posts/01-cronograma-oficial-enem-2026.md

# Checklist para cada post:
# [ ] Title: 50-60 caracteres
# [ ] Description: 150-160 caracteres
# [ ] Tem image/hero?
# [ ] Tem H1 no conteúdo?
# [ ] Tem H2 (índice)?
# [ ] Tem links internos?
# [ ] Sem erros de digitação?
# [ ] Pontuação final: > 80/100?
```

#### Template para Meta Tags
```markdown
---
title: "Seu Título (50-60 chars)"
description: "Sua descrição (150-160 chars)"
date: "2026-07-31"
image: "/images/seu-post-hero.jpg"
slug: "seu-post-slug"
---

# H1 Título Principal

Introdução breve...

## Índice
- [Seção 1](#secao-1)
- [Seção 2](#secao-2)
- [Conclusão](#conclusao)

## Seção 1
Conteúdo...

## Seção 2
Conteúdo...

## Conclusão
[Link para outra página](/questoes)
```

#### Validar Novamente
```bash
npm run audit-blog-posts

# Esperado: Todos > 80/100
```

---

### 2.2 TESTAR PAGESPEED & CORE VITALS (2-3 horas)

#### Deploy em Produção (se ainda não estiver)
```bash
npm run build

# Vercel
vercel deploy --prod

# OU Netlify
netlify deploy --prod

# OU seu provider...
```

#### Instalar Lighthouse
```bash
npm install -g lighthouse
```

#### Testar Cada Página Crítica
```bash
# Home
lighthouse https://seu-site.com --view

# Questões
lighthouse https://seu-site.com/questoes --view

# Blog
lighthouse https://seu-site.com/blog --view

# Simulado
lighthouse https://seu-site.com/simulado --view

# Dashboard
lighthouse https://seu-site.com/dashboard --view
```

#### Analisar Relatórios
**Abrir arquivo HTML gerado e verificar:**

**Performance Score:**
- ✅ > 80: Nenhuma ação
- ⚠️ 70-80: Otimizar imagens
- ❌ < 70: Ações urgentes

**Core Web Vitals:**
- ✅ Verdes: OK
- 🟠 Amarelas: Monitorar
- 🔴 Vermelhas: Corrigir

#### Otimizar (se necessário)

##### ❌ LCP > 2.5s (Imagens Grandes)
```bash
# Converter todas as imagens para WebP
npm install sharp

node -e "
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dirs = ['./public', './app'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  
  fs.readdirSync(dir, { recursive: true }).forEach(file => {
    const full = path.join(dir, file);
    if (['.png', '.jpg', '.jpeg'].includes(path.extname(file))) {
      const dest = full.replace(/\.[^.]+$/, '.webp');
      sharp(full)
        .webp({ quality: 80 })
        .toFile(dest)
        .then(() => console.log(\`✅ \${file}\`))
        .catch(e => console.log(\`❌ \${file}\`));
    }
  });
});
"
```

##### ❌ Performance < 70 (Bundle Grande)
```bash
# Analisar dependências
npm ls --depth=0

# Remover não-essenciais
npm uninstall nome-pacote

# Code splitting (no component)
import dynamic from 'next/dynamic'
const HeavyChart = dynamic(() => import('./chart'), { ssr: false })
```

---

### 2.3 SUBMETER AO GOOGLE SEARCH CONSOLE (1-2 horas)

#### Passo 1: Criar/Verificar Sitemap
```bash
# Verificar se existe
ls public/sitemap.xml

# Se não existir, criar manualmente em public/sitemap.xml:
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://seu-site.com</loc></url>
  <url><loc>https://seu-site.com/questoes</loc></url>
  <url><loc>https://seu-site.com/blog</loc></url>
  <url><loc>https://seu-site.com/simulado</loc></url>
  <url><loc>https://seu-site.com/dashboard</loc></url>
  <url><loc>https://seu-site.com/planos</loc></url>
  <!-- adicionar todas as URLs principais -->
</urlset>
```

#### Passo 2: Verificar robots.txt
```bash
# Verificar que existe
cat public/robots.txt

# Conteúdo esperado:
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Sitemap: https://seu-site.com/sitemap.xml
```

#### Passo 3: Adicionar no Google Search Console
1. **Abrir:** https://search.google.com/search-console
2. **Clicar:** "+ Adicionar propriedade"
3. **Escolher:** "Prefixo de URL"
4. **Entrar:** `https://seu-site.com`
5. **Verificar:** Seguir instruções (HTML file ou DNS)
6. **Clicar:** "Verificar"

#### Passo 4: Submeter Sitemap
1. **No GSC:** Ir em "Sitemaps"
2. **Clicar:** "Add/test sitemap"
3. **Entrar:** `sitemap.xml`
4. **Clicar:** "Submit"
5. **Aguardar:** 24-48h para indexação

#### Passo 5: Monitorar
```
A cada 2 dias, checar:
- Coverage: Quantas URLs indexadas
- Performance: Cliques, impressões
- Mobile Usability: Erros mobile
- Core Web Vitals: Métricas
```

---

## 🟢 FASE 3: OTIMIZAÇÃO (7-10 DIAS) - APÓS FASE 2

### 3.1 REFATORAR CÓDIGO (3-5 dias)
```bash
# Aplicar simplificações
npm run simplify  # Se existir

# Retirar imports não usados
npm run check-imports  # Se existir

# Rodar linter
npm run lint

# Testar
npm run test
```

### 3.2 IMPLEMENTAR CACHE & PWA (2-3 dias)
```bash
# Instalar workbox para PWA
npm install next-pwa

# Configurar em next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
})
module.exports = withPWA({
  // sua config
})
```

### 3.3 SCHEMA.ORG MARKUP (1-2 dias)
```typescript
// Em app/blog/[slug]/page.tsx ou post layouts
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      image: post.image,
      datePublished: post.date,
      author: {
        '@type': 'Person',
        name: 'ENEM Pro',
      },
    }),
  }}
/>
```

---

## 📊 SUMMARY DE AÇÕES

### IMEDIATO (Hoje)
```bash
# Rodar checagem
npm run check-explanations

# Se faltarem explicações, começar:
npm run generate-all-explanations

# Enquanto roda em background, auditar blog:
npm run audit-blog-posts
```

### PRÓXIMOS 2 DIAS
```bash
# Quando terminar explicações:
npm run validate-explanations

# Otimizar blog posts (manual)
# Revisar cada arquivo em blog-posts/

# Revisar em dev
npm run dev
```

### DIAS 3-5
```bash
# Build
npm run build

# Deploy
vercel deploy --prod

# Testar performance
npm install -g lighthouse
lighthouse https://seu-site.com --view

# Submeter ao GSC
# (seguir passo a passo acima)
```

### DIAS 7-10
```bash
# Monitorar
npm run check-explanations  # Verificar cobertura
npm run audit-blog-posts     # Re-auditar

# No GSC: Verificar indexação e performance
# Em Analytics: Revisar métricas
```

---

## ✅ FINAL CHECKLIST

### FASE 1 ✓
- [ ] 0 caracteres corrompidos em questões
- [ ] 100% de questões com explicações
- [ ] validate-explanations passa

### FASE 2 ✓
- [ ] Blog posts: todas > 80/100
- [ ] Lighthouse Score > 80
- [ ] Core Web Vitals: green
- [ ] GSC: URLs indexadas > 90%
- [ ] robots.txt ok
- [ ] Sitemap submetido

### FASE 3 ✓
- [ ] Código refatorado
- [ ] PWA funcionando
- [ ] Schema markup adicionado
- [ ] Monitoring em produção

---

## 🆘 TROUBLESHOOTING

### Rate limit na geração de explicações
```bash
# Reduzir paralelismo
BATCH_SIZE=1 npm run generate-all-explanations
```

### "Module not found" ao rodar scripts
```bash
npm install
```

### Lighthouse não roda
```bash
npm install -g lighthouse@latest
lighthouse https://seu-site.com --config-path=./lighthouse-config.js
```

### GSC não indexa
```bash
# 1. Verificar robots.txt permite
# 2. Verificar sitemap.xml existe
# 3. Forçar reindex: GSC > Inspect URL > Request indexing
# 4. Aguardar 48h
```

---

**COMEÇAR AGORA MESMO! 🚀**

Próximo comando a rodar:
```bash
cd C:\Projetos\enem-pro
npm run check-explanations
```
