# 🔧 Expandir Questão Muito Curta — Manual

**Questão:** 2021-178  
**Caracteres atuais:** 97  
**Target:** 250+

---

## Explicação Atual (97 chars)
```
"Adição 9 + 12 = 21 em decimal. Convertendo 21 para binário: 21 = 16+4+1 = 10101₂ — alternativa D."
```

---

## Versão Expandida (Proposta)

Vou expandir mantendo a precisão técnica:

```
A questão envolve conversão de um número do sistema decimal para o sistema binário.

Passo 1 - Soma em decimal: 9 + 12 = 21

Passo 2 - Conversão para binário: Para converter 21 para binário, decompomos em potências de 2:
- 21 = 16 + 5
- 21 = 16 + 4 + 1
- 21 = 2⁴ + 2² + 2⁰

Passo 3 - Representação binária:
- Posição 4 (16): 1
- Posição 3 (8): 0
- Posição 2 (4): 1
- Posição 1 (2): 0
- Posição 0 (1): 1

Resultado: 10101₂

Portanto, 9 + 12 em decimal é igual a 10101 em binário, correspondendo à alternativa D.
```

**Caracteres:** 456 (✅ 250+)

---

## SQL para Atualizar

```sql
UPDATE question_explanations
SET explanation = 'A questão envolve conversão de um número do sistema decimal para o sistema binário.

Passo 1 - Soma em decimal: 9 + 12 = 21

Passo 2 - Conversão para binário: Para converter 21 para binário, decompomos em potências de 2:
- 21 = 16 + 5
- 21 = 16 + 4 + 1
- 21 = 2⁴ + 2² + 2⁰

Passo 3 - Representação binária:
- Posição 4 (16): 1
- Posição 3 (8): 0
- Posição 2 (4): 1
- Posição 1 (2): 0
- Posição 0 (1): 1

Resultado: 10101₂

Portanto, 9 + 12 em decimal é igual a 10101 em binário, correspondendo à alternativa D.'
WHERE question_id = '2021-178';
```

---

## ✅ Resultado Esperado

- Antes: 97 chars ❌
- Depois: 456 chars ✅
- Qualidade: Excelente 📚
- Custo: $0 (manual, sem API call)
