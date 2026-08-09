# Guia de Resubmissão ao Google Search Console

**Data:** 2026-08-09  
**Total de URLs:** 381 (372 posts + 9 páginas)  
**Qualidade validada:** Todos os 372 posts com score ≥75  

## Resumo de Qualidade

- ✅ **125 posts** com 90+ (excellent)
- ⚠️ **247 posts** com 75-89 (good)
- ❌ **0 posts** abaixo de 75 (0% rejeição)
- 📊 **Média geral:** 84.5/100

## Opção 1: Submissão Manual (Recomendado)

### Passo 1 — Acessar Google Search Console

1. Acesse [Google Search Console](https://search.google.com/search-console)
2. Selecione sua propriedade: `questoesenem.pro`

### Passo 2 — Submeter Lotes

O sistema foi preparado com 3 lotes de ~150 URLs cada para evitar parecer spam:

**Lote 1** (151 URLs) — Submeter HOJE:
- Arquivo: `gsc-batch-1.txt`
- Instruções abaixo ↓

**Lote 2** (151 URLs) — Submeter em 24h:
- Arquivo: `gsc-batch-2.txt`

**Lote 3** (79 URLs) — Submeter em 48h:
- Arquivo: `gsc-batch-3.txt`

### Passo 3 — Como Submeter Cada Lote

1. **Via "Inspection de URL":**
   - Em GSC, clique em "Inspection de URL" (barra de busca no topo)
   - Cole a URL manualmente
   - Clique em "Solicitar indexação"
   - Repetir para cada URL do lote

2. **Via "Sitemaps" (MAIS RÁPIDO):**
   - Gere um sitemap apenas com o lote
   - Envie em GSC via menu "Sitemaps"
   - Google crawl automaticamente em 24h

### Passo 4 — Acompanhar Status

Após submissão de cada lote:
- Aguarde 2-4 semanas para "estatísticas de cobertura" serem atualizadas
- Em "Cobertura", você verá: "indexado", "pendente", ou "erro"
- Posts de qualidade (90+) devem ser indexados em 3-5 dias
- Posts de atenção (75-89) em 5-10 dias

## Opção 2: Submissão Automática via API

Se você tiver `GOOGLE_SERVICE_ACCOUNT_KEY` configurada em `.env.production.local`:

```bash
node scripts/submit-to-gsc-api.js
```

Isso fará:
- ✅ Autenticação automática com Google
- ✅ Submissão de todos os 381 URLs em lote
- ✅ Relatório de sucesso/falha por URL

## URLs Incluídas

### Páginas Principais (9)
- https://questoesenem.pro
- https://questoesenem.pro/sobre
- https://questoesenem.pro/blog
- https://questoesenem.pro/simulado
- https://questoesenem.pro/redacao
- https://questoesenem.pro/revisao
- https://questoesenem.pro/vs
- https://questoesenem.pro/temas-redacao
- https://questoesenem.pro/tiktok

### Posts de Blog (372)
- https://questoesenem.pro/blog/[slug]
- Exemplo: https://questoesenem.pro/blog/gabarito-enem-2024-matematica

## FAQ

**P: Por que dividir em 3 lotes?**
R: Submeter 400+ URLs de uma vez pode parecer atividade suspeita ao algoritmo de spam do Google. Lotes de 150 a cada 24h são "crescimento natural".

**P: Quanto tempo até aparecer nos resultados?**
R: 
- Indexação (estar no índice): 3-7 dias
- Ranking (aparecer em buscas): 2-4 semanas
- Estabilização: 1-3 meses

**P: O que significa cada status em "Cobertura"?**
- Indexado ✅ = Google indexou e pode ranquear
- Pendente ⏳ = Google ainda não analisou
- Erro ❌ = Problema técnico (URL inválida, conteúdo duplicado, etc.)

**P: Preciso fazer mais alguma coisa?**
R: Não. Seus posts estão otimizados. Google fará o resto.

## Checkpoints

- [ ] Lote 1 enviado (Dia 1)
- [ ] Lote 2 enviado (Dia 2)
- [ ] Lote 3 enviado (Dia 3)
- [ ] Verificado "Cobertura" em GSC (1 semana depois)
- [ ] Confirmado indexação de posts 90+ (2 semanas)
- [ ] Monitorado ranking em "Resultados de pesquisa" (4 semanas)
