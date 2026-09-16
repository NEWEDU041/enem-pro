---
title: "Análise Combinatória ENEM: Fórmulas + 8 Problemas Resolvidos Passo-a-Passo"
slug: "analise-combinatoria-enem"
description: "Domine análise combinatória ENEM com diferenciação clara entre arranjo, combinação e permutação, 8 problemas resolvidos com explicação passo-a-passo, e estratégia de reconhecer tipo."
readTime: 13
category: "matematica"
keywords: "análise combinatória, arranjo, combinação, permutação, ENEM matemática"
lastUpdated: "2026-09-16"
---

# Análise Combinatória ENEM: Fórmulas + 8 Problemas Resolvidos Passo-a-Passo

**6.800+ buscas mensais.** Análise combinatória aparece em 2-4 questões por prova, frequentemente misturada com probabilidade. Candidatos erram não por falta de fórmula, mas por confundir **quando usar** arranjo vs. combinação.

Este guia separa com clareza cada tipo, oferece 8 problemas resolvidos linha-a-linha, e um quadro comparativo visual.

---

## Diferença Crítica: Arranjo vs. Combinação vs. Permutação

### Combinação (C)

**Usa quando:** A **ordem NÃO importa**

Fórmula: $C(n,k) = \frac{n!}{k!(n-k)!}$

Exemplo: Escolher 3 amigos de um grupo de 10 para uma festa.
- Escolher João, Maria, Pedro = mesmo que Maria, Pedro, João
- Ordem irrelevante → **Combinação**

$C(10,3) = \frac{10!}{3! \times 7!} = \frac{10 \times 9 \times 8}{3 \times 2 \times 1} = 120$

### Arranjo (A)

**Usa quando:** A **ordem IMPORTA**

Fórmula: $A(n,k) = \frac{n!}{(n-k)!}$

Exemplo: Definir 1º, 2º e 3º lugar em uma corrida com 10 atletas.
- 1º lugar João, 2º Maria, 3º Pedro ≠ 1º Maria, 2º João, 3º Pedro
- Ordem crítica → **Arranjo**

$A(10,3) = \frac{10!}{7!} = 10 \times 9 \times 8 = 720$

### Permutação (P)

**Usa quando:** Arranjar **todos os elementos**

Fórmula: $P(n) = n!$

Exemplo: De quantas formas 5 pessoas podem ficar em fila?

$P(5) = 5! = 5 \times 4 \times 3 \times 2 \times 1 = 120$

---

## Quadro Comparativo Rápido

| Situação | Fórmula | Exemplo | Resposta |
|----------|---------|---------|----------|
| Escolher 2 de 5 frutas | C(5,2) | Qual fruta importa? Não | 10 |
| Posicionar 2 de 5 livros numa prateleira | A(5,2) | Qual posição? Sim | 20 |
| Organizar 5 pessoas em fila | P(5) | Todas as posições | 120 |
| Senhas de 4 dígitos distintos | A(10,4) | Ordem importa | 5.040 |
| Comissões de 4 pessoas de 12 | C(12,4) | Ordem importa? Não | 495 |

---

## 8 Problemas Resolvidos (Com Passo-a-Passo)

### Problema 1 (Fácil - Combinação Simples)

**Questão:** Uma loja oferece 6 sabores de sorvete. De quantas formas uma pessoa pode escolher 2 sabores?

**Solução:**
1. Identifique: Escolher 2 de 6 → ordem importa? Não (baunilha+chocolate = chocolate+baunilha)
2. **Tipo:** Combinação
3. **Fórmula:** $C(6,2) = \frac{6!}{2!(6-2)!} = \frac{6 \times 5}{2 \times 1} = 15$
4. **Resposta:** 15 formas

---

### Problema 2 (Fácil - Arranjo Simples)

**Questão:** Quantas senhas de 3 dígitos distintos podem ser formadas com os algarismos 1-9?

**Solução:**
1. Identifique: Escolher e posicionar 3 de 9 → ordem importa? Sim (123 ≠ 321)
2. **Tipo:** Arranjo
3. **Fórmula:** $A(9,3) = \frac{9!}{(9-3)!} = 9 \times 8 \times 7 = 504$
4. **Resposta:** 504 senhas

---

### Problema 3 (Médio - Combinação com Restrição)

**Questão:** Uma escola tem 8 professores. Quantas comissões de 3 professores podem ser formadas se o diretor DEVE participar?

**Solução:**
1. O diretor já está escolhido. Falta escolher 2 de 7 professores restantes.
2. **Tipo:** Combinação (comissão = ordem não importa)
3. **Fórmula:** $C(7,2) = \frac{7 \times 6}{2 \times 1} = 21$
4. **Resposta:** 21 comissões

---

### Problema 4 (Médio - Permutação com Repetição)

**Questão:** Quantas palavras de 5 letras podem ser formadas com as letras A, A, B, B, C?

**Solução:**
1. Temos 5 posições, mas 2 A's iguais e 2 B's iguais.
2. **Tipo:** Permutação com repetição
3. **Fórmula:** $P = \frac{5!}{2! \times 2!} = \frac{120}{4} = 30$
4. **Resposta:** 30 palavras distintas

---

### Problema 5 (Alto - Combinação + Arranjo)

**Questão:** Uma revista precisa escolher 3 editorialistas de um grupo de 10 e depois ordená-los (1º, 2º, 3º lugar) para escrever artigos em ordem de importância. De quantas formas isso pode ser feito?

**Solução:**
1. **Abordagem 1:** Primeiro escolher 3 de 10 (combinação), depois ordená-los (permutação)
   - $C(10,3) \times P(3) = 120 \times 6 = 720$
2. **Abordagem 2:** Direto = Arranjo (escolher e posicionar 3 de 10)
   - $A(10,3) = 720$ ✓
3. **Resposta:** 720 formas

---

### Problema 6 (Alto - Princípio da Multiplicação)

**Questão:** Uma lanchonete oferece: 5 tipos de pão, 3 tipos de queijo e 4 tipos de presunto. Um cliente pode escolher 1 pão, 1 queijo e 1 presunto. De quantas formas diferentes o sanduíche pode ser montado?

**Solução:**
1. Cada escolha é **independente**
2. **Tipo:** Princípio Fundamental da Contagem
3. **Fórmula:** Total = 5 × 3 × 4 = 60
4. **Resposta:** 60 sanduíches diferentes

---

### Problema 7 (Alto - Combinação + Princípio da Multiplicação)

**Questão:** Um time de futsal tem 10 jogadores. O técnico precisa escolher 5 titulares e 2 reservas (sendo que os 5 escolhidos como titulares não podem ser reservas). De quantas formas isso é possível?

**Solução:**
1. Primeiro, escolher 5 titulares de 10: $C(10,5) = 252$
2. Depois, escolher 2 reservas dos 5 restantes: $C(5,2) = 10$
3. **Total:** $252 \times 10 = 2.520$
4. **Resposta:** 2.520 formas

---

### Problema 8 (Muito Alto - Combinação com Critério Múltiplo)

**Questão:** Em uma sala há 6 homens e 4 mulheres. De quantas formas pode-se escolher uma comissão com 5 pessoas, na qual há pelo menos 2 mulheres?

**Solução:**
1. "Pelo menos 2 mulheres" = 2 mulheres OU 3 mulheres OU 4 mulheres
2. **Caso 1:** 2 mulheres + 3 homens = $C(4,2) \times C(6,3) = 6 \times 20 = 120$
3. **Caso 2:** 3 mulheres + 2 homens = $C(4,3) \times C(6,2) = 4 \times 15 = 60$
4. **Caso 3:** 4 mulheres + 1 homem = $C(4,4) \times C(6,1) = 1 \times 6 = 6$
5. **Total:** 120 + 60 + 6 = 186
6. **Resposta:** 186 comissões

---

## Estratégia de Reconhecimento (Árvore de Decisão)

```
Questão de contagem?
├─ Ordem importa?
│  ├─ SIM
│  │  └─ Todos os elementos?
│  │     ├─ SIM → Permutação P(n) = n!
│  │     └─ NÃO → Arranjo A(n,k) = n!/(n-k)!
│  └─ NÃO → Combinação C(n,k) = n!/[k!(n-k)!]
└─ Múltiplas escolhas independentes?
   └─ SIM → Princípio Multiplicativo
```

---

## FAQ: Análise Combinatória

**P: Como não confundir arranjo e combinação?**
R: Faça uma pergunta: "Se eu trocar a ordem, muda o resultado?" Sim = Arranjo. Não = Combinação.

**P: Quando usar Princípio Multiplicativo?**
R: Quando há **múltiplas eventos independentes**: "escolha um pão E um queijo E um presunto."

**P: Posso resolver tudo com fórmula de arranjo?**
R: Tecnicamente sim, mas é ineficiente. Aprenda a reconhecer tipo para economizar tempo.

**P: E se a questão usar palavra "ordem"?**
R: Se disser "ordenar", "sequência", "fila" → arranjo/permutação. Se disser "escolher", "grupo", "comissão" → combinação.

---

## 8 Links Internos

1. [Probabilidade ENEM (frequentemente vem com combinatória)](./probabilidade-enem-questoes)
2. [Factoriais e Notação: Deep Dive](./fatoriais-calculo-rapido)
3. [Princípio Multiplicativo Simplificado](./principio-multiplicativo-enem)
4. [Permutação com Repetição](./permutacao-com-repeticao)
5. [Problemas de Combinatória Resolvidos (Banco 100Q)](./banco-100-questoes-combinatoria)
6. [Erros Comuns em Combinatória](./erros-mais-frequentes-combinatoria-enem)
7. [Cronograma de 4 Semanas: Combinatória](./estudar-combinatoria-4-semanas)
8. [Calculadora Rápida: Arranjo/Combinação](./calculadora-arranjo-combinacao-online)

---

## Conclusão

Combinatória é lógica pura, não memorização. Reconheça o tipo de problema (arranjo/combinação/permutação), aplique a fórmula correta, e os pontos são seus.

Pratique com os 8 problemas acima até resolver cada um em <1 min. Aí você estará pronto.
