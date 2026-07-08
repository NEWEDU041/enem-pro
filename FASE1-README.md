# Fase 1: Escala Agressiva de Keywords de Cauda Longa (4 semanas)

**Objetivo:** Publicar 50-100 posts novos (score 90+) em 4 semanas, reforçando os 237 existentes com cobertura de cauda longa. Resultado esperado: aparecer em 1º lugar no Google para muitos termos em 4-8 semanas.

---

## Timeline

### Semana 1 (08-14/07): Pesquisa + Setup
1. **Blog-researcher** encontra 100+ keywords (Em andamento)
2. Validar keywords contra 237 posts (remover duplicação)
3. Agrupar em 5 temas
4. Setup: 5 blog-writers + audit automation + GSC monitor
5. Primeiros 5-10 posts publicados

### Semana 2-4 (15-04/08): Produção Paralela
- 5 writers trabalham em paralelo (1 tema cada)
- 10-15 posts/semana publicados
- Deploy: 3-5 posts/dia (não esperar tudo pronto)
- Meta final: 80-100 posts novos

---

## Estrutura dos Scripts

### 1. Pesquisa (Em background)
```bash
# Blog-researcher já rodando (agentId: af8b21808cd2c8b7f)
# Salva output em: scripts/keywords-batch-1.json
# Quando terminar: 100+ keywords com volume + dificuldade
```

### 2. Validação + Planejamento
```bash
npx tsx scripts/fase1-producao-paralela.ts
# Input: keywords-batch-1.json
# Output: production-plan.json (5 temas, 5 writers, 80-100 posts)
```

### 3. Produção (Paralela)
```bash
# Cada writer pega um tema e produz 15-20 posts
# Blog-writer agents rodam via CLI ou scheduling
# Cada post passa por Gate4 audit antes de publicar

# Exemplo (manual):
npx tsx scripts/produce-theme.ts --theme "tecnicas-estudo" --target 15
```

### 4. Audit + Deploy
```bash
# Rodar Gate4 audit em todos os posts novos
npx python scripts/enem_audit.py --check-new

# Deploy se todos forem 90+
npx vercel --prod --yes
```

### 5. Monitoring (Semanal)
```bash
# Rodar sexta-feira 09:00
npx tsx scripts/monitor-gsc-ranking.ts
# Output: relatório em Obsidian (ENEM-Pro/gsc-reports/week-N.md)
```

---

## Arquivos Importantes

| Arquivo | Propósito | Status |
|---------|-----------|--------|
| `scripts/fase1-producao-paralela.ts` | Valida keywords + gera plano | ✅ Pronto |
| `scripts/monitor-gsc-ranking.ts` | Relatório GSC semanal | ✅ Pronto |
| `scripts/keywords-batch-1.json` | Keywords do researcher | ⏳ Em geração |
| `scripts/production-plan.json` | Plano de 5 writers | ⏳ Após keywords |
| `ENEM-Pro/estrategia_escala_cauda_longa.md` | Estratégia completa | ✅ Documentado |
| `ENEM-Pro/fase1-tracking.md` | Checklist semanal | ✅ Documentado |

---

## Gatekeeping: Nenhum Post Abaixo de 90

Todos os posts passam por:
```bash
# Antes de publicar
npx python scripts/enem_audit.py --slug <post-slug>

# Se score < 90:
# → Rejeitar publicação
# → Enviar pro blog-writer para reescrever
# → Reauditar + retry até 90+
```

**Não fazemos exceção. Qualidade > Quantidade.**

---

## Próximos Passos (Hoje 08/07)

- [x] Strategy documentada (estrategia_escala_cauda_longa.md)
- [x] Tracking criado (fase1-tracking.md)
- [x] Scripts templates criados (fase1-producao-paralela.ts, monitor-gsc-ranking.ts)
- [x] Blog-researcher rodando (keywords em background)
- [ ] **Aguardando**: keywords-batch-1.json (blog-researcher termina)
- [ ] **Próx passo**: Validar keywords + gerar production-plan.json

---

## FAQ

**P: Por que 90+ em TODOS os posts?**  
R: Porque conteúdo thin (< 90) é penalizado pelo Google. Preferimos 50 posts bons a 100 posts fracos. Qualidade = ranking.

**P: Quanto tempo leva pra Google indexar?**  
R: 2-4 semanas normalmente. Posts começam a rankear 4-8 semanas depois. Publicamos gradual pra manter momentum.

**P: Google vai penalizar por "conteúdo em massa"?**  
R: Não, se:
- Cada post é de verdade (90+ score)
- Keywords são diferentes (não 100 clones)
- Publicação gradual (não 100 de uma vez)
- Mesh linking forte (cada post linkado aos outros)

**P: E se keywords não forem boas?**  
R: Blog-researcher encontra 100+ validadas. Esperamos 60-80% de aproveitamento pra produção. Se cair abaixo disso, expandimos a pesquisa.

---

**Fase 1 iniciada:** 08/07/2026  
**Fase 1 término esperado:** 04/08/2026  
**Fase 2 (produção sustentável):** a partir de 05/08/2026
