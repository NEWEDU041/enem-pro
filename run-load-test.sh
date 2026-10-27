#!/bin/bash

# Main K6 Load Test Runner for ENEM-PRO
set -e

PROJECT_DIR="/root/projetos/enem-pro"
MOCK_SERVER="${PROJECT_DIR}/mock-server.js"
K6_SIMULATOR="${PROJECT_DIR}/k6-simulator.py"
RESULTS_DIR="${PROJECT_DIR}/k6-results"

mkdir -p "${RESULTS_DIR}"

echo ""
echo "========================================="
echo "K6 LOAD TEST - ENEM-PRO"
echo "========================================="
echo ""

# Kill any existing processes on port 3000
echo "Cleaning up previous processes on port 3000..."
lsof -i :3000 2>/dev/null | awk 'NR!=1 {print $2}' | xargs kill -9 2>/dev/null || true
sleep 2

# Start mock server
echo "Starting mock server..."
node "${MOCK_SERVER}" > /tmp/mock-server.log 2>&1 &
MOCK_PID=$!

# Wait for server
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✓ Mock server ready (PID: $MOCK_PID)"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Server failed to start"
        kill $MOCK_PID 2>/dev/null
        cat /tmp/mock-server.log
        exit 1
    fi
    sleep 1
done

echo ""
echo "Running K6 simulator (30 minutes test)..."
echo "Ramping: 10 → 50 → 100 → 200 VUs"
echo ""

# Run k6 simulator
python3 "${K6_SIMULATOR}" k6-load-test.js --base-url http://localhost:3000 --duration 2

# Capture exit code
K6_EXIT=$?

# Kill mock server
echo ""
echo "Stopping mock server..."
kill $MOCK_PID 2>/dev/null || true
wait $MOCK_PID 2>/dev/null || true

# List results
echo ""
echo "Test complete! Results saved to:"
ls -lh "${RESULTS_DIR}/results-"*.json 2>/dev/null | tail -1 || echo "No results found"

exit ${K6_EXIT}
