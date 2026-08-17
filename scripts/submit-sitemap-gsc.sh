#!/bin/bash

# 🔍 Script para submeter sitemap ao Google Search Console
# Uso: ./scripts/submit-sitemap-gsc.sh

set -e

SITE_URL="https://enemprep.com.br"
SITEMAP_URL="${SITE_URL}/sitemap.xml"
SITEMAP_INDEX_URL="${SITE_URL}/sitemap-index.xml"
GSC_API_KEY="${GSC_API_KEY:-}"

echo "📡 Submiting sitemaps to Google Search Console..."
echo "🔗 Sitemap: $SITEMAP_URL"
echo "🔗 Sitemap Index: $SITEMAP_INDEX_URL"

# Ping Google Sitemaps
echo ""
echo "📌 Pinging Google (sitemap)..."
curl -s "https://www.google.com/ping?sitemap=${SITEMAP_URL}" && echo "✅ Sitemap pinged"

echo ""
echo "📌 Pinging Google (sitemap-index)..."
curl -s "https://www.google.com/ping?sitemap=${SITEMAP_INDEX_URL}" && echo "✅ Sitemap Index pinged"

# Ping Bing
echo ""
echo "📌 Pinging Bing..."
curl -s "https://www.bing.com/ping?sitemap=${SITEMAP_URL}" && echo "✅ Bing notified"

echo ""
echo "✨ Sitemap submission complete!"
echo ""
echo "📊 Next steps:"
echo "1. Check Google Search Console for crawl status: https://search.google.com/search-console"
echo "2. Monitor indexation in 24-48 hours"
echo "3. Check Core Web Vitals"
