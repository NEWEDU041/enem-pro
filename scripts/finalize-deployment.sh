#!/bin/bash

echo "🚀 FINALIZAÇÃO DE DEPLOYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Variables
DOMAIN="https://questoesenem.pro"
SITEMAP_URL="$DOMAIN/sitemap.xml"

echo ""
echo "📊 VERIFICAÇÕES FINAIS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Health check
echo "1️⃣  Health check (HTTP 200?)..."
if curl -s -o /dev/null -w "%{http_code}" "$DOMAIN" | grep -q "200"; then
  echo "   ✅ Site respondendo (HTTP 200)"
else
  echo "   ❌ Site não respondendo"
  exit 1
fi

# 2. Sitemap verificação
echo "2️⃣  Sitemap.xml válido?"
if curl -s "$SITEMAP_URL" | grep -q "<?xml"; then
  echo "   ✅ Sitemap.xml encontrado"
  SITEMAP_URLS=$(curl -s "$SITEMAP_URL" | grep -o "<loc>[^<]*</loc>" | wc -l)
  echo "   📍 URLs no sitemap: $SITEMAP_URLS"
else
  echo "   ❌ Sitemap.xml não encontrado"
fi

# 3. Blog posts
echo "3️⃣  Posts carregando?"
if curl -s "$DOMAIN/blog" | grep -q "Gabarito ENEM 2024"; then
  echo "   ✅ Posts detectados"
else
  echo "   ⚠️  Verificar posts no blog"
fi

# 4. Ferramentas
echo "4️⃣  Ferramentas funcionando?"
for tool in "questoes" "simulado" "calcular-nota" "gabarito"; do
  if curl -s "$DOMAIN/$tool" | grep -q "html"; then
    echo "   ✅ /$tool respondendo"
  else
    echo "   ❌ /$tool não respondendo"
  fi
done

# 5. Schema Markup
echo "5️⃣  Schema markup?"
if curl -s "$DOMAIN" | grep -q "schema.org"; then
  echo "   ✅ Schema.org detectado"
else
  echo "   ⚠️  Verificar schema.org"
fi

echo ""
echo "🎉 PRÓXIMOS PASSOS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Ir para Google Search Console:"
echo "   https://search.google.com/search-console"
echo ""
echo "2. Submeter sitemap:"
echo "   URL: $SITEMAP_URL"
echo ""
echo "3. Validar schemas:"
echo "   https://search.google.com/test/rich-results"
echo ""
echo "4. Monitorar indexação:"
echo "   GSC → Coverage"
echo ""
echo "✅ DEPLOYMENT CONCLUÍDO!"
