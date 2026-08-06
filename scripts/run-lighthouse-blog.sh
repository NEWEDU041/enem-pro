#!/bin/bash
# Lighthouse Performance Testing for Blog Posts
# Tests excellent posts (11+ minutes) for Core Web Vitals and optimization

set -e

SITE_URL="${1:-http://localhost:3000}"
SAMPLE_SIZE="${2:-30}"  # Test 30 excellent posts to balance coverage/time

echo "🚀 Lighthouse Blog Testing Suite"
echo "================================"
echo "Site: $SITE_URL"
echo "Sample size: $SAMPLE_SIZE posts"
echo ""

# Create reports directory
mkdir -p reports/lighthouse-blog

# Load blog metrics
if [ ! -f "scripts/blog-metrics.json" ]; then
  echo "❌ scripts/blog-metrics.json not found. Run: npm run extract-metrics"
  exit 1
fi

# Extract excellent posts from metrics
EXCELLENT_POSTS=$(node -e "
const data = require('./scripts/blog-metrics.json');
const posts = data.excellent.slice(0, parseInt(process.argv[1]));
console.log(posts.join(' '));
" "$SAMPLE_SIZE")

TOTAL_POSTS=$(node -e "console.log(require('./scripts/blog-metrics.json').excellentCount)")

echo "Testing $SAMPLE_SIZE of $TOTAL_POSTS excellent posts"
echo ""

# Results storage
RESULTS_FILE="reports/lighthouse-blog/results-$(date +%Y%m%d-%H%M%S).json"
REPORT_FILE="reports/lighthouse-blog/lighthouse-report-$(date +%Y%m%d-%H%M%S).md"

# Initialize results
cat > "$RESULTS_FILE" << 'EOF'
{
  "metadata": {
    "timestamp": "TIMESTAMP_PLACEHOLDER",
    "siteUrl": "SITE_URL_PLACEHOLDER",
    "totalTested": 0,
    "results": []
  }
}
EOF

sed -i "s|TIMESTAMP_PLACEHOLDER|$(date -u +%Y-%m-%dT%H:%M:%SZ)|g" "$RESULTS_FILE"
sed -i "s|SITE_URL_PLACEHOLDER|$SITE_URL|g" "$RESULTS_FILE"

# Test each post
TEST_COUNT=0
PASSED_90=0
FAILED_90=0

echo "📊 Running Lighthouse tests..."
echo ""

for slug in $EXCELLENT_POSTS; do
  TEST_COUNT=$((TEST_COUNT + 1))
  URL="$SITE_URL/blog/$slug"

  echo "[$TEST_COUNT/$SAMPLE_SIZE] Testing: $slug"

  # Generate report filename
  REPORT_HTML="reports/lighthouse-blog/${slug}-$(date +%H%M%S).html"
  REPORT_JSON="reports/lighthouse-blog/${slug}-$(date +%H%M%S).json"

  # Run Lighthouse (suppress stderr for cleaner output)
  if lighthouse "$URL" \
    --output-path="$REPORT_HTML" \
    --output=html \
    --output-path="$REPORT_JSON" \
    --output=json \
    --chrome-flags="--headless --disable-dev-shm-usage" \
    --quiet 2>/dev/null || true; then

    # Extract scores from JSON report
    if [ -f "$REPORT_JSON" ]; then
      SCORES=$(node -e "
        const fs = require('fs');
        const report = JSON.parse(fs.readFileSync('$REPORT_JSON', 'utf8'));
        const categories = report.categories || {};
        const perf = (categories.performance?.score || 0) * 100;
        const access = (categories.accessibility?.score || 0) * 100;
        const best = (categories['best-practices']?.score || 0) * 100;
        const seo = (categories.seo?.score || 0) * 100;
        const pwa = (categories.pwa?.score || 0) * 100;
        const overall = Math.round((perf + access + best + seo) / 4);
        console.log(Math.round(perf) + ',' + Math.round(access) + ',' + Math.round(best) + ',' + Math.round(seo) + ',' + overall);
      ")

      IFS=',' read -r PERF ACC BEST SEO OVERALL <<< "$SCORES"

      if [ "$OVERALL" -ge 90 ]; then
        PASSED_90=$((PASSED_90 + 1))
        STATUS="✅ PASS"
      else
        FAILED_90=$((FAILED_90 + 1))
        STATUS="⚠️  NEEDS WORK"
      fi

      echo "  $STATUS: Overall=$OVERALL (Perf=$PERF, Access=$ACC, Best=$BEST, SEO=$SEO)"

      # Append to results
      node -e "
        const fs = require('fs');
        const results = JSON.parse(fs.readFileSync('$RESULTS_FILE', 'utf8'));
        results.metadata.totalTested++;
        results.metadata.results.push({
          slug: '$slug',
          url: '$URL',
          scores: {
            performance: $PERF,
            accessibility: $ACC,
            bestPractices: $BEST,
            seo: $SEO,
            overall: $OVERALL
          },
          reportHtml: '$REPORT_HTML',
          reportJson: '$REPORT_JSON'
        });
        fs.writeFileSync('$RESULTS_FILE', JSON.stringify(results, null, 2));
      "
    fi
  else
    echo "  ❌ FAILED: Could not run Lighthouse"
  fi

  echo ""
done

echo "======================================="
echo "📊 Testing Complete"
echo "======================================="
echo "Total tested: $TEST_COUNT"
echo "Passed (90+): $PASSED_90"
echo "Need optimization: $FAILED_90"
echo ""
echo "Pass rate: $(node -e "console.log(Math.round(($PASSED_90 / $TEST_COUNT) * 100))")%"
echo ""
echo "Results saved to:"
echo "  JSON: $RESULTS_FILE"
echo "  HTML Reports: reports/lighthouse-blog/"
echo ""

# Generate markdown report
node << 'REPORT_SCRIPT'
const fs = require('fs');
const path = require('path');

const resultsFile = process.argv[1];
if (!fs.existsSync(resultsFile)) {
  console.error('Results file not found');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
const reportFile = resultsFile.replace(/\.json$/, '.md').replace('lighthouse-blog', 'lighthouse-blog');

let markdown = `# Lighthouse Blog Post Performance Report

**Date:** ${new Date().toLocaleString()}
**Posts Tested:** ${results.metadata.totalTested}
**Site:** ${results.metadata.siteUrl}

## Summary

| Metric | Value |
|--------|-------|
| Total Tested | ${results.metadata.totalTested} |
| Passed (90+) | ${results.metadata.results.filter(r => r.scores.overall >= 90).length} |
| Need Optimization | ${results.metadata.results.filter(r => r.scores.overall < 90).length} |
| Pass Rate | ${Math.round((results.metadata.results.filter(r => r.scores.overall >= 90).length / results.metadata.totalTested) * 100)}% |
| Average Score | ${Math.round(results.metadata.results.reduce((acc, r) => acc + r.scores.overall, 0) / results.metadata.totalTested)} |

## Scores by Category

### Overall Performance

| Rank | Post | Overall | Perf | Access | Best | SEO |
|------|------|---------|------|--------|------|-----|
`;

// Sort by overall score
const sorted = [...results.metadata.results].sort((a, b) => b.scores.overall - a.scores.overall);

sorted.forEach((result, idx) => {
  const status = result.scores.overall >= 90 ? '✅' : '⚠️';
  markdown += `| ${idx + 1} | ${result.slug} | ${status} ${result.scores.overall} | ${result.scores.performance} | ${result.scores.accessibility} | ${result.scores.bestPractices} | ${result.scores.seo} |\n`;
});

markdown += `\n## Posts Needing Optimization (< 90)\n\n`;

const failing = results.metadata.results.filter(r => r.scores.overall < 90).sort((a, b) => a.scores.overall - b.scores.overall);

if (failing.length === 0) {
  markdown += `✅ All tested posts achieved 90+ score!\n\n`;
} else {
  failing.forEach(result => {
    const gaps = [];
    if (result.scores.performance < 90) gaps.push(`Performance: ${result.scores.performance}`);
    if (result.scores.accessibility < 90) gaps.push(`Accessibility: ${result.scores.accessibility}`);
    if (result.scores.bestPractices < 90) gaps.push(`Best Practices: ${result.scores.bestPractices}`);
    if (result.scores.seo < 90) gaps.push(`SEO: ${result.scores.seo}`);

    markdown += `### ${result.slug}
- Overall: ${result.scores.overall}
- Issues: ${gaps.join(', ')}
- [Full Report](${path.basename(result.reportHtml)})

`;
  });
}

markdown += `\n## Optimization Recommendations

### High Priority (< 70)
${results.metadata.results.filter(r => r.scores.overall < 70).map(r => `- **${r.slug}**: ${r.scores.overall} - Needs immediate optimization`).join('\n')}

### Medium Priority (70-90)
${results.metadata.results.filter(r => r.scores.overall >= 70 && r.scores.overall < 90).map(r => `- **${r.slug}**: ${r.scores.overall} - Optimize images, reduce JS`).join('\n')}

### Quick Wins to Implement
1. **Image Optimization**
   - Convert PNG/JPG to WebP format (20-30% size reduction)
   - Implement lazy loading for below-fold images
   - Add responsive images with srcset

2. **Code Splitting**
   - Defer non-critical CSS and JavaScript
   - Minify CSS/JS files
   - Remove unused CSS

3. **Core Web Vitals**
   - Largest Contentful Paint (LCP): Optimize images, reduce server latency
   - First Input Delay (FID): Reduce JavaScript execution time
   - Cumulative Layout Shift (CLS): Add explicit dimensions to images/ads

4. **SEO Improvements**
   - Ensure meta descriptions (160 chars)
   - Add structured data (JSON-LD)
   - Improve heading hierarchy

5. **Accessibility**
   - Add alt text to all images
   - Ensure color contrast (WCAG AA)
   - Use semantic HTML

## Next Steps

1. Review HTML reports in \`reports/lighthouse-blog/\` for detailed insights
2. Prioritize posts with scores < 70
3. Implement optimizations from "Quick Wins" section
4. Re-test after optimization to measure improvement
5. Consider using Next.js Image component for automatic optimization

---
Generated: ${new Date().toISOString()}
`;

fs.writeFileSync(reportFile, markdown);
console.log('Report saved to: ' + path.basename(reportFile));
REPORT_SCRIPT

echo "✅ Lighthouse testing complete!"
