# 🗓️ Roadmap — Próximos 7 Dias

**Data**: 2026-08-04 (Segunda)

---

## 📅 Hoje (Segunda 04/08)

### Morning (Agora)
- [ ] Ler este arquivo
- [ ] Ler `SETUP_GSC.md`
- [ ] Ir para próxima ação

### Afternoon
- [ ] Seguir `SETUP_GSC.md` Passo 1-2 (Google Cloud + GSC)
  - Tempo: ~10 minutos
  - Resultado: JSON file salvo em lugar seguro

### Evening
- [ ] Seguir `SETUP_GSC.md` Passo 3 (Vercel env vars)
  - Tempo: ~5 minutos
  - Resultado: GOOGLE_SERVICE_ACCOUNT_KEY + CRON_SECRET em Vercel

---

## 📅 Terça (05/08)

### Morning
- [ ] Deploy em Vercel
  ```bash
  cd C:\projetos\enem-pro
  vercel --prod
  ```
  - Tempo: ~3 minutos
  - Resultado: Deploy completo, env vars ativos

- [ ] Validar setup
  ```bash
  npx ts-node scripts/setup-gsc-complete.ts
  ```
  - Tempo: ~2 minutos
  - Resultado: ✅ Tudo OK

### Afternoon
- [ ] Verificar no GSC
  - Ir para: https://search.google.com/search-console/property/questoesenem.pro/overview
  - Procure "Coverage" e veja quantas URLs estão indexadas
  - Anote o número (será baseline)

### Evening
- [ ] Aguardar primeiro relatório
  - O cron roda **próxima segunda (11/08) às 9 AM UTC**
  - Enquanto isso, não há ação necessária

---

## 📅 Quarta (06/08)

### Morning
- [ ] Testar site manualmente
  - Acesse `/questoes/matematica/2012/1`
  - Deve mostrar explicação **COMPLETA** (sem paywall)
  - Acesse `/questoes/matematica/2023/1`
  - Deve mostrar teaser grande (750 chars) + CTA Pro

### Afternoon
- [ ] Verificar links relacionados
  - Abra qualquer página de questão
  - Scroll para baixo
  - Deve ver "Conteúdo Relacionado" com 3 posts de blog
  - Click em um dos links → deve ir para blog post

### Evening
- [ ] Começar análise de blog (preparação Phase 4)
  - Abra `BLOG_CLEANUP_REPORT.md`
  - Ler seções "Problemas Encontrados" e "Recomendação"
  - Preparar-se mentalmente para semana que vem

---

## 📅 Quinta (07/08) até Segunda (11/08)

### Durante esses 4-5 dias
- ⏳ Não há ação necessária (aguardando GSC data)
- 📊 Monitorar Google Search Console
  - Ir para Coverage: https://search.google.com/search-console/property/questoesenem.pro/coverage
  - Notar qualquer mudança em "Indexed" count
  - Deve ver aumento em 48-72h (quinta/sexta)

### Observações
- Google vai rastrear as novas mudanças
- Questões de 2009-2015 agora com explicação completa
- Links internos agora visíveis no crawl
- Sitemap dinâmico funcionando corretamente

---

## 📅 Segunda (11/08) — Cron Day!

### Morning (9 AM UTC = 6 AM BRT)
- 🤖 Cron automático roda
- 📊 Primeiro relatório GSC gerado
- 📁 Arquivo salvo em: `C:\projetos\enem-pro\.gsc-reports\gsc-report-2026-08-11-w32.json`

### Afternoon (Você)
- [ ] Verificar `.gsc-reports/` folder
  - Deve ter 2 arquivos: `.json` + `.md`
  - Abrir `.md` (human-readable)
  - Analisar dados reais

- [ ] Comparar com baseline (de terça)
  - Coverage indexado aumentou?
  - Clicks aumentaram?
  - CTR melhorou?

- [ ] Começar Phase 4 planning
  - Ler report para identificar posts com baixo performance
  - Marcar "to poda" vs "to rewrite" na lista mental

---

## 🎯 Success Criteria

### ✅ Terça (05/08) — Setup Complete
- [ ] GOOGLE_SERVICE_ACCOUNT_KEY em Vercel
- [ ] CRON_SECRET em Vercel
- [ ] Deploy realizado
- [ ] Validation script passou
- [ ] Site testado manualmente

### ✅ Segunda (11/08) — First Report
- [ ] Relatório GSC gerado
- [ ] Dados aparecem em `.gsc-reports/`
- [ ] Impressões aumentaram (vs baseline)
- [ ] Clicks aumentaram (vs baseline)

### ✅ Semana 2 (18/08)
- [ ] Começar Phase 4 (reescrever posts)
- [ ] Segundo relatório GSC disponível
- [ ] Trends aparecendo nos dados

---

## ⚡ Se algo der errado

### "Erro ao fazer deploy"
→ Rodar: `vercel deploy --prod` (tenta novamente)
→ Se insistir, verificar: Vercel dashboard → Deployments → último → logs

### "Setup validation script falhou"
→ Verificar: GOOGLE_SERVICE_ACCOUNT_KEY é JSON válido?
→ Copiar direto do arquivo Google Cloud, não de screenshot

### "Cron não rodou segunda"
→ Checar: https://vercel.com/tevez041041-9726s-projects/enem-pro/settings/crons
→ Pode levar até 30 min após deploy para primeiro run

### "Relatório existe mas sem dados reais"
→ Verificar: Service account foi adicionado ao GSC com "Editor" role?
→ Aguardar 15 min (GSC leva tempo para sincronizar)
→ Se persistir: Revalidar acesso ao GSC dashboard

---

## 📊 Success Metrics

**Depois de segunda (11/08), procure:**

| Métrica | Baseline (05/08) | Target (11/08) | Superar |
|---------|-----------------|----------------|---------|
| Indexed URLs | ? | ≥ baseline | +10% |
| Total Impressions | ? | ≥ baseline | +30% |
| Total Clicks | ? | ≥ baseline | +20% |
| Avg CTR | ? | ≥ baseline | +10% |

---

## 🎯 Main Goal

**De hoje até segunda:**
1. Ativar monitoramento real (10 min)
2. Confirmar tudo funcionando (5 min)
3. Aguardar primeiro relatório (0 min de ação)
4. Celebrar quando dados aparecerem ✨

**Isso é 15 minutos de trabalho que gera análise semanal automática para as próximas 52 semanas.**

---

## 📝 Next Week (After Sunday 11/08)

Veja: `BLOG_CLEANUP_REPORT.md`

Você vai:
1. Analisar relatório GSC (quais posts rankeiam bem?)
2. Podar 250 posts fracos
3. Reescrever 30-50 posts com dados 2026 reais

---

**🚀 Comece agora: Leia SETUP_GSC.md e siga os 6 passos!**

**Tempo total: ~15 minutos**
**Resultado: Monitoramento automático semanal lifetime**
