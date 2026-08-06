# Quick Start — Implementação em 48h

**Objetivo**: Integrar otimizações SEO nas 4 ferramentas principais e ir ao ar.

---

## ⚡ Plano Rápido (48 horas)

### DIA 1: Manhã (2-3 horas)

**Tarefa**: Validar e preparar

```bash
# 1. Baixar os 4 arquivos otimizados
#    - page-seo-optimized.tsx (questoes)
#    - page-seo-optimized.tsx (simulado)
#    - page-seo-optimized.tsx (calcular-nota)
#    - page-seo-optimized.tsx (gabarito)

# 2. Validar schemas JSON-LD
npm install -g schema-dts

# 3. Rodar Lighthouse baseline nos atuais
npx lighthouse https://enem.pro/questoes --view
npx lighthouse https://enem.pro/simulado --view
npx lighthouse https://enem.pro/calcular-nota --view
npx lighthouse https://enem.pro/gabarito --view
```

**Checklist:**
- [ ] Arquivos otimizados revisados
- [ ] Schemas validados em Schema.org Validator
- [ ] Lighthouse baseline coletado (4 páginas)
- [ ] Backup dos arquivos atuais feito

---

### DIA 1: Tarde (3-4 horas)

**Tarefa**: Integrar conteúdo

Para cada um dos 4 arquivos de página:

```typescript
// Opção Rápida: Copiar só o conteúdo sr-only e schemas

// 1. Abrir app/questoes/page.tsx
// 2. Substituir a seção <div className="sr-only">...</div>
//    com conteúdo de page-seo-optimized.tsx
// 3. Adicionar os schemas novos (Tool, atualizar FAQ)
// 4. Verificar links internos

// REPETIR para as 4 ferramentas
```

**Checklist:**
- [ ] Questões: conteúdo sr-only + schemas integrados
- [ ] Simulado: conteúdo sr-only + schemas integrados
- [ ] Calcular Nota: conteúdo sr-only + schemas integrados
- [ ] Gabarito: conteúdo sr-only + schemas integrados
- [ ] Todos os links internos testados

---

### DIA 1: Noite (1-2 horas)

**Tarefa**: Testes locais

```bash
# 1. Build local
npm run build

# 2. Start local server
npm run start

# 3. Testar cada página em localhost:3000
#    - Verificar schemas aparecem
#    - Verificar links internos funcionam
#    - Verificar conteúdo sr-only invisível
#    - Verificar mobile responsiveness

# 4. Rodar Lighthouse
npx lighthouse http://localhost:3000/questoes --view
npx lighthouse http://localhost:3000/simulado --view
npx lighthouse http://localhost:3000/calcular-nota --view
npx lighthouse http://localhost:3000/gabarito --view

# 5. Validar schemas no Google Rich Results Test
#    https://search.google.com/test/rich-results
```

**Checklist:**
- [ ] Build local executado sem erros
- [ ] Todas 4 páginas renderizam corretamente
- [ ] Todos links internos funcionam
- [ ] Schemas aparecem no HTML source
- [ ] Lighthouse ≥85 (meta: 90+)
- [ ] Google Rich Results mostra sucesso

---

### DIA 2: Manhã (1-2 horas)

**Tarefa**: Deploy em staging

```bash
# 1. Commit das mudanças
git add app/questoes/page.tsx app/simulado/page.tsx app/calcular-nota/page.tsx app/gabarito/page.tsx
git commit -m "SEO: Otimização completa de 4 ferramentas principais

- Conteúdo expandido (7+ seções por página)
- Schemas: SoftwareApplication + Tool + FAQ + Breadcrumb
- FAQ expandido (5-7 perguntas por página)
- Internal linking estratégico entre ferramentas
- Metadata otimizado com keywords long-tail

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"

# 2. Push para branch de staging
git push origin feature/seo-tools-optimization

# 3. Deploy para staging
vercel deploy --prebuilt

# 4. Testar em staging
# https://enem-pro-staging.vercel.app/questoes
# https://enem-pro-staging.vercel.app/simulado
# etc.
```

**Checklist:**
- [ ] Código commitado com mensagem descritiva
- [ ] Deploy em staging bem-sucedido
- [ ] Todas 4 páginas carregam em staging
- [ ] Testar schemas em staging com Rich Results Test

---

### DIA 2: Tarde (2-3 horas)

**Tarefa**: Deploy em produção + GSC

```bash
# 1. Merge para main e deploy
git checkout main
git merge feature/seo-tools-optimization
git push origin main

# Vercel auto-deploys on main push

# 2. Verificar deploy em produção
# https://enem.pro/questoes (aguardar 2-3 min para build)

# 3. Submeter URLs para reindexação no GSC
# a. Ir para Google Search Console
# b. Selecionar enem.pro
# c. URL Inspector
# d. Testar (copiar URL) e pedir indexação para cada:
#    - https://enem.pro/questoes
#    - https://enem.pro/simulado
#    - https://enem.pro/calcular-nota
#    - https://enem.pro/gabarito

# 4. Submeter sitemap (já deve estar no robots.txt)
# URL do sitemap: https://enem.pro/sitemap.xml
```

**Checklist:**
- [ ] Deploy em produção bem-sucedido
- [ ] Todas 4 páginas carregam e renderizam
- [ ] GSC: 4 URLs submetidas para indexação
- [ ] Sitemap submetido em GSC

---

### DIA 2: Noite (1 hora)

**Tarefa**: Monitoramento inicial

```bash
# 1. Adicionar à pauta de monitoramento
# a. SEMrush - rastrear keywords principais
# b. Google Search Console - watching impressões
# c. Analytics - tracking comportamento

# 2. Criar dashboard de monitoramento
# KPIs a rastrear:
#    - Impressões (meta: +50% em 30 dias)
#    - CTR (meta: +20-30%)
#    - Posição média (meta: -3 a -5)
#    - Tráfego organizado (meta: +100% em 90 dias)

# 3. Agendar reviews
#    - 7 dias: primeiros sinais
#    - 30 dias: avaliação completa
#    - 90 dias: report detalhado
```

**Checklist:**
- [ ] URLs monitoradas em SEMrush
- [ ] Dashboard GSC criado
- [ ] KPIs definidos e rastreáveis
- [ ] Reviews agendadas (7d, 30d, 90d)

---

## 📋 Arquivo-por-Arquivo: Exatamente o que copiar

### 1. `/app/questoes/page.tsx`

**Adicionar no topo (imports):**
```typescript
// Já tem: import type { Metadata } from 'next', Link, etc.
```

**Adicionar após imports (schemas):**
```typescript
const softwareSchema = { /* conteúdo de page-seo-optimized.tsx */ }
const toolSchema = { /* conteúdo de page-seo-optimized.tsx */ }
const faqSchema = { /* conteúdo de page-seo-optimized.tsx */ }
const breadcrumbSchema = { /* conteúdo de page-seo-optimized.tsx */ }
```

**Atualizar metadata:**
```typescript
export const metadata: Metadata = {
  title: 'Banco de Questões ENEM — 2.900+ Questões Reais com Gabarito e Explicações de IA',
  description: 'Pratique com 2.900+ questões reais do ENEM (2009-2024). Filtro por disciplina, ano e dificuldade. Gabarito imediato + explicações detalhadas no Plano Pro. Grátis.',
  keywords: ['questões ENEM', 'banco de questões ENEM', ...],
  // resto do metadata igual
}
```

**No return() do componente:**
```tsx
<>
  {/* Adicionar 4 scripts de schema aqui */}
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

  {/* SUBSTITUIR a seção sr-only existente com a da versão otimizada */}
  <div className="sr-only">
    {/* Conteúdo expandido de page-seo-optimized.tsx */}
  </div>

  <QuestoesClient ... />
</>
```

---

### 2-4. Repetir exatamente o mesmo para:
- `/app/simulado/page.tsx`
- `/app/calcular-nota/page.tsx`
- `/app/gabarito/page.tsx`

---

## ✅ Pré-Deploy Checklist

Antes de fazer o commit final:

**HTML/Rendering:**
- [ ] Sem erros TypeScript (`npm run build` sucesso)
- [ ] Todas 4 páginas renderizam
- [ ] CSS não quebrado
- [ ] Links de navegação funcionam

**SEO/Schemas:**
- [ ] Todos 4 schemas aparecem no HTML (usar DevTools → Source)
- [ ] Google Rich Results Test: PASS (sem erros)
- [ ] Breadcrumb schema válido
- [ ] FAQ schema válido (5-7 questions)

**Performance:**
- [ ] Lighthouse score ≥85 (meta: 90+)
- [ ] Nenhum novo erro de Core Web Vitals
- [ ] Build size não aumentou significativamente

**Internal Linking:**
- [ ] Todas as páginas linkam para as 3 outras
- [ ] Links no sr-only (não quebram layout)
- [ ] Anchor text descritivo

**Metadata:**
- [ ] Title < 60 caracteres
- [ ] Description 150-160 caracteres
- [ ] Keywords relevantes (8-10)
- [ ] og:title, og:description preenchidos
- [ ] Canonical tag presente

---

## 🚀 Pós-Deploy (Primeiros 7 Dias)

### Dia 1-2: Verificação Básica

```bash
# Verificar que tudo está ao vivo
curl -H "User-Agent: Googlebot" https://enem.pro/questoes | grep "Banco de Questões ENEM"

# Verificar schemas foram indexados
# Usar Google Rich Results Test novamente
```

### Dia 3-7: Monitoramento GSC

1. Acessar GSC: https://search.google.com/search-console
2. Checar "Coverage" → sem new errors?
3. Verificar "Core Web Vitals" → tudo verde?
4. Checar "Mobile Usability" → sem errors?

---

## 📊 Esperado nos Primeiros 30 Dias

| Métrica | Esperado | Crítico se... |
|---------|----------|--------------|
| Impressões | +50% | < +20% |
| CTR | +20-30% | < +5% |
| Posição média | -3 a -5 | +2 (piorou) |
| Tráfego organizado | Estável | -20% |
| Erro indexação | 0 | > 1 |

---

## 🆘 Troubleshooting Rápido

### "Build falha"
```bash
# Verificar TypeScript
npm run type-check

# Limpar cache
rm -rf .next
npm run build
```

### "Schemas não validam"
- Verificar JSON formatting (não deve ter aspas simples)
- Verificar URLs começam com https://
- Verificar estrutura bate com schema.org

### "Lighthouse score baixo"
- Rodar build primeiro: `npm run build`
- Verificar CLS (Cumulative Layout Shift)
- Testar em modo incognito

### "Links internos quebrados"
- Verificar paths (case-sensitive em Linux)
- Remover trailing slashes inconsistentes
- Testar em staging antes de produção

---

## 📞 Próximos Passos Após Deploy

### Semana 2:
- [ ] Verificar primeira reindexação no GSC
- [ ] Coletar primeira semana de dados de impressão
- [ ] Verificar Core Web Vitals

### Semana 4 (30 dias):
- [ ] Análise completa: comparar baseline vs. +30 dias
- [ ] Identificar keywords que subiram
- [ ] Refinar meta descriptions se CTR baixo
- [ ] Planejar próxima fase de otimização

### Mês 3 (90 dias):
- [ ] Report detalhado de ROI
- [ ] Definir próximas ferramentas para otimizar
- [ ] Expandir conteúdo baseado em search queries

---

## 📝 Notas Importantes

1. **Google leva 24-48h para reindexar** - não se assuste se posição não mude imediatamente
2. **Monitorar GSC religiosamente** - é a fonte de verdade do Google
3. **CTR é maior fator de ranking** - refinar meta descriptions é prioridade
4. **Lighthouse é vanity metric** - Core Web Vitals importa mais
5. **Internal linking funciona** - cada página linkando para 3 outras é poderoso

---

**Tempo total esperado: 6-8 horas spread em 2 dias**
**Risco: BAIXO (só conteúdo + schemas, nenhuma mudança estrutural)**
**Esperado: +200-300% tráfego em 6 meses**

Go live! 🚀
