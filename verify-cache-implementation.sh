#!/usr/bin/env bash

# Cache Implementation Verification Script
# Verifica se todos os componentes foram instalados corretamente

set -e

echo "🔍 Cache Implementation Verification"
echo "===================================="
echo ""

ERRORS=0

# 1. Verificar lib/cache.ts
echo "1. Checking lib/cache.ts..."
if grep -q "export function getMetrics" /root/projetos/enem-pro/lib/cache.ts; then
  echo "   ✅ getMetrics() exported"
else
  echo "   ❌ getMetrics() not found"
  ERRORS=$((ERRORS+1))
fi

if grep -q "export function getHitRate" /root/projetos/enem-pro/lib/cache.ts; then
  echo "   ✅ getHitRate() exported"
else
  echo "   ❌ getHitRate() not found"
  ERRORS=$((ERRORS+1))
fi

if grep -q 'ttl: 86400.*// 24h' /root/projetos/enem-pro/lib/cache.ts; then
  echo "   ✅ TTL set to 24h for explanations"
else
  echo "   ❌ TTL not 24h"
  ERRORS=$((ERRORS+1))
fi

echo ""

# 2. Verificar endpoint de invalidação
echo "2. Checking /api/admin/invalidate-cache..."
if [ -f "/root/projetos/enem-pro/app/api/admin/invalidate-cache/route.ts" ]; then
  echo "   ✅ Route file exists"
  
  if grep -q "mode === 'single'" /root/projetos/enem-pro/app/api/admin/invalidate-cache/route.ts; then
    echo "   ✅ Single invalidation mode"
  else
    echo "   ❌ Single mode not found"
    ERRORS=$((ERRORS+1))
  fi
  
  if grep -q "mode === 'batch'" /root/projetos/enem-pro/app/api/admin/invalidate-cache/route.ts; then
    echo "   ✅ Batch invalidation mode"
  else
    echo "   ❌ Batch mode not found"
    ERRORS=$((ERRORS+1))
  fi
  
  if grep -q "mode === 'all'" /root/projetos/enem-pro/app/api/admin/invalidate-cache/route.ts; then
    echo "   ✅ All invalidation mode"
  else
    echo "   ❌ All mode not found"
    ERRORS=$((ERRORS+1))
  fi
else
  echo "   ❌ Route file not found"
  ERRORS=$((ERRORS+1))
fi

echo ""

# 3. Verificar warm-cache script
echo "3. Checking scripts/warm-cache.ts..."
if [ -f "/root/projetos/enem-pro/scripts/warm-cache.ts" ]; then
  echo "   ✅ Script exists"
  
  if grep -q "limit(100)" /root/projetos/enem-pro/scripts/warm-cache.ts; then
    echo "   ✅ Loads top 100 questions/explanations"
  else
    echo "   ❌ Does not load top 100"
    ERRORS=$((ERRORS+1))
  fi
  
  if grep -q "initRedis" /root/projetos/enem-pro/scripts/warm-cache.ts; then
    echo "   ✅ Initializes Redis"
  else
    echo "   ❌ No Redis init"
    ERRORS=$((ERRORS+1))
  fi
else
  echo "   ❌ Script not found"
  ERRORS=$((ERRORS+1))
fi

echo ""

# 4. Verificar metrics endpoint
echo "4. Checking /api/metrics/cache..."
if [ -f "/root/projetos/enem-pro/app/api/metrics/cache/route.ts" ]; then
  echo "   ✅ Route file exists"
  
  if grep -q "Prometheus" /root/projetos/enem-pro/app/api/metrics/cache/route.ts; then
    echo "   ✅ Prometheus format"
  else
    echo "   ❌ No Prometheus format"
    ERRORS=$((ERRORS+1))
  fi
  
  if grep -q "cache_hit_rate" /root/projetos/enem-pro/app/api/metrics/cache/route.ts; then
    echo "   ✅ Hit rate metric"
  else
    echo "   ❌ No hit rate metric"
    ERRORS=$((ERRORS+1))
  fi
else
  echo "   ❌ Route file not found"
  ERRORS=$((ERRORS+1))
fi

echo ""

# 5. Verificar benchmark script
echo "5. Checking scripts/cache-benchmark.ts..."
if [ -f "/root/projetos/enem-pro/scripts/cache-benchmark.ts" ]; then
  echo "   ✅ Script exists"
  
  if grep -q "test:cache-benchmark" /root/projetos/enem-pro/package.json; then
    echo "   ✅ npm script registered"
  else
    echo "   ❌ npm script not found"
    ERRORS=$((ERRORS+1))
  fi
else
  echo "   ❌ Script not found"
  ERRORS=$((ERRORS+1))
fi

echo ""

# 6. Verificar invalidate helper
echo "6. Checking scripts/invalidate-cache-batch.ts..."
if [ -f "/root/projetos/enem-pro/scripts/invalidate-cache-batch.ts" ]; then
  echo "   ✅ Script exists"
  
  if grep -q "cache:invalidate" /root/projetos/enem-pro/package.json; then
    echo "   ✅ npm script registered"
  else
    echo "   ❌ npm script not found"
    ERRORS=$((ERRORS+1))
  fi
else
  echo "   ❌ Script not found"
  ERRORS=$((ERRORS+1))
fi

echo ""

# 7. Verificar documentação
echo "7. Checking documentation..."
if [ -f "/root/projetos/enem-pro/CACHE_IMPLEMENTATION.md" ]; then
  echo "   ✅ Main implementation guide exists"
else
  echo "   ❌ Implementation guide not found"
  ERRORS=$((ERRORS+1))
fi

if [ -f "/root/projetos/enem-pro/CACHE_IMPLEMENTATION_REPORT.md" ]; then
  echo "   ✅ Implementation report exists"
else
  echo "   ❌ Implementation report not found"
  ERRORS=$((ERRORS+1))
fi

echo ""
echo "===================================="
echo ""

if [ $ERRORS -eq 0 ]; then
  echo "✨ All checks passed!"
  echo ""
  echo "📊 Summary:"
  echo "  ✅ lib/cache.ts - Metrics tracking"
  echo "  ✅ /api/admin/invalidate-cache - Single/Batch/All modes"
  echo "  ✅ scripts/warm-cache.ts - Pre-warming for 100 questions"
  echo "  ✅ /api/metrics/cache - Prometheus endpoint"
  echo "  ✅ scripts/cache-benchmark.ts - Performance testing"
  echo "  ✅ scripts/invalidate-cache-batch.ts - CLI helper"
  echo "  ✅ Documentation complete"
  echo ""
  echo "🚀 Ready for deployment!"
  exit 0
else
  echo "❌ $ERRORS check(s) failed!"
  exit 1
fi
