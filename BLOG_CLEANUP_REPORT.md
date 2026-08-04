# Blog Cleanup Report — 300 Posts Analysis

## Status
- **Total posts**: 300 em `lib/blog-data.ts`
- **Real content**: inline JavaScript template strings (não em arquivos .md)
- **Quality concern**: ~80% são gerados com IA em lote com estrutura/phrasing repetida

## Problemas Encontrados

### 1. Duplicação de Estrutura
- Todos os posts seguem o mesmo template (intro → pontos-chave → FAQ → conclusão)
- Mesmo autor bio, CTA blocks, e phrasing genérica ("Recomenda-se...", "É essencial...")
- Risco de **penalização por "helpful content"** do Google em massa

### 2. Vagas/Genéricas
Posts com datas vagas ("maio", "novembro") em vez de "2026-05-15"
- Quando essas datas passam, o post fica desatualizado e classifica como spam
- Exemplo: "Cronograma ENEM 2026" escrito em julho com "inscrição em maio" agora virou mentira

### 3. Falta de Diferenciação
300 posts sobre ENEM todos competindo entre si por mesmos keywords
- Cannibalização interna: página A sobre "cronograma ENEM 2026" vs página B sobre "datas ENEM 2026"
- Google não sabe qual é "oficial" → ranking cai para ambas

## Recomendação: Podar + Reescrever

### Fase 1: Podar (7 dias)
1. **Despublicar/noindex:**
   - Posts com 0 impressões/cliques no GSC (dados reais quando Fase 0 terminar)
   - Posts com phrasing genérica demais (contar ocorrências de "Recomenda-se", "É essencial")
   - Manter: ~30-50 posts com melhor intenção de busca

2. **Critério de Retenção:**
   - Cronograma 2026 (alta intenção)
   - Como se inscrever (alta intenção)
   - Taxa de inscrição (alta intenção)
   - Resultado/gabarito (alta intenção)
   - Recursos/preparação (média intenção)
   - "Erros comuns" type (conversão)

### Fase 2: Reescrever 30-50 Posts (14-21 dias)
Para cada post prioritário:
1. ✅ Datas específicas 2026 (verificar no gov.br)
2. ✅ Dados reais (números de inscritos, notas de corte reais, etc)
3. ✅ Exemplo específicos (não "Recomenda-se", mas "Estude 2h/dia às 6-8 AM porque...")
4. ✅ Internal links para questões relacionadas (Fase 3 já fez isso de forma inversa)
5. ✅ Schema.org FAQPage com perguntas reais (não template)

## Timeline

| Fase | Tarefa | Esforço | Prazo |
|------|--------|---------|-------|
| 0 | Aguardar dados reais do GSC | — | Semana 1 |
| 1 | Análise + poda dos 250 posts fracos | 2-4h | Semana 1 |
| 2 | Reescrever 30-50 prioritários | 2-3h/post = 60-150h | Semana 2-4 (paralelo) |

## Próximas Ações

1. **Semana 1**: Esperar Fase 0 terminar (dados reais do GSC), então rodar análise automática
2. **Semana 1-2**: Marcar posts para poda no código (adicionar `published: false` ou `noindex: true`)
3. **Semana 2-4**: Reescrever top 30-50 posts com dados reais

---

**Status**: Awaiting GSC data to make data-driven poda decisions
**Updated**: 2026-08-04
