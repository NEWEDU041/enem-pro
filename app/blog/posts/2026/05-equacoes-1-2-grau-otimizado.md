---
title: "Equações do 1º e 2º Grau ENEM: Fórmulas LaTeX + 10 Problemas Resolvidos"
slug: "equacoes-1-2-grau-enem"
description: "Domine equações de 1º e 2º grau com renderização LaTeX, Bhaskara passo-a-passo, 10 problemas práticos com solução completa, e técnica de reconhecer tipo rápido."
readTime: 12
category: "matematica"
keywords: "equações 1º grau, equações 2º grau, Bhaskara, discriminante"
lastUpdated: "2026-09-16"
---

# Equações do 1º e 2º Grau ENEM: Fórmulas + 10 Problemas Resolvidos

**5.200+ buscas mensais.** Equações são **fundação** de toda matemática ENEM. Aparecem diretas em 1-2 questões e **embutidas** em 5-8 questões (sistemas, inequações, funções). 

Este guia oferece fórmulas em LaTeX com renderização clara, 10 problemas com resolução linha-a-linha, e checklist de quando usar cada método.

---

## Equações do 1º Grau: Forma Geral

A forma padrão é: $$ax + b = 0$$

Onde $a \neq 0$ (senão não é equação de 1º grau)

**Solução:** $$x = -\frac{b}{a}$$

### Exemplo 1: Simples

$$3x + 9 = 0$$
$$3x = -9$$
$$x = \frac{-9}{3} = -3$$

### Exemplo 2: Com Distribuição

$$2(x + 3) = 10$$
$$2x + 6 = 10$$
$$2x = 4$$
$$x = 2$$

---

## Equações do 2º Grau: Forma Geral

A forma padrão é: $$ax^2 + bx + c = 0$$

Onde $a \neq 0$

**Solução (Fórmula de Bhaskara):**
$$x = \frac{-b \pm \sqrt{\Delta}}{2a}$$

Onde: $$\Delta = b^2 - 4ac$$

O discriminante $\Delta$ determina **quantas soluções:**
- $\Delta > 0$ → 2 soluções reais distintas
- $\Delta = 0$ → 1 solução real (raiz dupla)
- $\Delta < 0$ → Nenhuma solução real

### Exemplo 1: Simples

$$x^2 - 5x + 6 = 0$$

**Passo 1:** Identifique $a=1$, $b=-5$, $c=6$

**Passo 2:** Calcule $\Delta$
$$\Delta = (-5)^2 - 4(1)(6) = 25 - 24 = 1$$

**Passo 3:** Aplique Bhaskara
$$x = \frac{-(-5) \pm \sqrt{1}}{2(1)} = \frac{5 \pm 1}{2}$$

**Passo 4:** Soluções
$$x_1 = \frac{5 + 1}{2} = 3$$
$$x_2 = \frac{5 - 1}{2} = 2$$

---

## Tabela Rápida: Quando Usar Cada Fórmula

| Tipo | Reconheça | Método | Exemplo |
|------|-----------|--------|---------|
| 1º grau | $ax + b = 0$ | $x = -b/a$ | $2x + 4 = 0$ → $x = -2$ |
| 2º grau completa | $ax^2 + bx + c = 0$ com $b \neq 0$ | Bhaskara | $x^2 + 3x + 2 = 0$ |
| 2º grau incompleta (b=0) | $ax^2 + c = 0$ | $x^2 = -c/a$ | $x^2 - 9 = 0$ → $x = \pm 3$ |
| 2º grau incompleta (c=0) | $ax^2 + bx = 0$ | Fator comum | $x^2 + 5x = 0$ → $x(x+5)=0$ |

---

## 10 Problemas Resolvidos

### Problema 1 (Fácil - 1º Grau)
$$4x - 8 = 0$$
$$x = 2$$

### Problema 2 (Fácil - 2º Grau Incompleta)
$$x^2 - 16 = 0$$
$$x^2 = 16$$
$$x = \pm 4$$

### Problema 3 (Médio - 2º Grau Completa)
$$x^2 - 7x + 12 = 0$$
$\Delta = 49 - 48 = 1$
$x = (7 \pm 1) / 2$ → $x_1 = 4$, $x_2 = 3$

### Problema 4 (Médio - 1º Grau com Parênteses)
$$3(x - 2) = 12$$
$$3x - 6 = 12$$
$$x = 6$$

### Problema 5 (Alto - 2º Grau com Discriminante Negativo)
$$x^2 + x + 1 = 0$$
$\Delta = 1 - 4 = -3 < 0$
**Resposta:** Nenhuma solução real

### Problema 6 (Alto - 2º Grau Incompleta com Fatoração)
$$x^2 - 3x = 0$$
$$x(x - 3) = 0$$
$$x = 0 \text{ ou } x = 3$$

### Problema 7 (Muito Alto - Sistema com Equações)
$$\begin{cases} x + y = 5 \\ x^2 + y = 7 \end{cases}$$

De (1): $y = 5 - x$
Substitua em (2): $x^2 + 5 - x = 7$
$x^2 - x - 2 = 0$
Soluções: $x = 2$ ou $x = -1$
Se $x = 2$: $y = 3$
Se $x = -1$: $y = 6$

### Problema 8 (Muito Alto - Equação Fracionária)
$$\frac{x + 2}{x - 1} = 2$$
$$x + 2 = 2(x - 1)$$
$$x + 2 = 2x - 2$$
$$x = 4$$

### Problema 9 (Muito Alto - Discriminante Nulo)
$$x^2 - 4x + 4 = 0$$
$\Delta = 16 - 16 = 0$ (raiz dupla)
$x = 4/2 = 2$

### Problema 10 (Desafio - Soma e Produto)
$$x^2 - 5x + 6 = 0$$

**Método soma/produto:**
- Soma das raízes: $x_1 + x_2 = 5$
- Produto: $x_1 \times x_2 = 6$
- Resposta: $x_1 = 2$, $x_2 = 3$

---

## Checklist: Antes de Usar Bhaskara

- [ ] Equação está na forma $ax^2 + bx + c = 0$?
- [ ] Identifiquei $a$, $b$, $c$ corretamente?
- [ ] Cuidei dos sinais (especialmente $b$ negativo)?
- [ ] Calculei $\Delta = b^2 - 4ac$?
- [ ] Verifiquei se $\Delta < 0$ (sem solução real)?
- [ ] Apliquei $x = \frac{-b \pm \sqrt{\Delta}}{2a}$?
- [ ] Simplifiquei a raiz se possível?

---

## FAQ

**P: Vale usar fatoração em vez de Bhaskara?**
R: Sim! Se conseguir fatorar rapidamente, é mais rápido. Se travar >30 seg, use Bhaskara.

**P: E se o discriminante não for quadrado perfeito?**
R: Deixe na forma de raiz: $x = \frac{3 \pm \sqrt{7}}{2}$ (não precisa calcular exato)

**P: Quando uma equação 2º grau tem infinitas soluções?**
R: Nunca. Equação 2º grau tem 0, 1 ou 2 soluções.

---

## 8 Links Internos

1. [Funções do 1º e 2º Grau](./funcoes-1-2-grau-enem)
2. [Sistemas de Equações](./sistemas-equacoes-enem)
3. [Inequações (1º e 2º Grau)](./inequacoes-1-2-grau-enem)
4. [Polinômios e Fatoração](./polinomios-fatoracao-enem)
5. [Bhaskara: Derivação e Intuição](./derivacao-formula-bhaskara)
6. [Discriminante: Análise Profunda](./discriminante-delta-equacao-2-grau)
7. [Soma e Produto de Raízes](./soma-produto-raizes-vieta)
8. [Banco 100 Problemas: Equações (1º e 2º Grau)](./banco-100-equacoes-1-2-grau)

---

## Conclusão

Equações 1º e 2º grau são **essenciais**. Domine:
1. Reconhecer forma da equação
2. Identificar coeficientes $a$, $b$, $c$
3. Aplicar fórmula ou fatoração
4. Simplificar e validar solução

Pratique os 10 problemas até conseguir resolver cada um em <1 minuto.
