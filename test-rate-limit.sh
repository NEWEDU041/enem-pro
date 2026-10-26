#!/bin/bash

# Rate Limiting Test Script for enem-pro
# Tests both global (100 req/min) and sensitive endpoint (10 req/min) limits
# Usage: bash test-rate-limit.sh [host] [port]

HOST="${1:-localhost}"
PORT="${2:-3000}"
BASE_URL="http://$HOST:$PORT"

echo "=========================================="
echo "Rate Limiting Test Suite - enem-pro"
echo "=========================================="
echo "Target: $BASE_URL"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Normal endpoint (100 req/min limit)
echo -e "${YELLOW}[TEST 1] Normal Endpoint - Global Limit (100 req/min)${NC}"
echo "Making 5 sequential requests to /api/health-test (should all succeed)..."

SUCCESSES=0
for i in {1..5}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health-test")
  STATUS=$(echo "$RESPONSE" | tail -n 1)
  
  if [ "$STATUS" = "200" ]; then
    SUCCESSES=$((SUCCESSES + 1))
    echo -e "  Request $i: ${GREEN}✓ 200${NC}"
  else
    echo -e "  Request $i: ${RED}✗ $STATUS${NC}"
  fi
done

echo -e "\nResult: $SUCCESSES/5 requests succeeded"
echo ""

# Test 2: Stress test with many requests to trigger limit
echo -e "${YELLOW}[TEST 2] Stress Test - Triggering Rate Limit${NC}"
echo "Making 110 rapid requests to /api/health-test (expecting some 429s after 100)..."

SUCCESS_COUNT=0
RATE_LIMITED_COUNT=0
OTHER_ERROR_COUNT=0

for i in {1..110}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health-test")
  STATUS=$(echo "$RESPONSE" | tail -n 1)
  
  if [ "$STATUS" = "200" ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  elif [ "$STATUS" = "429" ]; then
    RATE_LIMITED_COUNT=$((RATE_LIMITED_COUNT + 1))
    if [ $RATE_LIMITED_COUNT -eq 1 ]; then
      echo -e "  First 429 at request #$i (expected ~100)"
      # Show rate limit headers
      HEADERS=$(curl -s -i "$BASE_URL/api/health-test" | grep -i "rate-limit\|retry-after")
      echo "  Headers:"
      echo "$HEADERS" | sed 's/^/    /'
    fi
  else
    OTHER_ERROR_COUNT=$((OTHER_ERROR_COUNT + 1))
  fi
done

echo ""
echo -e "Results:"
echo -e "  ${GREEN}Successful (200): $SUCCESS_COUNT${NC}"
echo -e "  ${RED}Rate Limited (429): $RATE_LIMITED_COUNT${NC}"
echo -e "  Other Errors: $OTHER_ERROR_COUNT"
echo ""

# Test 3: Sensitive endpoint (10 req/min limit)
echo -e "${YELLOW}[TEST 3] Sensitive Endpoint - Lower Limit (10 req/min)${NC}"
echo "Making 15 rapid requests to /api/admin/stats (expecting ~5 429s)..."

SUCCESS_COUNT=0
RATE_LIMITED_COUNT=0

for i in {1..15}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/admin/stats")
  STATUS=$(echo "$RESPONSE" | tail -n 1)
  
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ] || [ "$STATUS" = "404" ]; then
    # 401/404 are normal (endpoint may not exist or require auth), only 200 counts as successful rate-limit-wise
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  elif [ "$STATUS" = "429" ]; then
    RATE_LIMITED_COUNT=$((RATE_LIMITED_COUNT + 1))
    if [ $RATE_LIMITED_COUNT -eq 1 ]; then
      echo -e "  First 429 at request #$i (expected ~10)"
    fi
  fi
done

echo ""
echo -e "Results:"
echo -e "  ${GREEN}Not Rate Limited: $SUCCESS_COUNT${NC}"
echo -e "  ${RED}Rate Limited (429): $RATE_LIMITED_COUNT${NC}"
echo ""

# Test 4: Multiple endpoints
echo -e "${YELLOW}[TEST 4] Multiple Different Endpoints${NC}"
echo "Making requests to different endpoints (should not interfere with each other)..."

declare -A endpoints
endpoints["/api/health-test"]="normal"
endpoints["/api/questoes"]="normal"
endpoints["/api/newsletter"]="normal"

for endpoint in "${!endpoints[@]}"; do
  RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  STATUS=$(echo "$RESPONSE" | tail -n 1)
  ENDPOINT_TYPE="${endpoints[$endpoint]}"
  
  if [ "$STATUS" = "200" ]; then
    echo -e "  $endpoint (${ENDPOINT_TYPE}): ${GREEN}✓ 200${NC}"
  elif [ "$STATUS" = "429" ]; then
    echo -e "  $endpoint (${ENDPOINT_TYPE}): ${RED}✗ 429${NC}"
  else
    echo -e "  $endpoint (${ENDPOINT_TYPE}): $STATUS"
  fi
done

echo ""
echo "=========================================="
echo "Test suite completed!"
echo "=========================================="
