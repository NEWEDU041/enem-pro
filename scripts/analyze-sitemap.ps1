# Sitemap Coverage Analysis

param(
    [string]$Url = "https://enemprep.com.br/sitemap.xml",
    [switch]$Verbose
)

Write-Host "[*] Sitemap Coverage Analysis" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Gray
Write-Host ""

try {
    # Fetch sitemap
    Write-Host "[*] Fetching sitemap from $Url..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri $Url -ErrorAction Stop
    [xml]$sitemap = $response.Content

    # Count total URLs
    $totalUrls = $sitemap.urlset.url.Count
    if ($null -eq $totalUrls) {
        $totalUrls = 1
    }

    Write-Host "[OK] Sitemap fetched successfully" -ForegroundColor Green
    Write-Host ""

    # Analyze URLs by category
    Write-Host "[*] URL Distribution:" -ForegroundColor Cyan
    Write-Host ""

    $categories = @{
        'Blog Posts' = @{ pattern = '/blog/'; count = 0 }
        'Questions' = @{ pattern = '/questoes/'; count = 0 }
        'Gabarito' = @{ pattern = '/gabarito/'; count = 0 }
        'Materias' = @{ pattern = '/materias/'; count = 0 }
        'Core Pages' = @{ pattern = ''; count = 0 }
    }

    foreach ($url in $sitemap.urlset.url) {
        $loc = $url.loc

        if ($loc -match '/blog/') {
            $categories['Blog Posts'].count++
        }
        elseif ($loc -match '/questoes/') {
            $categories['Questions'].count++
        }
        elseif ($loc -match '/gabarito/') {
            $categories['Gabarito'].count++
        }
        elseif ($loc -match '/materias/') {
            $categories['Materias'].count++
        }
        else {
            $categories['Core Pages'].count++
        }
    }

    $categories.GetEnumerator() | ForEach-Object {
        $pct = if ($totalUrls -gt 0) { [math]::Round(($_.Value.count / $totalUrls) * 100, 1) } else { 0 }
        Write-Host "  - $($_.Key): $($_.Value.count) URLs ($pct%)" -ForegroundColor White
    }

    Write-Host ""
    Write-Host "[*] Summary:" -ForegroundColor Cyan
    Write-Host "  Total URLs: $totalUrls" -ForegroundColor White
    Write-Host "  Max URLs in single sitemap: 50,000" -ForegroundColor Gray
    $status = if ($totalUrls -le 50000) { "[OK] OK" } else { "[WARN] May need splitting" }
    Write-Host "  Status: $status" -ForegroundColor $(if ($totalUrls -le 50000) { "Green" } else { "Yellow" })

    Write-Host ""
    Write-Host "[*] Indexation Status:" -ForegroundColor Cyan
    Write-Host "  Expected indexation: 48-72 hours" -ForegroundColor Gray
    Write-Host "  Peak crawl rate: 30 requests/minute" -ForegroundColor Gray
    Write-Host ""
    Write-Host "[*] Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Check GSC: https://search.google.com/search-console" -ForegroundColor Gray
    Write-Host "  2. Monitor crawl errors: Excluded URLs section" -ForegroundColor Gray
    Write-Host "  3. Check indexation report daily" -ForegroundColor Gray
    Write-Host "  4. Review Core Web Vitals" -ForegroundColor Gray

    if ($Verbose) {
        Write-Host ""
        Write-Host "[*] First 20 URLs:" -ForegroundColor Gray
        $sitemap.urlset.url | Select-Object -First 20 | ForEach-Object {
            Write-Host "  - $($_.loc)" -ForegroundColor DarkGray
        }
    }

} catch {
    Write-Host "[ERROR] Error analyzing sitemap: $_" -ForegroundColor Red
    exit 1
}
