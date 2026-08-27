# Blog Doctor — 2026-08-27

> Gerado pelo auto-quality-check. **Corrigido após fable-loop adversarial** (verificação independente).

## Resumo (números verificados)
- Total de posts: **407**
- **auto-quality-check (gate interno = 75)**: sinaliza **150 posts** com problema (média 73/100)
- **Gate estrito de 90/100**: **390 posts abaixo** / **17 posts no gate** (7 com 100/100)
- Exemplos no gate (≥90): `carreira-profissional-pos-enem`, `checklist-dia-prova-enem`, `comparativo-apps-enem`, `saude-mental-enem`, `sisu-2025-tudo-voce-precisa-saber`

## Nota metodológica (lição do fable-loop)
O `auto-quality-check.js` só imprime os posts com score < 75. Contar via grep do output subestima (não vê os ≥75). A contagem correta exige recomputar o score de todos os 407.

## Ação
1. Enriquecer os posts abaixo do gate (expandir, FAQ, schema, internal links).
2. Re-rodar auto-quality-check até passar.
3. Só então publicar (em lotes).
