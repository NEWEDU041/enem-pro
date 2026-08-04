#!/bin/bash
# 📊 Script para rodar Lighthouse em múltiplas URLs

set -e

SITE_URL="${1:-http://localhost:3000}"

echo "📊 Executando Lighthouse..."
echo "Site: $SITE_URL"
echo ""

# URLs a testar
URLS=(
  "$SITE_URL"
  "$SITE_URL/questoes"
  "$SITE_URL/simulado"
  "$SITE_URL/blog"
  "$SITE_URL/calcular-nota"
)

mkdir -p reports

for url in "${URLS[@]}"; do
  echo "🔦 Testando: $url"

  filename=$(echo "$url" | sed 's|https*://||' | sed 's|/|-|g' | sed 's|-$||')
  report_file="reports/lighthouse-$filename-$(date +%Y%m%d-%H%M%S).html"

  lighthouse "$url" \
    --output-path="$report_file" \
    --output=html \
    --chrome-flags="--headless" \
    2>/dev/null

  echo "  ✅ Relatório: $report_file"
  echo ""
done

echo "📊 Todos os testes concluídos!"
echo "   Relatórios em: ./reports/"
