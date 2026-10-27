# Redis Caching Agressivo - Guia de Implementação

## 📋 Resumo Executivo

Implementado sistema de caching agressivo em Redis para `/api/explicar` com:

- ✅ **Cache por question_id** com TTL de 24h
- ✅ **Métricas Prometheus** em tempo real
- ✅ **Cache warming** ao startup (100 top questions)
- ✅ **API de invalidação** (`/api/admin/invalidate-cache`)
- ✅ **Testes de latência** (benchmark)
- ✅ **Monitoramento** via `/api/metrics/cache`

---

## 🏗️ Arquitetura

### Componentes Implementados

#### 1. **lib/cache.ts** (Atualizado)
- Adicionado rastreamento de métricas em tempo real
- Hit rate calculation: `getHitRate(type: CacheType): number`
- Latência média por operação
- Contadores: hits, misses, sets, errors, invalidations

**Mudança principal**: TTL para `explanation` aumentado de 12h para **24h**

```typescript
// Novo no cache.ts
export function getMetrics(type?: CacheType)
export function getHitRate(type: CacheType): number
```

#### 2. **app/api/admin/invalidate-cache/route.ts** (NOVO)
Endpoint robusto para gerenciar cache:

```bash
# Obter métricas
curl -X GET http://localhost:3000/api/admin/invalidate-cache \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Invalidar single
curl -X POST http://localhost:3000/api/admin/invalidate-cache \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"mode": "single", "type": "explanation", "id": "2023-1"}'

# Invalidar batch
curl -X POST http://localhost:3000/api/admin/invalidate-cache \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"mode": "batch", "type": "explanation", "ids": ["2023-1", "2023-2"]}'

# Invalidar TUDO
curl -X POST http://localhost:3000/api/admin/invalidate-cache \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"mode": "all"}'

# Apenas métricas
curl -X POST http://localhost:3000/api/admin/invalidate-cache \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"mode": "metrics", "type": "explanation"}'
```

**Resposta típica:**
```json
{
  "success": true,
  "mode": "single",
  "type": "explanation",
  "id": "2023-1",
  "metricsBefore": {
    "hits": 42,
    "misses": 8,
    "sets": 10,
    "errors": 0,
    "invalidations": 0,
    "totalLatency": 210.5,
    "requestCount": 50
  },
  "metricsAfter": {
    "hits": 42,
    "misses": 8,
    "sets": 10,
    "errors": 0,
    "invalidations": 1,
    "totalLatency": 210.5,
    "requestCount": 50
  },
  "hitRateBefore": 84.0,
  "hitRateAfter": 84.0
}
```

#### 3. **scripts/warm-cache.ts** (Atualizado)
Pré-popula top 100 questions ao startup:

- **100 explanations** mais acessadas (field: `accessed_at`)
- **100 questions** mais acessadas (field: `accessed_at`)
- Stripe prices (hardcoded)
- Tempo total: ~500-1000ms

**Requer:**
- Supabase com campos `accessed_at` nas tabelas
- Redis disponível na porta 6379 ou via `REDIS_URL`

#### 4. **scripts/cache-benchmark.ts** (NOVO)
Teste de latência completo:

```bash
npm run test:cache-benchmark
```

**O que testa:**
- 1ª chamada (cache miss): ~200ms
- 2ª chamada (cache hit): <5ms
- Hit rate geral: >80%

**Saída esperada:**
```
📊 Cache Performance Benchmark
============================================================

📝 Testing question: 2023-1
------------------------------------------------------------
  1st call: 145.67ms
    └─ Cached: false
    └─ Source: generated
    └─ ✓ Expected cache miss

  2nd call: 2.34ms
    └─ Cached: true
    └─ Source: redis
    └─ ✓ Excellent hit from cache (<5ms)

============================================================
📈 SUMMARY

Total Test Requests: 10
Cache Hits: 9/10
Hit Rate: 90.00%

Average Latency:
  • 1st call (miss): 145.34ms
  • 2nd call (hit): 1.98ms
  • Improvement: 98.64%

Target Metrics:
  ✓ 1st call should be ~200ms: ✅ PASS
  ✓ 2nd call should be <5ms: ✅ PASS
  ✓ Hit rate should be >80%: ✅ PASS
```

#### 5. **app/api/metrics/cache/route.ts** (NOVO)
Endpoint Prometheus-compatible:

```bash
# Coletar métricas
curl http://localhost:3000/api/metrics/cache
```

**Formato Prometheus:**
```
# HELP cache_hits_total Total cache hits
# TYPE cache_hits_total counter
cache_hits_total{cache_type="explanation"} 1250
cache_hits_total{cache_type="question"} 340
...

# HELP cache_hit_rate Cache hit rate percentage
# TYPE cache_hit_rate gauge
cache_hit_rate{cache_type="explanation"} 84.50
...

# HELP cache_avg_latency_ms Average cache operation latency in milliseconds
# TYPE cache_avg_latency_ms gauge
cache_avg_latency_ms{cache_type="explanation"} 1.84
...
```

**Integração com Prometheus:**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'enem-pro-cache'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics/cache'
    scrape_interval: 15s
```

#### 6. **scripts/invalidate-cache-batch.ts** (NOVO)
CLI helper para administrador:

```bash
# Ver métricas
npm run cache:invalidate -- metrics

# Invalidar single
npm run cache:invalidate -- single --id "2023-1"

# Invalidar batch
npm run cache:invalidate -- batch --ids "2023-1,2023-2,2023-3"

# Invalidar tudo
npm run cache:invalidate -- all
```

---

## 🚀 Como Usar

### 1. **Startup com Cache Warming**

No seu `next.config.js` ou no início do servidor:

```typescript
// Executar em paralelo ao build
npm run cache:warm
```

Ou adicione ao Docker init:
```dockerfile
RUN npm run cache:warm
```

### 2. **Monitorar Hit Rate em Produção**

```bash
# Terminal 1: Ver métricas em tempo real
watch -n 5 'curl -s http://localhost:3000/api/metrics/cache | grep cache_hit_rate'

# Terminal 2: Ver logs da aplicação
docker logs -f enem-pro-container | grep cache_
```

### 3. **Invalidar Cache Quando Necessário**

```bash
# Após atualizar uma explicação
curl -X POST http://localhost:3000/api/admin/invalidate-cache \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "single", "type": "explanation", "id": "2023-1"}'

# Após bulk update
curl -X POST http://localhost:3000/api/admin/invalidate-cache \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "all"}'
```

### 4. **Executar Benchmark de Latência**

```bash
# Antes de deploy em produção
npm run test:cache-benchmark

# Exemplo com variáveis
API_BASE_URL=http://localhost:3000 \
JWT_TOKEN=your_token \
npm run test:cache-benchmark
```

---

## 📊 Métricas Esperadas

### Hit Rate
- **Sem cache warming**: 20-40% nos primeiros 10 min
- **Com cache warming**: 85-95% após 1 min
- **Steady state**: 88-92%

### Latência
| Operação | Sem Cache | Com Cache | Melhoria |
|----------|-----------|-----------|----------|
| 1ª chamada (miss) | 150-250ms | 150-250ms | N/A |
| 2ª chamada (hit) | 150-250ms | **1-5ms** | **98%** ↓ |
| Média geral | 150-250ms | **30-50ms** | **70-80%** ↓ |

### Throughput
- **Sem cache**: ~6-10 req/s (com geração IA)
- **Com cache**: **800-1200 req/s** (Redis puro)

---

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Redis
REDIS_URL=redis://localhost:6379/0

# Admin Token (para /api/admin/invalidate-cache)
ADMIN_TOKEN=your-secret-admin-token

# Benchmark
API_BASE_URL=http://localhost:3000
JWT_TOKEN=your-jwt-token
TEST_USER_ID=test-user-123
```

### Docker Compose (Exemplo)

```yaml
version: '3'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  enem-pro:
    build: .
    ports:
      - "3000:3000"
    environment:
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - redis
    command: >
      sh -c "npm run cache:warm && npm start"

volumes:
  redis_data:
```

---

## 🧪 Testes

### Unit Tests
```bash
npm test cache.ts
```

### Integration Tests
```bash
npm run test:cache-benchmark
```

### Load Test (k6 example)
```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'

export default function () {
  // Test cache hit performance
  const res = http.post('http://localhost:3000/api/explicar', {
    question_id: '2023-1',
    selected_alternative: 'B'
  })
  
  check(res, {
    'status 200': (r) => r.status === 200,
    'has explanation': (r) => r.json('explanation'),
    'cached true': (r) => r.json('cached') === true,
  })
  
  sleep(0.1)
}
```

---

## 🚨 Troubleshooting

### Cache não está funcionando
```bash
# 1. Verificar Redis
redis-cli ping  # Deve retornar PONG

# 2. Verificar conexão
curl http://localhost:3000/api/metrics/cache | grep explanation

# 3. Verificar logs
npm run dev 2>&1 | grep cache
```

### Hit rate baixa
```bash
# 1. Verificar warm cache
npm run cache:warm

# 2. Verificar TTL
redis-cli TTL "enem:exp:2023-1"  # Deve ser > 0

# 3. Invalidar e recarregar
curl -X POST http://localhost:3000/api/admin/invalidate-cache \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "all"}'
```

### Latência alta em hits
```bash
# 1. Verificar Redis latency
redis-cli --latency

# 2. Verificar carga
redis-cli INFO stats | grep total_commands_processed

# 3. Aumentar max-memory-policy se necessário
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## 📈 Monitoramento com Prometheus/Grafana

### Setup Prometheus
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'enem-pro'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics/cache'
```

### Dashboard Grafana (JSON)
```json
{
  "dashboard": {
    "title": "enem-pro Cache",
    "panels": [
      {
        "title": "Cache Hit Rate",
        "targets": [
          {
            "expr": "cache_hit_rate{cache_type=\"explanation\"}"
          }
        ]
      },
      {
        "title": "Average Latency (ms)",
        "targets": [
          {
            "expr": "cache_avg_latency_ms{cache_type=\"explanation\"}"
          }
        ]
      },
      {
        "title": "Total Cache Hits",
        "targets": [
          {
            "expr": "rate(cache_hits_total[1m])"
          }
        ]
      }
    ]
  }
}
```

---

## 📝 Checklist de Implementação

- [x] Atualizar `lib/cache.ts` com métricas
  - [x] Adicionar `CacheMetrics` interface
  - [x] Implementar hit/miss tracking
  - [x] Implementar latência tracking
  - [x] TTL: 24h para explanations

- [x] Criar `/api/admin/invalidate-cache`
  - [x] Modo single
  - [x] Modo batch
  - [x] Modo all
  - [x] Modo metrics

- [x] Melhorar `scripts/warm-cache.ts`
  - [x] 100 explanations (top accessed)
  - [x] 100 questions (top accessed)
  - [x] Logging de progresso

- [x] Criar `/api/metrics/cache`
  - [x] Formato Prometheus
  - [x] Hit rate por tipo
  - [x] Latência média

- [x] Criar `scripts/cache-benchmark.ts`
  - [x] Teste de latência
  - [x] Hit rate validation
  - [x] Relatório detalhado

- [x] Criar `scripts/invalidate-cache-batch.ts`
  - [x] CLI helper
  - [x] Suporte a single/batch/all

- [x] Atualizar `package.json`
  - [x] npm run test:cache-benchmark
  - [x] npm run cache:warm
  - [x] npm run cache:metrics
  - [x] npm run cache:invalidate

---

## 📞 Próximos Passos

1. **Deploy**: Executar `npm run cache:warm` na inicialização
2. **Monitoramento**: Configurar Prometheus em `/api/metrics/cache`
3. **Testes**: Executar `npm run test:cache-benchmark` em staging
4. **Documentação**: Adicionar ao runbook de operações

---

Generated: 2025-10-27
Versão: 1.0.0
