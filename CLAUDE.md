@AGENTS.md

# ENEM Pro — Project Instructions

## Stack
Next.js 15 (App Router) + TypeScript + Tailwind + Supabase

## Blog Integration — claude-blog plugin

### Como adicionar posts
Posts NÃO usam arquivos MDX. Ficam no array `BLOG_POSTS` em `lib/blog-data.ts`.

Quando `/blog write` gerar um post, adicionar ao array neste formato:
```typescript
{
  slug: 'slug-do-post',        // kebab-case, reflete keyword principal
  title: 'Título SEO',         // máximo 65 caracteres
  description: 'Meta desc...',  // 150–160 caracteres
  date: 'YYYY-MM-DD',
  readTime: N,                  // estimativa em minutos
  content: `
[conteúdo em markdown aqui]
  `,
}
```

### Categorias automáticas (getCategory em blog-data.ts)
A função `getCategory(slug)` classifica automaticamente por slug:
- `gabarito-*` → Gabarito
- `redacao-*` → Redação
- `nota-de-corte-*`, `sisu-*`, `medicina-*`, `direito-*` → Universidades
- `cronograma-*`, `quanto-tempo-*`, `enem-2026-*` → Planejamento
- `tri-enem-*`, `calcular-nota-*`, `como-funciona-*` → Como Funciona
- `fisica-*`, `matematica-*`, `quimica-*`, `biologia-*`, `ciencias-*` → Por Matéria
- `simulado-*`, `questoes-*` → Questões
- `melhor-app-*`, `alternativa-*` → Comparativos
- Outros → Estratégias

### Workflow recomendado para novo post
```
/blog write <topico-enem>
```
O skill usa BRAND.md + VOICE.md auto-loaded. Após gerar:
1. Copiar o objeto TypeScript gerado para `lib/blog-data.ts` dentro de `BLOG_POSTS`
2. Escolher o slug que ative a categoria correta
3. `rtk git add lib/blog-data.ts && rtk git commit -m "blog: add post <slug>"`
4. `rtk git push`

### Scripts de lote (geração em massa)
Para gerar múltiplos posts de uma categoria:
```
/blog calendar monthly   # gera calendário editorial
/blog cluster plan <tema> # hub-and-spoke para cluster de keywords
```

### readTime estimativa
- 1.000 palavras ≈ 5 min
- 1.500 palavras ≈ 7 min
- 2.000 palavras ≈ 9 min
- 2.500 palavras ≈ 12 min

## Comandos RTK (usar sempre)
```bash
rtk git add .
rtk git commit -m "msg"
rtk git push
rtk next build
```
