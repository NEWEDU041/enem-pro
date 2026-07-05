# ENEM Pro — Blog Audit Report

**Data:** 05/07/2026
**Total de posts ao vivo:** 312 (311 em `lib/blog-data.ts` + 1 arquivo `.md` órfão que na prática está inacessível — ver achado #1)
**Metodologia:** passada estrutural determinística (sem LLM) sobre os 312 posts — contagem de palavras, parágrafos, headings, links internos/externos, imagens, Flesch aproximado, idade por `date`. Não é o rubric completo de 100 pontos por post (custaria caro em tokens rodar 312× com subagentes); os números abaixo são sinal de triagem, não nota final. Dados brutos completos em `blog-audit-raw.json`.

## Achado #1 — 9 arquivos `.md` em `app/blog/posts/` são conteúdo morto; 1 está 100% inacessível

`app/blog/[slug]/page.tsx` só importa `getPost()` de `lib/blog-data.ts` — **nunca lê `app/blog/posts/*.md`**. Dos 10 arquivos ali:

- **9 têm um slug duplicado em `blog-data.ts`** (stub adicionado em 29/06, ver HANDOFF). O `.md` correspondente nunca é servido — é peso morto no disco. Em alguns casos o `.md` até tem mais palavras que o stub ao vivo (ex.: `questoes-biologia-que-mais-caem-enem`: 475 no `.md` vs 267 ao vivo; `dicas-melhorar-redacao-enem-score`: 254 vs 206), mas isso não importa porque nada lê o arquivo.
- **1 (`como-passar-medicina-federal-enem.md`, 1004 palavras — o mais rico de todos)** não tem stub nenhum em `blog-data.ts` sob esse slug exato. Não está em `getAllPosts()`, não está no sitemap, não é roteável — é o post mais bem escrito do lote e está completamente inacessível. Existe sim um post *diferente* e mais fraco cobrindo o mesmo tema: `como-passar-em-medicina-federal-no-enem` (282 palavras, stub em `blog-data.ts`).

**Ação recomendada:** usar o conteúdo de `como-passar-medicina-federal-enem.md` para enriquecer o stub `como-passar-em-medicina-federal-no-enem` em `blog-data.ts` (mesmo tema, título quase idêntico — ver cannibalization abaixo), depois apagar os 9 arquivos `.md` órfãos.

## Achado #2 — 10 posts "long-tail" de 29/06 estão extremamente curtos

Os posts adicionados na sessão de 29/06 (HANDOFF: "10 posts long-tail criados") têm 17–390 palavras — muito abaixo do padrão do resto do blog (média geral: 2.627 palavras). São exatamente os 8 piores da triagem (score 33–43/100): `questoes-historia-que-mais-caem`, `preparacao-segunda-aplicacao-enem-2026`, `como-passar-em-medicina-federal-no-enem`, `questoes-biologia-que-mais-caem-enem`, e outros do mesmo lote. Nenhum tem imagem, nenhum recebe link de outro post (`inbound: 0`).

## Achado #3 — zero linkagem interna entre posts do blog (estrutural, afeta quase tudo)

- **268/312 posts (86%) são "órfãos"** — nenhum outro post do blog aponta pra eles.
- **260/312 (83%) são "beco sem saída"** — não linkam para nenhum outro post (linkam só para `/simulado`, `/questoes`, `/cronograma` — features do produto, não outros artigos).
- Isso não é um problema de alguns posts, é a arquitetura toda: não existe hub-and-spoke entre os ~300 posts de `blog-data.ts`. Cada gabarito-por-ano/disciplina (ex. 15 anos × 4 disciplinas = ~60 posts) linka pra si mesmo e pras features, nunca pro gabarito do ano anterior ou de outra disciplina do mesmo ano.

**Ação recomendada:** `getRelatedPosts()` já existe em `lib/blog-data.ts` (usado na página do post pra mostrar relacionados na UI) — mas isso é diferente de ter o link *dentro do texto*, que é o que pesa pra SEO/PageRank interno. Vale considerar injetar 2-3 links contextuais automáticos dentro do `content` na hora de servir (ou num script de pós-processamento), usando `getCategory()` que já existe.

## Achado #4 — ~60 posts de gabarito (todos os anos/disciplinas de matemática, por ex.) empacados no mesmo score por falta de imagem

Todo post `gabarito-enem-{ano}-matematica` (2009–2024) tem exatamente o mesmo padrão: 308 palavras, `imgs: 0`, `inbound: 0`, 3 links de saída. É um problema de template, não de conteúdo individual — resolver a causa raiz (adicionar imagem + link cruzado no gerador desses posts) conserta dezenas de posts de uma vez.

## Freshness — cuidado com falso positivo

102/312 posts (33%) têm `date` > 180 dias. **Mas atenção:** `date` aqui é a única data que existe no modelo (não há campo separado de `lastUpdated`), e pra posts de gabarito histórico (`gabarito-enem-2009-matematica`, data natural = ano do exame) uma "idade" de 6.076 dias é esperada e correta, não indica conteúdo desatualizado. O sinal de freshness só é acionável pra conteúdo genuinamente sensível ao tempo (prazos, "melhores apps de 2025", cronogramas do próximo ENEM) — recomendo não tratar os `gabarito-*` como itens de ação de freshness.

## Cannibalization

Detecção por overlap de palavras-chave do título (Jaccard ≥ 0,75, dentro da mesma categoria). Com ~300 posts sobre o mesmo nicho isso gera muito ruído (564 pares brutos) — reportando só o par de alta confiança:

| Post A | Post B | Score | Recomendação |
|---|---|---|---|
| `como-passar-em-medicina-federal-no-enem` | `como-passar-medicina-federal-enem` (só existe como `.md` morto, achado #1) | 1.0 | Fundir: usar o conteúdo do `.md` (1004 palavras) pra enriquecer o stub, apagar o `.md` |

Os `gabarito-enem-{X}-{disciplina}` batem uns nos outros no score bruto só por compartilharem "gabarito enem [disciplina]" — isso é esperado e correto (cada ano é uma página própria, não cannibalization real).

## Resumo estrutural

| Métrica | Valor |
|---|---|
| Total de posts (únicos, ao vivo) | 312 |
| Palavras (média) | 2.627 |
| Sem imagem nenhuma | 75 (24%) |
| Sem TL;DR/Key Takeaways | 0 |
| Órfãos (zero link de entrada) | 268 (86%) |
| Beco sem saída (zero link pra outro post) | 260 (83%) |
| `date` > 180 dias (ver caveat de freshness acima) | 102 (33%) |
| Score de triagem < 50 | 68 |
| Score de triagem 50-69 | 7 |
| Score de triagem 70-89 | 201 |
| Score de triagem 90+ | 36 |

## Fila de ação priorizada

1. Fundir `como-passar-medicina-federal-enem.md` → stub `como-passar-em-medicina-federal-no-enem`, apagar os 9 `.md` órfãos (achado #1)
2. Reescrever/expandir os 10 posts long-tail de 29/06 pra pelo menos 1.200-1.500 palavras (achado #2)
3. Decidir uma estratégia de link cruzado automático entre posts da mesma categoria (achado #3) — maior alavancagem por esforço, afeta 260+ posts de uma vez
4. Adicionar imagem de template aos ~75 posts sem imagem, priorizando os `gabarito-*` (achado #4)
5. Não gastar esforço "atualizando" `gabarito-enem-{ano}` antigos por causa do freshness score — é ruído, não use como fila de prioridade
