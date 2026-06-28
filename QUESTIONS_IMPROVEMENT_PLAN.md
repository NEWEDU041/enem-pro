# 📚 Plano de Melhoria das Questões

**Data:** 2026-06-28  
**Status:** 717 questões analisadas  
**Ação:** Regenerar + expandir

---

## 📊 Status Atual das 717 Questões

| Qualidade | Qtd | % | Ação |
|-----------|-----|---|------|
| ⭐⭐⭐⭐⭐ Excelente (≥500) | 42 | 5.9% | Manter |
| ⭐⭐⭐⭐ Bom (200-500) | 642 | 89.5% | Manter |
| ⭐⭐⭐ Curto (100-200) | 33 | 4.6% | **Melhorar** |
| ⭐⭐ Muito Curto (<100) | 1 | 0.1% | **REGENERAR** |
| **TOTAL** | **717** | **100%** | |

---

## 🎯 Ação Recomendada

### Prioridade 1: Regenerar Muito Curtas (1 questão)
```
2021-178: 97 caracteres
"Adição 9 + 12 = 21 em decimal. Convertendo 21 para..."

↓ Regenerar com Claude → 300+ caracteres
```

**Custo:** $0.0003  
**Tempo:** < 1 minuto  
**Impacto:** +100% qualidade

---

### Prioridade 2: Expandir Curtas (33 questões)
```
Top 5 curtas:
1. 2022-176: 134 chars → Expandir para 250+
2. 2023-176: 135 chars → Expandir para 250+
3. 2022-165: 145 chars → Expandir para 250+
4. 2020-168: 165 chars → Expandir para 250+
5. 2022-180: 169 chars → Expandir para 250+
...
```

**Custo:** $0.01 (33 × 300 tokens)  
**Tempo:** ~5 minutos  
**Impacto:** +50% mais detalhadas

---

### Prioridade 3: Validar Excelentes (42 questões)
```
Amostra de excelentes:
- Bem estruturadas (≥500 chars)
- Explicações claras e didáticas
- Prontas para produção

Ação: Validar amostra aleatória
```

**Custo:** Grátis (validação manual)  
**Tempo:** ~10 minutos  
**Impacto:** Garantir qualidade

---

## 📋 Execução

### Fase 1: Regenerar Muito Curtas (AGORA)

```sql
-- Identifique qual é
SELECT question_id, explanation 
FROM question_explanations 
WHERE LENGTH(explanation) < 100;

-- Resultado esperado:
-- 2021-178 | "Adição 9 + 12 = 21 em decimal..."
```

**Manual approach:**
1. Copy explicação atual
2. Cole em Claude com: "Expanda isso para 300+ caracteres mantendo precisão"
3. Atualize no banco

**Ou:** Aguarde script automatizado (próxima semana)

---

### Fase 2: Expandir Curtas (PRÓXIMA SEMANA)

Quando tiver acesso à API, execute:
```bash
npx tsx scripts/expand-short-explanations.ts
```

---

### Fase 3: Completar Faltantes (QUANDO API VOLTAR)

```bash
npx tsx scripts/complete-all-questions.ts
```

---

## 💰 Investimento vs Ganho

| Fase | Questões | Custo | Ganho |
|------|----------|-------|-------|
| Regen muito curtas | 1 | $0.0003 | +100% qualidade |
| Expandir curtas | 33 | $0.01 | +50% qualidade |
| Completar faltantes | 2883 | $0.86 | +100% cobertura |
| **TOTAL** | **2917** | **~$0.87** | **100% pronto** |

---

## ✅ Quick Win (Hoje)

**Regenerar 1 questão muito curta em 5 minutos:**

```
1. Questão: 2021-178
2. Explicação atual: 97 chars (muito curta)
3. Ação: Chamar Claude para expandir
4. Resultado: 250+ chars
5. Custo: $0.0003
6. Resultado final: 718 questões com qualidade adequada
```

---

## 🚀 Execução Imediata

### Opção A: Manual (5 min)
1. Copie a explicação atual da questão 2021-178
2. Cole em Claude: "Expanda mantendo precisão técnica"
3. Atualize no banco

### Opção B: Automático (quando script estiver pronto)
```bash
npx tsx scripts/expand-short-explanations.ts
```

---

**Status Final Esperado:**
```
✅ 717 questões com qualidade validada
├─ 1 regenerada (de 97 para 250+ chars)
├─ 33 expandidas (de <200 para 250+)
├─ 642 mantidas como estão (já boas)
└─ 42 já excelentes

Próximo: Completar 2883 faltantes (quando API voltar)
```
