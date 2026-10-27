#!/bin/bash

# K6 Load Test Runner - ENEM-PRO
# Testa endpoints críticos com ramping VUs

set -e

PROJECT_DIR="/root/projetos/enem-pro"
RESULTS_DIR="${PROJECT_DIR}/k6-results"
MOCK_SERVER="${PROJECT_DIR}/mock-server.js"
K6_SCRIPT="${PROJECT_DIR}/k6-load-test.js"

mkdir -p "${RESULTS_DIR}"

echo ""
echo "========================================="
echo "K6 LOAD TEST - ENEM-PRO"
echo "Ramping: 10 → 50 → 100 → 200 VUs (30 min)"
echo "========================================="
echo ""

# Kill any existing Node processes
echo "Cleaning up previous processes..."
lsof -i :3000 2>/dev/null | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
sleep 2

# Start mock server
echo "Starting mock server on port 3000..."
node "${MOCK_SERVER}" > /tmp/mock-server.log 2>&1 &
MOCK_PID=$!
echo "✓ Mock server started (PID: $MOCK_PID)"

# Wait for server to be ready
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✓ Server is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Server failed to start"
        kill $MOCK_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

echo ""
echo "Running K6 load test..."
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 not found. Installing..."
    go install github.com/grafana/k6@latest
    export PATH="${PATH}:$(go env GOPATH)/bin"
fi

# Run k6
RESULTS_JSON="${RESULTS_DIR}/results-$(date +%Y%m%d-%H%M%S).json"

k6 run \
    -o json="${RESULTS_JSON}" \
    --summary-export="${RESULTS_DIR}/summary.html" \
    "${K6_SCRIPT}"

K6_EXIT=$?

echo ""
echo "========================================="
echo "K6 Test Complete"
echo "========================================="
echo ""

# Kill mock server
kill $MOCK_PID 2>/dev/null
wait $MOCK_PID 2>/dev/null || true
echo "✓ Mock server stopped"

# Analyze results
echo ""
echo "Analyzing results from: ${RESULTS_JSON}"
echo ""

python3 << 'PYEOF'
import json
import sys

try:
    results_file = sys.argv[1] if len(sys.argv) > 1 else None
    if not results_file:
        print("No results file provided")
        sys.exit(1)
    
    with open(results_file, 'r') as f:
        data = json.load(f)
    
    metrics = data.get('metrics', {})
    
    print("="*70)
    print("K6 LOAD TEST RESULTS - ENEM-PRO")
    print("="*70)
    print()
    
    # Latency metrics
    print("LATENCY METRICS (P50/P95/P99):")
    print("-"*70)
    if 'http_req_duration' in metrics:
        dur_data = metrics['http_req_duration']
        vals = dur_data.get('values', {})
        samples = dur_data.get('samples', 0) or 0
        
        p50 = vals.get('p(50)', 0)
        p95 = vals.get('p(95)', 0)
        p99 = vals.get('p(99)', 0)
        
        print(f"P50 (Median):       {p50:.2f}ms ✓")
        print(f"P95 (95th %ile):    {p95:.2f}ms {'✓' if p95 < 1000 else '✗ WARNING: > 1000ms'}")
        print(f"P99 (99th %ile):    {p99:.2f}ms {'✓' if p99 < 2000 else '✗ WARNING: > 2000ms'}")
        print(f"Min:                {vals.get('min', 0):.2f}ms")
        print(f"Max:                {vals.get('max', 0):.2f}ms")
        print(f"Avg:                {vals.get('avg', 0):.2f}ms")
        print(f"Samples:            {samples}")
    
    # Request statistics
    print()
    print("REQUEST STATISTICS:")
    print("-"*70)
    if 'http_reqs' in metrics:
        total_reqs = metrics['http_reqs'].get('value', 0)
        print(f"Total Requests:     {total_reqs:.0f}")
    
    if 'http_req_failed' in metrics:
        error_rate = metrics['http_req_failed'].get('value', 0) * 100
        print(f"Error Rate:         {error_rate:.2f}% {'✓' if error_rate < 10 else '✗'}")
    
    if 'success_requests' in metrics:
        print(f"Successful:         {metrics['success_requests'].get('value', 0):.0f}")
    
    if 'failed_requests' in metrics:
        print(f"Failed:             {metrics['failed_requests'].get('value', 0):.0f}")
    
    # Throughput
    print()
    print("THROUGHPUT:")
    print("-"*70)
    if 'throughput' in metrics:
        print(f"Total Requests:     {metrics['throughput'].get('value', 0):.0f}")
    
    # Breaking point detection
    print()
    print("BREAKING POINT ANALYSIS:")
    print("-"*70)
    if 'http_req_duration' in metrics:
        p95 = metrics['http_req_duration'].get('values', {}).get('p(95)', 0)
        if p95 > 1000:
            print(f"⚠️  BREAKING POINT DETECTED")
            print(f"P95 Latency: {p95:.2f}ms > 1000ms (SLA threshold)")
            print(f"→ Service degradation at this load level")
        else:
            print(f"✓ Within SLA (P95: {p95:.2f}ms < 1000ms)")
    
    # VU analysis
    print()
    print("LOAD PROFILE:")
    print("-"*70)
    # Estimate VU breakdown from metrics
    if 'vus' in metrics:
        print(f"Peak VUs:           {metrics['vus'].get('value', 0):.0f}")
    if 'vus_max' in metrics:
        print(f"Max VUs Reached:    {metrics['vus_max'].get('value', 0):.0f}")
    
    # Thresholds
    print()
    print("THRESHOLD CHECKS:")
    print("-"*70)
    if 'thresholds' in data:
        passed = 0
        failed = 0
        for threshold_name, threshold_result in data['thresholds'].items():
            ok = threshold_result.get('ok', False)
            passed_count = threshold_result.get('passed', 0)
            failed_count = threshold_result.get('failed', 0)
            
            status = '✓ PASSED' if ok else '✗ FAILED'
            print(f"{status}: {threshold_name}")
            if failed_count:
                failed += 1
            else:
                passed += 1
    
    print()
    print("="*70)
    print(f"Analysis Complete")
    print("="*70)
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

PYEOF

echo ""
echo "Results saved to: ${RESULTS_JSON}"
echo ""
echo "Recommendations:"
echo "  1. Review P95 latency (should be < 1000ms)"
echo "  2. Check error rate (should be < 10%)"
echo "  3. Identify breaking point from response times"
echo "  4. Document capacity limits based on results"
echo ""

exit ${K6_EXIT}
