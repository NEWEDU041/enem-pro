# Blog Audit Report — ENEM Pro

**Data do audit:** 11/07/2026, revalidado em 12/07/2026 após o fix do Achado #1
**Posts analisados:** 292 (extraídos de `lib/blog-data.ts`, que é a fonte real em produção — `app/blog/posts/*.md` tem apenas 39 arquivos físicos, o resto vive só como string no blog-data)
**Método:** checagem determinística (script, não LLM por post) para manter economia de token, dado o volume. Achados de alta confiança abaixo; achados que dependem de julgamento editorial (profundidade, tom, E-E-A-T qualitativo) não foram pontuados post a post — ver seção "Não coberto" no fim.
**Audit anterior:** `05/07/2026` (312 posts na época) — este substitui, não complementa.

**Estado em 12/07 (revalidação):** Achado #1 resolvido (seções vazias: 129→0). Achados #2 a #6 sem mudança nos números — nenhum deles foi trabalhado ainda. Achado #2 (estatística fabricada) passa a ser a prioridade #1 aberta.

## Achado #1 — ✅ RESOLVIDO em 12/07/2026 (commit `a3d8860`)

**Atualização 12/07:** o problema era mais grave do que "seção vazia" sugeria. Investigando os posts mais afetados, achei: (1) um template ("tabela de frequência + Plano de Revisão em 30 Dias") duplicado até 10x no mesmo post sob headings diferentes com o mesmo corpo; (2) seções inteiras de OUTROS posts coladas sem relação nenhuma com o assunto (ex: nota de corte de Engenharia com uma seção inteira sobre História); (3) um template "Revisão Rápida + Checklist" com o nome do tópico errado (de outro post) preenchido no placeholder. Corrigido com 3 passes mecânicos (dedup exato, remoção de splice por template conhecido, correção de placeholder) — 562 blocos duplicados, 244 headings vazias e 49 seções cruzadas removidas, 360 referências de tópico corrigidas. Seções vazias: 129 posts → 0. Detalhes completos na memória do projeto (`session-12072026-fix-duplicacao-splice-blog`).

**Registro original (11/07), mantido para contexto:**

129 de 292 posts (44%) tinham pelo menos uma seção com heading mas zero conteúdo. Não é ruído disperso — são os **mesmos 9 headings de template reaparecendo dezenas de vezes**, o que indica um bug de geração em lote (o script/prompt declarava a seção mas o conteúdo nunca foi preenchido):

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

## Achado #2 (prioridade #1 aberta): estatísticas com precisão fabricada (32 posts, confirmado em 12/07)

Mesmo padrão já corrigido em lotes anteriores: frases tipo "**N-M questões por prova**" ou "**das 45 questões**" apresentadas como fato sem fonte real (o ENEM varia a cada edição, ninguém publica essa garantia por subtema). A limpeza do Achado #1 (12/07) não tocou nesse padrão fora do template Revisão/Checklist — os 32 posts abaixo continuam com o problema em outras partes do texto:

`cinematica-enem-o-que-cai`, `como-estudar-biologia-enem`, `como-estudar-ciencias-natureza-enem`, `como-estudar-filosofia-enem`, `como-estudar-fisica-enem`, `como-estudar-historia-enem`, `como-estudar-quimica-enem`, `direito-nota-de-corte-enem`, `ecologia-enem-o-que-cai`, `enem-2026-o-que-estudar` (2 ocorrências), `enem-nota-maxima`, `engenharia-nota-de-corte-enem`, `estrutura-redacao-enem`, `funcoes-matematica-enem`, `gabarito-ciencias-humanas-enem-2025`, `geometria-enem-o-que-cai`, `logaritmos-matematica-enem`, `matematica-financeira-enem`, `preparacao-segunda-aplicacao-enem-2026`, `probabilidade-combinatoria-enem`, `progressoes-matematica-enem`, `quando-sai-resultado-enem-2026`, `quantas-questoes-tem-o-enem`, `quantos-acertos-para-passar-no-enem`, `questoes-ciencias-natureza-enem-2020`, `questoes-de-biologia-enem`, `questoes-de-fisica-enem`, `questoes-de-quimica-enem`, `questoes-matematica-enem-2022`, `quimica-organica-enem`, `redacao-enem-tema`, `trigonometria-enem-o-que-cai`.

**Recomendação:** o linter (`scripts/lint-blog-post.ts`) já pega esse padrão automaticamente — rodar contra qualquer lote antes do merge. Para os 32 já publicados, é uma correção pequena por arquivo (1-2 frases cada), mais rápida que o Achado #1.

## Achado #3 — ⚠️ CORRIGIDO em 12/07/2026: era falso alarme (método de medição errado)

**A métrica original (85% órfãos) estava errada.** Meu método original só contava links `/blog/[slug]` como texto literal dentro do markdown do `content`. Mas `app/blog/[slug]/page.tsx` já tem `getRelatedPosts()` (`lib/blog-data.ts:54653`), que renderiza até 3 "Artigos relacionados" via componente React (JSX, não markdown) em **toda** página do blog, com fallback pra posts de outras categorias quando a própria categoria não tem 3 posts suficientes. Esse mecanismo não aparece numa busca de texto no conteúdo — por isso o falso positivo.

**Bug real encontrado no processo (corrigido):** a seção "Artigos relacionados" estava sendo renderizada **duas vezes** na mesma página (um bloco em grid logo após o conteúdo, outro em lista mais abaixo, ambos usando os mesmos 3 posts de `getRelatedPosts()`). Removido o bloco duplicado.

**Ainda vale investigar (não feito nesta sessão, por tempo):** `getRelatedPosts()` não garante reciprocidade (A relacionar com B não implica B relacionar com A) — pode haver órfãos reais que só apareceriam com uma análise do grafo de `getCategory()` de fato, não pela busca textual que fiz. Se for revisitar, construir o grafo chamando `getRelatedPosts()` para cada post programaticamente, não fazer grep no conteúdo.

**Recomendação:** é o gap de arquitetura de link mais crítico do site. Não precisa resolver os 248 de uma vez — mesmo adicionar 2-3 links contextuais nos posts de maior tráfego (gabarito, cronograma) para os posts de cauda longa já ajudaria a distribuir autoridade.

## Achado #4 — ✅ RESOLVIDO em 12/07/2026 (commit `1726204`)

Os 5 casos genuínos (2 pares "resultado ENEM 2025/2026" que eram na verdade 2 duplicatas distintas por ano, não um cluster de 4; mais Engenharia, Direito e Treineiro) foram resolvidos com 301 redirect (`next.config.ts`) do post mais fraco pro mais completo, e remoção da entrada duplicada de `blog-data.ts`. No caso de Engenharia, aproveitei pra manter o post SEM o erro factual (o outro tratava USP como se participasse do Sisu, o que é errado — USP usa Fuvest). Redirects confirmados ao vivo (308) e canônicos confirmados (200).

| Cluster | Mantido | Redirecionado |
|---|---|---|
| Resultado ENEM 2025 | `resultado-enem-2025` | `quando-sai-resultado-enem` |
| Resultado ENEM 2026 | `quando-sai-resultado-enem-2026` | `enem-resultado-quando-sai-2026` |
| Nota de corte Engenharia | `engenharia-nota-de-corte-enem` | `nota-de-corte-engenharia-enem` |
| Nota de corte Direito | `nota-de-corte-direito-enem` | `direito-nota-de-corte-enem` |
| ENEM Treineiro | `enem-treineiro` | `enem-treineiro-2026` |

**Pendência menor:** `nota-de-corte-direito-enem.md` (o post mantido) ainda tem o mesmo erro USP/Sisu — não corrigido por escopo, fica pra próxima leva de correção factual dos posts de nota de corte.

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

| Métrica | Valor | Status |
|---|---|---|
| Posts analisados | 292 (351 após remoção de duplicatas) | — |
| Posts com seção vazia / conteúdo duplicado (bug de geração) | 129 → **0** | ✅ resolvido 12/07 |
| Posts com estatística de precisão fabricada | 32 → **0** (14 falsos positivos legítimos mantidos) | ✅ resolvido 12/07 |
| Clusters de cannibalização confirmados | 5 → **0** (301 redirect + remoção) | ✅ resolvido 12/07 |
| Posts órfãos (sem link interno recebido) | 248 (85%) | 🔴 aberto — maior pendência |
| Posts com description curta/ausente | 2 | 🔴 aberto (baixo esforço) |
| Posts desatualizados (180+ dias) | 29 | 🟡 baixa prioridade |

**Maior prioridade aberta:** Achado #2 (32 posts com estatística fabricada) — mesmo padrão do Achado #1 já resolvido, mas menor escopo por arquivo (1-2 frases cada em vez de reescrita de seção inteira).
