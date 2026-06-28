# 🚀 Oportunidades de Otimização — ENEM Pro

## Análise de Endpoints

### Críticas (Alta Prioridade)

#### 1. `/api/responder` — 2 queries sequenciais → 1
**Impacto:** -50% latência, -50% db calls

```ts
// ANTES
GET subscription (sub?.plan)
GET daily_usage (currentCount)
INSERT user_answers

// DEPOIS: SQL function
SELECT check_and_record_answer($user_id, $question_id, ...) 
→ returns { is_correct, is_pro, hit_limit }
→ Tudo em 1 query
```

**Benefício:** ~200ms economizados por requisição × 1000+ diárias

---

#### 2. `/api/admin/stats` — 9 queries paralelas → SQL view
**Impacto:** -60% compute time

```sql
-- Create materialized view
CREATE MATERIALIZED VIEW stats_daily AS
SELECT 
  CURRENT_DATE as date,
  (SELECT COUNT(*) FROM user_profiles) as total_users,
  ... 
  
-- Query
SELECT * FROM stats_daily
```

**Benefício:** 5s → <500ms

---

#### 3. User Subscription Cache
**Impacto:** -40% db hits em endpoints autenticados

```ts
// Cache em Redis/KV:
// Key: user:{userId}:sub
// Value: { plan, expires_at }
// TTL: 5 min
```

**Benefício:** 20+ endpoints beneficiados

---

### Secundárias (Média Prioridade)

#### 4. Rate Limiting com Redis
**Problema:** `checkRateLimit()` faz query ao DB

```ts
// Use: Vercel KV ou Redis
await kv.incr(`ratelimit:${userId}`);
```

**Ganho:** -1 db call por request rate-limited

---

#### 5. Question Cache com CDN
**Problema:** `/api/questao/[id]/explicacao` sem ETag

```ts
// Add headers
Cache-Control: public, max-age=31536000, immutable
ETag: "sha256-{hash}"
```

**Ganho:** Browser cache 1 ano (zero requests)

---

#### 6. Compress API Responses
**Problema:** Sem gzip em JSON responses

```ts
// Next.js já faz, mas verificar:
response-encoding: gzip
```

**Ganho:** -60% payload size

---

### Sugestões (Baixa Prioridade)

#### 7. Batch User Answers
```ts
// POST /api/responder/batch
{ answers: [{ q_id, selected, correct }, ...] }
// Insert em bulk
→ 10 respostas = 1 query em vez de 10
```

#### 8. Pre-computed Stats
```ts
// Recalculate daily at 00:00 UTC
// Cache for 24h
```

#### 9. Webhook Optimization
```ts
// /api/webhook → queue (Bull, RabbitMQ)
// Process async
// Return 200 immediately
```

---

## Priorização Recomendada

1. **Fase 1 (Hoje):** SQL function `/api/responder` + User cache
   - Impacto: -50% latência geral
   - Tempo: 1h
   - Risco: Baixo

2. **Fase 2 (Esta semana):** Materialized view stats + Rate limiting KV
   - Impacto: -40% admin calls
   - Tempo: 2h
   - Risco: Médio

3. **Fase 3 (Backlog):** Batch endpoints + Webhook queue
   - Impacto: Marginal
   - Tempo: 3h
   - Risco: Alto

---

## Estimativa de Ganho Total

| Otimização | Latência ↓ | DB Calls ↓ | AI Tokens ↓ |
|-----------|----------|----------|-----------|
| RTK (concluído) | - | - | **70%** |
| Responder SQL | **50%** | 50% | - |
| Stats view | **40%** | 60% | - |
| User cache | **20%** | 40% | - |
| Rate limit KV | - | 10% | - |
| **TOTAL** | **60-70%** | **70-80%** | **70%** |

---

## Próximos Passos

```bash
# 1. Deploy Vercel KV
# 2. Create SQL function
# 3. Test & monitor
# 4. Rinse, repeat
```
