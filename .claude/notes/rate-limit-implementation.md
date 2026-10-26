# Rate Limiting API por User Tier — Documentação Completa

## Visão Geral

Sistema de rate limiting por tier (Free/Pro) implementado em `enem-pro`. Cada usuário tem limites diários, horários e por burst baseado no seu plano de assinatura.

**Arquivos criados/modificados:**
- `lib/user-rate-limit.ts` — Lógica de rate limiting
- `.claude/migrations/002-rate-limit-counters.sql` — Schema Supabase
- `app/api/explicar/route.ts` — Rate limit adicionado
- `app/api/portal/route.ts` — Rate limit adicionado
- `app/api/checkout/route.ts` — Rate limit adicionado
- `app/api/questoes/route.ts` — Rate limit adicionado
- `app/api/simulado/salvar/route.ts` — Rate limit adicionado
- `app/api/admin/rate-limit-analytics/route.ts` — Dashboard API
- `app/admin/rate-limit-dashboard/page.tsx` — Dashboard UI

---

## 1. Tiers Configurados

### Free Tier
- **Limite diário:** 100 requisições/dia
- **Limite por hora:** 20 requisições/hora
- **Limite de burst:** 5 requisições/minuto

### Pro Tier
- **Limite diário:** 10.000 requisições/dia
- **Limite por hora:** 2.000 requisições/hora
- **Limite de burst:** 100 requisições/minuto

**Configuração em:** `lib/user-rate-limit.ts` (linha 12–28)

```typescript
export const TIER_CONFIG = {
  free: {
    name: 'Free',
    daily_limit: 100,
    hourly_limit: 20,
    burst_limit: 5, // Max requests in 1 minute
  },
  pro: {
    name: 'Pro',
    daily_limit: 10000,
    hourly_limit: 2000,
    burst_limit: 100, // Max requests in 1 minute
  },
} as const
```

---

## 2. Middleware & Validação

### Função: `checkUserRateLimit()`

Valida rate limit do usuário via Supabase. Retorna:
- ✅ `ok: true` — Requisição permitida
- ❌ `ok: false` — Limite atingido (retorna headers 429)

**Logs incluídos:**
- Tier do usuário
- Requisições restantes
- Tempo até reset

```typescript
const rl = await checkUserRateLimit(userId, supabase, '/api/explicar')
if (!rl.ok) {
  const headers: Record<string, string> = rl.headers || {}
  return NextResponse.json(
    { 
      error: 'Limite de requisições atingido',
      tier: rl.tier,
      reset_at: rl.resetAt.toISOString(),
    },
    { status: 429, headers }
  )
}
```

### Validação de Tier

O tier é determinado por:
1. Verificar subscription na tabela `subscriptions`
2. Validar `plan='pro'` e `expires_at > agora`
3. Default: `free` se inativo ou erro

Cache em 2 níveis:
- **L1:** Redis (1h TTL) — validação mais rápida
- **L2:** Supabase DB — validação de verdade

---

## 3. Endpoints Protegidos

### 1. `/api/explicar` (POST)
- **Descrição:** Explicação de questões
- **Tier mínimo:** Free
- **Rate limit:** 100 req/dia (Free), 10k (Pro)

```typescript
import { checkUserRateLimit } from '@/lib/user-rate-limit'

const rl = await checkUserRateLimit(userId, supabase, '/api/explicar')
if (!rl.ok) return NextResponse.json(..., { status: 429, headers: rl.headers })
```

### 2. `/api/portal` (POST)
- **Descrição:** Portal de billing do Stripe
- **Tier mínimo:** Pro (apenas usuários pagos acessam)
- **Rate limit:** 100 req/dia (Free), 10k (Pro)

### 3. `/api/checkout` (POST)
- **Descrição:** Criar sessão de checkout
- **Tier mínimo:** Free (qualquer usuário pode tentar comprar)
- **Rate limit:** 100 req/dia (Free), 10k (Pro)

### 4. `/api/questoes` (GET)
- **Descrição:** Listar questões (pode ser anônimo ou autenticado)
- **Tier mínimo:** Nenhum (anônimos permitidos)
- **Rate limit:** 100 req/dia (Free), 10k (Pro) se autenticado

```typescript
// Valida rate limit APENAS se usuário autenticado
const auth = await requireAuth(request)
if (auth.ok) {
  const rl = await checkUserRateLimit(auth.userId, supabase, '/api/questoes')
  if (!rl.ok) return NextResponse.json(..., { status: 429, headers: rl.headers })
}
```

### 5. `/api/simulado/salvar` (POST)
- **Descrição:** Salvar respostas de simulado
- **Tier mínimo:** Free
- **Rate limit:** 100 req/dia (Free), 10k (Pro)

---

## 4. Headers de Rate Limit (429 Response)

Quando um limite é atingido, a API retorna:

```
HTTP/1.1 429 Too Many Requests

X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2026-10-27T00:00:00.000Z
X-RateLimit-Tier: free
Retry-After: 86400

{
  "error": "Limite de requisições atingido",
  "tier": "free",
  "reset_at": "2026-10-27T00:00:00.000Z"
}
```

**Headers explicados:**
- `X-RateLimit-Limit` — Total de requisições permitidas no período
- `X-RateLimit-Remaining` — Requisições restantes
- `X-RateLimit-Reset` — Timestamp quando o limite reseta
- `X-RateLimit-Tier` — Tier do usuário (free/pro)
- `Retry-After` — Segundos até tentar novamente

---

## 5. Dashboard de Analytics

### Endpoint: `GET /api/admin/rate-limit-analytics`
- **Auth:** Admin only (verifica `user_metadata.role === 'admin'`)
- **Dados retornados:**
  - Distribuição de tiers (Free vs Pro)
  - Top 20 usuários por requisições (hoje)
  - Tendência de uso (últimos 7 dias)
  - Violações de rate limit (90%+ do limite)

### Resposta JSON

```json
{
  "timestamp": "2026-10-26T20:30:45.000Z",
  "summary": {
    "totalTiers": 1250,
    "freetierUsers": 1000,
    "proTierUsers": 250,
    "proPercentage": "20.0"
  },
  "topUsers": [
    {
      "user_id": "user_12345",
      "daily_requests": 98,
      "percentage_used": "98.0"
    }
  ],
  "dailyTrends": [
    {
      "date": "2026-10-19",
      "totalRequests": 15420,
      "userCount": 432
    }
  ],
  "rateLimitViolations": {
    "count": 5,
    "recent": [
      {
        "user_id": "user_54321",
        "date": "2026-10-26",
        "requests": 100,
        "percent_of_limit": "100.0"
      }
    ]
  },
  "tierConfig": {
    "free": { "daily_limit": 100, "hourly_limit": 20, "burst_limit": 5 },
    "pro": { "daily_limit": 10000, "hourly_limit": 2000, "burst_limit": 100 }
  }
}
```

### Dashboard UI

**URL:** `/admin/rate-limit-dashboard`

**Componentes:**
1. **Summary Cards** — Total usuários, Free/Pro count, violações
2. **Pie Chart** — Distribuição Free vs Pro
3. **Top Users List** — 20 maiores consumidores (com barra de progresso)
4. **Line Chart** — Tendência de 7 dias (requisições totais + usuários ativos)
5. **Violations Table** — Últimas 10 violações com detalhes
6. **Tier Config Info** — Referência de limites atuais

**Atualização:** A cada 5 minutos (auto-refresh)

---

## 6. Database Schema

### Tabela: `user_rate_limit_counters`

```sql
CREATE TABLE user_rate_limit_counters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  daily_count INTEGER DEFAULT 0,
  hourly_count INTEGER DEFAULT 0,
  burst_count INTEGER DEFAULT 0,
  last_request_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

**Índices:**
- `idx_rate_limit_user_date` — Para queries por user_id + date
- `idx_rate_limit_date` — Para analytics por data
- `idx_rate_limit_created` — Para cleanup automático

### RPC Function: `increment_rate_limit_counters()`

Incrementa contadores de forma atômica (previne race conditions):

```sql
CREATE OR REPLACE FUNCTION increment_rate_limit_counters(
  p_user_id TEXT,
  p_date DATE,
  p_hour TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO user_rate_limit_counters (...)
  VALUES (p_user_id, p_date, 1, 1, 1, NOW())
  ON CONFLICT (user_id, date) DO UPDATE SET
    daily_count = daily_count + 1,
    hourly_count = hourly_count + 1,
    burst_count = burst_count + 1,
    ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 7. Instalação & Setup

### 1. Executar migration SQL

```bash
# Via Supabase dashboard SQL editor
# Copie o conteúdo de: .claude/migrations/002-rate-limit-counters.sql
# Cole em: Supabase > SQL Editor > "New Query"
# Execute
```

### 2. Verificar que tabela foi criada

```sql
SELECT * FROM user_rate_limit_counters LIMIT 1;
-- Deve retornar: (0 rows)  ← Normal no início
```

### 3. Testar middleware no endpoint

```bash
# 1. Autentique-se para pegar token
curl -X POST https://questoesenem.pro/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "..."}' \
  > /tmp/auth.json

# 2. Teste rate limit
for i in {1..110}; do
  curl -X POST https://questoesenem.pro/api/explicar \
    -H "Authorization: Bearer $(jq -r '.session.access_token' /tmp/auth.json)" \
    -H "Content-Type: application/json" \
    -d '{"question_id": "2023-1"}'
done

# Após 100 requisições: HTTP 429 com headers X-RateLimit-*
```

### 4. Acessar dashboard

```
https://questoesenem.pro/admin/rate-limit-dashboard
```

Requer role `admin` no JWT (`user_metadata.role === 'admin'`)

---

## 8. Monitoramento & Alertas

### Logs em tempo real

Todos os rate limit checks são logados via `logger`:

```typescript
logError(logger, logContext, {
  status: 429,
  endpoint: '/api/explicar',
  error: 'Rate limit exceeded',
  metadata: { 
    tier: rl.tier,
    remaining: rl.remaining,
    retryAfterSeconds: rl.retryAfterSeconds,
  },
})
```

**Verificar logs:**
- Sentry → `Issues` → Filtrar por tag `status:429`
- Loki (se configurado) → `{endpoint="/api/explicar"} | json | status=429`

### Alertas Recomendados

1. **Muitas violações (>50/dia):** Possível bot/attack
2. **Usuário Free atingindo limite consistentemente:** Conversão em risco
3. **Pro tier com 90%+ uso:** Pode precisar de upgrade de limite

---

## 9. Troubleshooting

### Problema: Rate limit não está funcionando

**Causa:** Migration SQL não executada

**Solução:**
```bash
# Verificar se tabela existe
psql $DATABASE_URL -c "SELECT * FROM user_rate_limit_counters LIMIT 1;"

# Se erro "relation does not exist", executar migration:
psql $DATABASE_URL < .claude/migrations/002-rate-limit-counters.sql
```

### Problema: 429 retorna erro "Could not increment counters"

**Causa:** RPC function não compilada corretamente

**Solução:**
```sql
-- Recriar função via Supabase dashboard
SELECT pg_get_functiondef(
  'increment_rate_limit_counters(text, date, text)'::regprocedure
);
-- Se retorno vazio: função não existe; recriar via migration
```

### Problema: Cache Redis não atualiza tier

**Causa:** Redis cache expirou (TTL 1h)

**Solução:** Manual — invalidar cache:
```typescript
// No próximo request, vai buscar Supabase novamente
await getCached('user_tier', userId) // Retorna null
// Então busca Supabase e re-cacheia
```

---

## 10. Contadores Explicados

Cada request atualiza **3 contadores** na tabela:

| Contador | Janela | Resetea quando |
|----------|--------|-----------------|
| `daily_count` | 24h | 00:00 UTC |
| `hourly_count` | 1h | Top of each hour |
| `burst_count` | 1min | +60s desde último request |

**Exemplo:** Usuário Free em 2026-10-26, 14:35 UTC

```
daily_count:  45  (45 requisições desde 2026-10-26 00:00)
hourly_count: 12  (12 requisições desde 2026-10-26 14:00)
burst_count:   3  (3 requisições nos últimos 60s)
```

**Se próximo request:**
- Exceeds `daily_count >= 100` → Retorna 429 (reset amanhã)
- Exceeds `hourly_count >= 20` → Retorna 429 (reset no próximo hour)
- Exceeds `burst_count >= 5` → Retorna 429 (retry em 60s)

---

## 11. Próximos Passos

- [ ] Testar em staging (`npm run build && npm start`)
- [ ] Deploy para produção via Vercel
- [ ] Validar headers 429 com `curl -v`
- [ ] Monitorar dashboard em `/admin/rate-limit-dashboard`
- [ ] Configurar alertas para violações (Sentry/PagerDuty)
- [ ] Documentar SLA de rate limit para usuários (Help Center)

---

## Referências

- Arquivo: `lib/user-rate-limit.ts` — Toda lógica
- Arquivo: `app/api/*/route.ts` — Exemplos de integração
- DB Schema: `.claude/migrations/002-rate-limit-counters.sql`
- Dashboard: `app/admin/rate-limit-dashboard/page.tsx`
