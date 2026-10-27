#!/bin/bash

# enem-pro API Validation Test Script
# Tests the three main endpoints that were failing

echo "================================"
echo "enem-pro API Validation Tests"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
FAILED=0
PASSED=0

# Helper function
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_statuses=$5
  
  echo -n "Testing $name... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi
  
  # Last line is status code
  status=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | head -n -1)
  
  # Check if status is in expected list
  if echo "$expected_statuses" | grep -q "$status"; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $status)"
    PASSED=$((PASSED + 1))
    
    # Verify JSON response
    if echo "$body" | jq . >/dev/null 2>&1; then
      echo "  └─ Response is valid JSON ✓"
    else
      echo "  └─ Response is NOT valid JSON ✗"
      FAILED=$((FAILED + 1))
    fi
  else
    echo -e "${RED}✗ FAIL${NC} (Status: $status, Expected: $expected_statuses)"
    FAILED=$((FAILED + 1))
    echo "  Response: $body" | head -n 1
  fi
  echo ""
}

# Test 1: Health endpoint
test_endpoint \
  "Health Endpoint" \
  "GET" \
  "/api/health" \
  "" \
  "200"

# Test 2: Explicar endpoint
test_endpoint \
  "Explicar Endpoint" \
  "POST" \
  "/api/explicar" \
  '{"pergunta":"O que é fotossíntese?","contexto":"Biologia","nivel":"ensino-medio"}' \
  "200 201 401 429"

# Test 3: Checkout endpoint
test_endpoint \
  "Checkout Endpoint" \
  "POST" \
  "/api/checkout" \
  '{"userId":"test-user-123","plano":"premium-anual","email":"test@example.com"}' \
  "200 201 401 429"

echo "================================"
echo "Test Summary"
echo "================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed!${NC}"
  exit 1
fi
