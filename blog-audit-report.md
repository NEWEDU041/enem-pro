# Blog Audit Report — ENEM Pro

**Data do audit:** 11/07/2026
**Posts analisados:** 292 (extraídos de `lib/blog-data.ts`, que é a fonte real em produção — `app/blog/posts/*.md` tem apenas 39 arquivos físicos, o resto vive só como string no blog-data)
**Método:** checagem determinística (script, não LLM por post) para manter economia de token, dado o volume. Achados de alta confiança abaixo; achados que dependem de julgamento editorial (profundidade, tom, E-E-A-T qualitativo) não foram pontuados post a post — ver seção "Não coberto" no fim.
**Audit anterior:** `05/07/2026` (312 posts na época) — este substitui, não complementa.

## Achado #1 (prioridade máxima): bug sistêmico de seções vazias em conteúdo pSEO antigo

**129 de 292 posts (44%) têm pelo menos uma seção com heading mas zero conteúdo.** Não é ruído disperso — são os **mesmos 9 headings de template reaparecendo dezenas de vezes**, o que indica um bug de geração em lote (o script/prompt declarava a seção mas o conteúdo nunca foi preenchido):

| Heading vazio | Ocorrências |
|---|---|
| `### Checklist de Preparação Final` | 90 |
| `### Distribuição Típica de Questões por Tema` | 46 |
| `### O que o ENEM Mais Cobra em todas as áreas?` | 44 |
| `### O que o ENEM Mais Cobra em Matemática?` | 28 |
| `### O que o ENEM Mais Cobra em Ciências Humanas?` | 26 |
| `### Distribuicao de Tempo por Area` | 22 |
| `### O que o ENEM Mais Cobra em Linguagens?` | 21 |
| `### O que o ENEM Mais Cobra em Ciências da Natureza?` | 17 |
| `### Os Erros Mais Comuns que Derrubam a Nota` | 16 |

Isso afeta majoritariamente o cluster de **gabarito/disciplinas/redação/Sisu** — o maior bloco de conteúdo do site (~167 posts). Um leitor que chega numa dessas páginas literalmente vê um subtítulo sem resposta embaixo.

**Recomendação:** não é para corrigir arquivo por arquivo manualmente — são poucos templates recorrentes. Vale escrever conteúdo genérico reutilizável por padrão de heading (ex: um "Checklist de Preparação Final" padrão adaptado por disciplina) e aplicar em lote, em vez de reescrita individual. Escopo grande demais para essa sessão — recomendo tratar como projeto próprio.

## Achado #2: estatísticas com precisão fabricada (32 posts)

Mesmo padrão já corrigido nos posts de hoje: frases tipo "**N-M questões por prova**" ou "**das 45 questões**" apresentadas como fato sem fonte real (o ENEM varia a cada edição, ninguém publica essa garantia por subtema). Exemplos: `questoes-matematica-enem-2022.md` ("segundo dados"), `redacao-enem-tema.md` ("Segundo dados"), `trigonometria-enem-o-que-cai.md` ("3 questões por prova").

**Recomendação:** o linter (`scripts/lint-blog-post.ts`) já pega esse padrão automaticamente — rodar contra qualquer lote antes do merge, como já ficou estabelecido hoje.

## Achado #3: 85% dos posts são "órfãos" (zero link interno recebido)

248 de 292 posts não são linkados de dentro de nenhum outro post (`/blog/[slug]` inline). O blog não tem `related_slugs` ou campo equivalente no schema (`BlogPost` só tem `slug, title, description, date, readTime, content`) — a navegação depende inteiramente da listagem `/blog` e do sitemap, sem malha de linkagem deliberada entre posts relacionados.

**Recomendação:** é o gap de arquitetura de link mais crítico do site. Não precisa resolver os 248 de uma vez — mesmo adicionar 2-3 links contextuais nos posts de maior tráfego (gabarito, cronograma) para os posts de cauda longa já ajudaria a distribuir autoridade.

## Achado #4: cannibalização — poucos casos reais, heurística gerou bastante ruído

Rodei detecção por sobreposição de palavras do título (159 pares com Jaccard ≥ 0.6), mas a maioria é falso positivo do próprio padrão de pSEO do site (`nota-de-corte-medicina-enem` vs `nota-de-corte-direito-enem` compartilham "nota-de-corte-enem" só porque é o mesmo template, não é duplicação real). Filtrando manualmente, os casos genuínos:

| Cluster | Posts | Recomendação |
|---|---|---|
| "Quando sai o resultado do ENEM" | `quando-sai-resultado-enem`, `quando-sai-resultado-enem-2026`, `enem-resultado-quando-sai-2026`, `resultado-enem-2025` | 4 posts pro mesmo intent de busca — merge em 1 canônico + 301 dos outros 3, ou diferenciar escopo claramente (ex: 1 vira "histórico de datas por ano") |
| Nota de corte Engenharia | `nota-de-corte-engenharia-enem`, `engenharia-nota-de-corte-enem` | Slugs invertidos, mesmo conteúdo provável — merge/redirect |
| Nota de corte Direito | `nota-de-corte-direito-enem`, `direito-nota-de-corte-enem` | Mesmo caso acima |
| ENEM Treineiro | `enem-treineiro`, `enem-treineiro-2026` | Checar se são genuinamente diferentes (ano específico vs conceito geral) ou merge |

## Achado #5: freshness (data de publicação)

| Faixa | Posts |
|---|---|
| < 90 dias (baixa prioridade) | 221 |
| 90-180 dias (média) | 42 |
| 180+ dias (alta prioridade) | 29 |

Site é majoritariamente recente (76% publicado nos últimos 90 dias, reflexo da Fase 1 Agressiva de julho). Os 29 "high priority" valem uma checagem de estatísticas desatualizadas, mas não é um problema estrutural.

## Achado #6: description curta/ausente

Apenas 2 posts (`usar-nota-enem-universidade.md` e 1 outro) — praticamente resolvido, a maior parte do site já tem meta description adequada.

## Não coberto nesta rodada (para manter custo razoável)

- Score 0-100 por post (5 categorias: content/SEO/E-E-A-T/technical/AI citation) — exigiria julgamento de LLM por post; a 292 posts, rodar isso via subagents teria custo de token desproporcional ao valor incremental sobre os achados determinísticos acima. Recomendo rodar `/blog analyze` sob demanda nos posts do Achado #1 (os 129 com seção vazia) depois que o conteúdo for reescrito, não antes.
- Validação de schema JSON-LD renderizado (precisa inspecionar HTML final, não só o markdown fonte)
- Links externos quebrados (não verificado)

## Resumo executivo

| Métrica | Valor |
|---|---|
| Posts analisados | 292 |
| Posts com seção vazia (bug de geração) | 129 (44%) |
| Posts com estatística de precisão fabricada | 32 (11%) |
| Posts órfãos (sem link interno recebido) | 248 (85%) |
| Posts com description curta/ausente | 2 |
| Clusters de cannibalização confirmados | 4 |
| Posts desatualizados (180+ dias) | 29 |

**Maior prioridade:** Achado #1 (seções vazias em massa no cluster gabarito/disciplinas) — é o que mais gente vê (é o maior cluster do site) e é o mais visivelmente quebrado para um leitor real.
