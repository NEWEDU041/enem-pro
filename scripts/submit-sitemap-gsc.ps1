# 🔍 Script para submeter sitemap ao Google Search Console
# PowerShell version

$SITE_URL = "https://enemprep.com.br"
$SITEMAP_URL = "$SITE_URL/sitemap.xml"
$SITEMAP_INDEX_URL = "$SITE_URL/sitemap-index.xml"

Write-Host "📡 Submitting sitemaps to Google Search Console..." -ForegroundColor Cyan
Write-Host "🔗 Sitemap: $SITEMAP_URL" -ForegroundColor Gray
Write-Host "🔗 Sitemap Index: $SITEMAP_INDEX_URL" -ForegroundColor Gray
Write-Host ""

# Ping Google Sitemaps
Write-Host "📌 Pinging Google (sitemap)..." -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "https://www.google.com/ping?sitemap=$SITEMAP_URL" -ErrorAction SilentlyContinue
  Write-Host "✅ Sitemap pinged" -ForegroundColor Green
} catch {
  Write-Host "⚠️  Error pinging Google: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📌 Pinging Google (sitemap-index)..." -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "https://www.google.com/ping?sitemap=$SITEMAP_INDEX_URL" -ErrorAction SilentlyContinue
  Write-Host "✅ Sitemap Index pinged" -ForegroundColor Green
} catch {
  Write-Host "⚠️  Error pinging Google: $_" -ForegroundColor Yellow
}

# Ping Bing
Write-Host ""
Write-Host "📌 Pinging Bing..." -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "https://www.bing.com/ping?sitemap=$SITEMAP_URL" -ErrorAction SilentlyContinue
  Write-Host "✅ Bing notified" -ForegroundColor Green
} catch {
  Write-Host "⚠️  Error pinging Bing: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Sitemap submission complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Next steps:" -ForegroundColor Cyan
Write-Host "1. Check Google Search Console: https://search.google.com/search-console" -ForegroundColor Gray
Write-Host "2. Monitor indexation in 24-48 hours" -ForegroundColor Gray
Write-Host "3. Check Core Web Vitals" -ForegroundColor Gray
