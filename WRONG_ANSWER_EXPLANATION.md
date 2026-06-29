# 🎯 Feature: Explicação de Erros Aprofundada (Pro)

**Endpoint:** `POST /api/explain`  
**Disponível para:** Usuários Pro  
**Resposta tipo:** Identificação do gap + como corrigir

---

## 🎓 Como Funciona

Quando o aluno **erra** uma questão no Pro, a IA faz 3 coisas:

### 1️⃣ Identifica o Gap (Por que errou?)
```
"Você escolheu a alternativa B, que está ERRADA porque...
[identifica exatamente qual conceito o aluno não dominou]"
```

### 2️⃣ Explica a Correta
```
"A alternativa CORRETA é E porque...
[explica o raciocínio correto e o conceito-chave]"
```

### 3️⃣ Dica para Não Repetir
```
"Para não cair na mesma pegadinha novamente:
- Procure por padrões...
- Evite confundir...
- Lembre-se que..."
```

---

## 📋 Exemplo Real

**Questão:** Matemática Financeira  
**Aluno escolheu:** Alternativa B (ERRADO)  
**Alternativa correta:** E

**Resposta da IA:**

```
❌ POR QUE VOCÊ ERROU:

Você escolheu B, que está errada porque confundiu juros simples com juros compostos. 
A alternativa B usa a fórmula de juros simples (J = C × i × t), mas a questão pede 
juros compostos, que crescem exponencialmente.

✅ A RESPOSTA CORRETA (E):

A alternativa E aplica corretamente a fórmula de juros compostos: M = C × (1 + i)^t
Isto reconhece que cada período gera juros sobre os juros anteriores, não apenas 
sobre o capital inicial. Por isso, o montante final é maior.

💡 COMO NÃO REPETIR:

Procure pela palavra "composto" ou "capitalização" no enunciado - essa é a chave.
Evite confundir as duas fórmulas: lembre que "simples" = linear e "composto" = exponencial.
Quando a taxa é aplicada "período a período", é sempre composto!
```

---

## 🔧 Técnico

### Endpoint
```bash
POST /api/explain
Content-Type: application/json
Authorization: Bearer {token}

{
  "questionTitle": "Qual é o montante de R$1000 a 5% a.a. em 2 anos com juros compostos?",
  "context": "Investimento com capitalização anual",
  "alternatives": [
    { "letter": "A", "text": "R$1100,00" },
    { "letter": "B", "text": "R$1050,00" },
    ...
    { "letter": "E", "text": "R$1102,50" }
  ],
  "correctAlternative": "E",
  "selectedAlternative": "B"  // Usuário errou
}
```

### Response
```json
{
  "isCorrect": false,
  "explanation": "[explicação dos 3 passos acima]",
  "correctAlternative": "E"
}
```

---

## 📊 Sistema de Prompts

### Quando ACERTA (PROMPTS.EXPLAIN_ANSWER)
```
Você é um professor especialista no ENEM.
Explique de forma clara, didática e objetiva por que a alternativa correta é a correta.
Use até 3 parágrafos.
Sem markdown excessivo.

max_tokens: 250
```

### Quando ERRA (PROMPTS.EXPLAIN_WRONG) — NOVO
```
Você é um professor ENEM que identifica erros de pensamento.

Quando o aluno erra, faça 3 coisas:
1. Explique por que a alternativa que escolheu está ERRADA (identifique o gap/conceito)
2. Explique por que a correta é certa
3. Dê uma dica para não repetir o mesmo erro

Use 2-3 parágrafos. Seja empático e educativo.

max_tokens: 350  // Mais espaço para explicação completa
```

---

## 🎯 Diferencial Pro

| Acerta | Erra |
|--------|------|
| ✅ Parabéns! | ❌ Por que errou |
| 📚 Consolidação | 🔍 Gap identification |
| 250 chars | **350 chars** |
| Rápido | **Educativo** |

---

## 📈 Benefícios

1. **Aprendizado mais profundo** — Aluno identifica seu erro
2. **Evita repetição** — Dica específica previne próximo erro
3. **Feedback personalizado** — Não é genérico, é pelo que VOCÊ escolheu
4. **Pro exclusivo** — Diferencial de valor

---

## 🚀 Deploy

Feature está **LIVE** em `/api/explain` no endpoint existente.

**Mudança:** Melhorado prompt + max_tokens aumentado para erros.

---

## 💻 Teste

```bash
# Teste com uma resposta ERRADA
curl -X POST https://questoesenem.pro/api/explain \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "questionTitle": "Qual é o capital final com juros de 5%?",
    "context": "Investimento",
    "alternatives": [
      {"letter": "A", "text": "1000"},
      {"letter": "B", "text": "1050"},
      {"letter": "C", "text": "1103"}
    ],
    "correctAlternative": "C",
    "selectedAlternative": "B"
  }'
```

---

## ✨ Resultado

A IA agora explica:
- ❌ Que alternativa B está errada e POR QUÊ
- ✅ Que C é correta e como chegar lá
- 💡 Como evitar cair na mesma pegadinha

🎓 **Aprendizado garantido!**
