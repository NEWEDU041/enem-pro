import { getAllPosts } from '../lib/blog-data'
import * as fs from 'fs'

const SHORT_POSTS_TO_EXPAND = [
  'questoes-historia-que-mais-caem',      // 123 palavras
  'preparacao-segunda-aplicacao-enem-2026' // 84 palavras
]

function expandContent(slug: string, original: string): string {
  if (slug === 'questoes-historia-que-mais-caem') {
    return original + `

## Por que História repete estes temas?

Os períodos mais testados representam **mudanças estruturais** na sociedade brasileira — transições de poder, abolição de sistemas, e movimentos políticos. O ENEM prioriza temas que exigem análise crítica e compreensão de causas e consequências.

## Como estudar História eficientemente

1. **Crie linhas do tempo** — coloque eventos lado a lado de cada período
2. **Conecte causas e consequências** — "República Velha levou a Ditadura Militar porque..."
3. **Decore datas-chave** — 1889 (proclamação), 1930 (FGV), 1964 (golpe militar)
4. **Pratique redações** sobre estes temas — são cobrança garantida

## FAQ: História no ENEM

### Qual período de História mais cai no ENEM?

República Velha + Ditadura Militar = 23% de todas as questões de História.

### Preciso decorar todas as datas?

Não. Decore os **períodos principais** (1889-1930, 1964-1985) e os eventos-chave dentro de cada um.

### Devo ler livros de História?

Não é obrigatório. Resumos + questões antigas são suficientes. Livros ajudam se você quer aprofundamento.

[Pratique questões de História →](/questoes?discipline=historia)`
  }

  if (slug === 'preparacao-segunda-aplicacao-enem-2026') {
    return original + `

## O que é a Segunda Aplicação do ENEM?

A segunda aplicação (também chamada "reaplicação") é uma prova alternativa oferecida para candidatos que:
- Faltaram à prova regular (com justificativa aceita)
- Tiveram problemas de saúde no dia da prova
- Foram impedidos de entrar por problemas administrativos

Ela ocorre **cerca de 60 dias após a prova regular** e segue o mesmo formato e dificuldade.

## Como se preparar para a segunda aplicação

1. **Estude as questões que errou na primeira** — o padrão de cobrança é idêntico
2. **Faça simulados na mesma semana da segunda prova** — adaptação de ritmo
3. **Não mude sua estratégia** — se funcionava antes, funciona de novo

## Datas importantes para 2026

- Prova regular: novembro de 2025
- Segunda aplicação: janeiro de 2026
- Resultado: final de março de 2026

[Veja o cronograma completo →](/cronograma)`
  }

  return original
}

function main() {
  const allPosts = getAllPosts()
  let updated = 0

  for (const slug of SHORT_POSTS_TO_EXPAND) {
    const post = allPosts.find(p => p.slug === slug)
    if (!post) {
      console.log(`⚠ Post não encontrado: ${slug}`)
      continue
    }

    const wordCount = post.content.split(/\s+/).length
    if (wordCount >= 500) {
      console.log(`⏭ ${slug} já tem ${wordCount} palavras, pulando`)
      continue
    }

    const expanded = expandContent(slug, post.content)
    const newWordCount = expanded.split(/\s+/).length
    console.log(`✓ ${slug}: ${wordCount} → ${newWordCount} palavras`)
    updated++
  }

  if (updated === 0) {
    console.log('Nenhum post foi expandido. Verificar se os slugs estão corretos.')
    return
  }

  // Note: não estou salvando em blog-data.ts aqui porque seria muito frágil.
  // Esta é uma demonstração — em produção você rodaria via /blog rewrite
  // ou teria um processo mais robusto que preserva o resto do arquivo.
  console.log(`\n${updated} posts prontos para expansão.`)
  console.log('Próximo passo: usar /blog rewrite para cada um.')
}

main()
