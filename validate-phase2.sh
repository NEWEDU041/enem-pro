#!/bin/bash

# PHASE 2 Validation Script: Robots.txt + Meta-Generator
# Tests crawl directives and meta tag generation for ENEM Pro

echo "=== PHASE 2: ENEM-Pro SEO Validation ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

# Test 1: Check robots.txt exists
echo -e "${BLUE}[TEST 1]${NC} Check robots.txt exists..."
if [ -f "public/robots.txt" ]; then
  echo -e "${GREEN}✓ robots.txt found${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗ robots.txt not found${NC}"
  FAIL=$((FAIL + 1))
fi

# Test 2: Verify robots.txt has crawl directives
echo -e "${BLUE}[TEST 2]${NC} Verify crawl directives in robots.txt..."
CHECKS=("User-agent:" "Disallow: /admin" "Disallow: /api/" "Allow: /questions" "Allow: /exams" "Allow: /solutions" "Crawl-delay:" "Sitemap:")
for check in "${CHECKS[@]}"; do
  if grep -q "$check" public/robots.txt; then
    echo -e "${GREEN}✓${NC} Found: $check"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} Missing: $check"
    FAIL=$((FAIL + 1))
  fi
done

# Test 3: Check .env protection
echo -e "${BLUE}[TEST 3]${NC} Verify .env protection in robots.txt..."
if grep -q "Disallow: /.env" public/robots.txt; then
  echo -e "${GREEN}✓ .env files are blocked${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗ .env files not protected${NC}"
  FAIL=$((FAIL + 1))
fi

# Test 4: Check sensitive endpoints
echo -e "${BLUE}[TEST 4]${NC} Verify sensitive endpoints blocked..."
SENSITIVE=("/admin/" "/login" "/account/" "/dashboard/")
for endpoint in "${SENSITIVE[@]}"; do
  if grep -q "Disallow: $endpoint" public/robots.txt; then
    echo -e "${GREEN}✓${NC} Blocked: $endpoint"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} Not blocked: $endpoint"
    FAIL=$((FAIL + 1))
  fi
done

# Test 5: Check sitemaps
echo -e "${BLUE}[TEST 5]${NC} Verify sitemap references..."
SITEMAPS=("sitemap.xml" "sitemap-posts.xml" "sitemap-static.xml")
for sitemap in "${SITEMAPS[@]}"; do
  if grep -q "$sitemap" public/robots.txt; then
    echo -e "${GREEN}✓${NC} Sitemap: $sitemap"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} Missing sitemap: $sitemap"
    FAIL=$((FAIL + 1))
  fi
done

# Test 6: Check meta-generator exists
echo -e "${BLUE}[TEST 6]${NC} Check meta-generator.ts exists..."
if [ -f "src/lib/meta-generator.ts" ]; then
  echo -e "${GREEN}✓ meta-generator.ts found${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗ meta-generator.ts not found${NC}"
  FAIL=$((FAIL + 1))
fi

# Test 7: Check meta-generator exports
echo -e "${BLUE}[TEST 7]${NC} Verify meta-generator exports..."
EXPORTS=("generateMetaTags" "validateMetaTags" "sanitize" "generateArticleSchema" "generateFAQSchema" "generateOrganizationSchema")
for export in "${EXPORTS[@]}"; do
  if grep -q "export function $export\|export const $export" src/lib/meta-generator.ts; then
    echo -e "${GREEN}✓${NC} Export: $export"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} Missing export: $export"
    FAIL=$((FAIL + 1))
  fi
done

# Test 8: Check test file exists
echo -e "${BLUE}[TEST 8]${NC} Check test file exists..."
if [ -f "__tests__/meta-generator.test.ts" ]; then
  echo -e "${GREEN}✓ test file found${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗ test file not found${NC}"
  FAIL=$((FAIL + 1))
fi

# Test 9: Verify critical functions in meta-generator
echo -e "${BLUE}[TEST 9]${NC} Verify critical functionality..."
FUNCTIONS=("sanitize" "OpenGraph" "Twitter Card" "JSON-LD" "breadcrumb" "schema" "validation")
for func in "${FUNCTIONS[@]}"; do
  if grep -q "$func" src/lib/meta-generator.ts; then
    echo -e "${GREEN}✓${NC} Implements: $func"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} Missing: $func"
    FAIL=$((FAIL + 1))
  fi
done

# Test 10: Check validation logic
echo -e "${BLUE}[TEST 10]${NC} Verify validation logic..."
if grep -q "validateMetaTags\|title.length\|description.length" src/lib/meta-generator.ts; then
  echo -e "${GREEN}✓ Meta tag validation implemented${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗ Meta tag validation missing${NC}"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "=== Results ==="
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"

TOTAL=$((PASS + FAIL))
echo "Total: $TOTAL"

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
