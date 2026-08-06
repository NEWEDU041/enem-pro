#!/bin/bash
set -e

echo "🔍 VALIDAÇÃO COMPLETA — ENEM Pro"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SITE="https://questoesenem.pro"
ERRORS=0

# 1. HEALTH CHECK
echo "1️⃣ HEALTH CHECK"
if curl -s -o /dev/null -w "%{http_code}" "$SITE" | grep -q "200"; then
  echo "   ✅ Site respondendo (HTTP 200)"
else
  echo "   ❌ Site não respondendo"
  ERRORS=$((ERRORS+1))
fi

# 2. POSTS BLOG
echo ""
echo "2️⃣ POSTS BLOG"
POSTS=$(curl -s "$SITE/blog" | grep -o "Gabarito ENEM" | wc -l)
if [ $POSTS -gt 0 ]; then
  echo "   ✅ Blog posts visíveis (encontrado: $POSTS)"
else
  echo "   ⚠️  Nenhum post detectado"
  ERRORS=$((ERRORS+1))
fi

# 3. FERRAMENTAS
echo ""
echo "3️⃣ FERRAMENTAS FUNCIONANDO"
for tool in "questoes" "simulado" "calcular-nota" "gabarito"; do
  if curl -s -o /dev/null -w "%{http_code}" "$SITE/$tool" | grep -q "200"; then
    echo "   ✅ /$tool (HTTP 200)"
  else
    echo "   ❌ /$tool (não respondendo)"
    ERRORS=$((ERRORS+1))
  fi
done

# 4. SCHEMAS
echo ""
echo "4️⃣ SCHEMA MARKUP"
for url in "/questoes" "/blog" "/simulado" "/calcular-nota"; do
  SCHEMA=$(curl -s "$SITE$url" | grep -o "schema.org" | wc -l)
  if [ $SCHEMA -gt 0 ]; then
    echo "   ✅ $url tem schema.org"
  else
    echo "   ⚠️  $url sem schema detectado"
  fi
done

# 5. SITEMAP
echo ""
echo "5️⃣ SITEMAP.XML"
SITEMAP_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/sitemap.xml")
if [ "$SITEMAP_HTTP" = "200" ]; then
  URLS=$(curl -s "$SITE/sitemap.xml" | grep -o "<loc>" | wc -l)
  echo "   ✅ Sitemap.xml encontrado ($URLS URLs)"
else
  echo "   ❌ Sitemap.xml não encontrado"
  ERRORS=$((ERRORS+1))
fi

# 6. PERFORMANCE
echo ""
echo "6️⃣ PERFORMANCE"
RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null "$SITE")
echo "   ⏱️  Tempo de resposta: ${RESPONSE_TIME}s"
if (( $(echo "$RESPONSE_TIME < 2" | bc -l) )); then
  echo "   ✅ Excelente (< 2s)"
else
  echo "   ⚠️  Considerar otimização"
fi

# 7. POSTS COUNT
echo ""
echo "7️⃣ CONTAGEM DE POSTS"
if [ -f "lib/blog-index.json" ]; then
  POSTS_COUNT=$(grep -o '"slug"' lib/blog-index.json | wc -l)
  echo "   ✅ $POSTS_COUNT posts em blog-index.json"
fi

# 8. BUILD STATUS
echo ""
echo "8️⃣ BUILD STATUS"
if [ -d ".next" ]; then
  echo "   ✅ Build folder (.next) presente"
else
  echo "   ⚠️  Build folder não encontrado"
  ERRORS=$((ERRORS+1))
fi

# 9. GIT STATUS
echo ""
echo "9️⃣ GIT STATUS"
COMMITS=$(git log --oneline | wc -l)
UNCOMMITTED=$(git status --short | wc -l)
echo "   📊 Total de commits: $COMMITS"
echo "   ✅ Arquivos uncommitted: $UNCOMMITTED"

# 10. FINAL SCORE
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
  echo "🎉 VALIDAÇÃO: 100% PASSOU"
  echo "   ✅ Tudo pronto para produção!"
  exit 0
else
  echo "⚠️  VALIDAÇÃO: $ERRORS erro(s) encontrado(s)"
  echo "   Revisar acima"
  exit 1
fi
