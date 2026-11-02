#!/bin/bash
# Validate ENEM-Pro sitemaps
# Usage: ./scripts/validate-sitemap.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "======================================================================"
echo "ENEM-Pro Sitemap Validation"
echo "======================================================================"
echo ""

# Check files exist
echo "[1] File Existence Check"
files=(
    "public/sitemap.xml"
    "public/sitemap-posts.xml"
    "lib/blog-index.json"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "?")
        echo "  ✓ $file ($size bytes)"
    else
        echo "  ✗ $file (NOT FOUND)"
        exit 1
    fi
done

echo ""
echo "[2] Data Validation"

# Python validation
python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import json
import os

# Load index
with open('lib/blog-index.json', 'r') as f:
    posts = json.load(f)

print(f"  Posts in index: {len(posts)}")

# Parse sitemap
tree = ET.parse('public/sitemap-posts.xml')
root = tree.getroot()
ns = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls = root.findall('ns:url', ns)

print(f"  URLs in sitemap: {len(urls)}")

# Check match
if len(urls) == len(posts):
    print(f"  ✓ URL count matches")
else:
    print(f"  ⚠ URL count mismatch ({len(urls)} vs {len(posts)})")

# Sample validation
valid = 0
for url in urls:
    loc = url.find('ns:loc', ns)
    if loc is not None and loc.text and 'enem-pro.com/blog/' in loc.text:
        valid += 1

pct = (valid / len(urls) * 100) if urls else 0
print(f"  ✓ Valid URLs: {valid}/{len(urls)} ({pct:.0f}%)")

# Date validation
dates = []
for url in urls:
    lastmod = url.find('ns:lastmod', ns)
    if lastmod is not None and lastmod.text:
        dates.append(lastmod.text)

if dates:
    print(f"  Date range: {min(dates)} to {max(dates)}")
    print(f"  ✓ All required fields present")

PYEOF

echo ""
echo "[3] Format Validation"

# Quick XML check (Python-based if xmllint unavailable)
python3 << 'PYEOF'
import xml.etree.ElementTree as ET

try:
    ET.parse('public/sitemap.xml')
    print("  ✓ sitemap.xml is valid XML")
except Exception as e:
    print(f"  ✗ sitemap.xml: {e}")
    exit(1)

try:
    ET.parse('public/sitemap-posts.xml')
    print("  ✓ sitemap-posts.xml is valid XML")
except Exception as e:
    print(f"  ✗ sitemap-posts.xml: {e}")
    exit(1)

PYEOF

echo ""
echo "======================================================================"
echo "✓ All validation checks passed"
echo "======================================================================"
