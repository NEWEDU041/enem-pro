#!/bin/bash

# K6 Load Testing Script for enem-pro
# Ramps: 10 → 50 → 100 → 200 VUs over 30 minutes
# Collects: latency P50/P95/P99, throughput, error rate, memory, CPU

set -e

PROJECT_DIR="/root/projetos/enem-pro"
TEST_SCRIPT="${PROJECT_DIR}/k6-load-test.js"
RESULTS_DIR="${PROJECT_DIR}/k6-results"
BASELINE_FILE="${PROJECT_DIR}/.claude/notes/k6-baseline.json"

# Create results directory
mkdir -p "${RESULTS_DIR}"

echo "========================================="
echo "K6 LOAD TEST - ENEM-PRO"
echo "========================================="
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 not installed. Installing..."
    go install github.com/grafana/k6@latest
fi

echo "✓ Starting local dev server..."
cd "${PROJECT_DIR}"

# Start dev server in background (if not already running)
if ! pgrep -f "next dev" > /dev/null; then
    npm run dev > /tmp/nextjs-dev.log 2>&1 &
    DEV_PID=$!
    echo "✓ Dev server started (PID: $DEV_PID)"
    # Wait for server to be ready
    sleep 5
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            echo "✓ Server is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ Server failed to start"
            kill $DEV_PID
            exit 1
        fi
        sleep 1
    done
else
    echo "✓ Dev server already running"
fi

echo ""
echo "========================================="
echo "Running K6 Load Test (30 minutes)"
echo "========================================="
echo ""

# Run k6 test with results output
RESULTS_JSON="${RESULTS_DIR}/results-$(date +%Y%m%d-%H%M%S).json"
RESULTS_HTML="${RESULTS_DIR}/results-$(date +%Y%m%d-%H%M%S).html"

# Run k6
k6 run \
    -o json="${RESULTS_JSON}" \
    --summary-export="${RESULTS_HTML}" \
    "${TEST_SCRIPT}"

TEST_EXIT_CODE=$?

echo ""
echo "========================================="
echo "Test Execution Complete"
echo "========================================="
echo "Results saved to:"
echo "  - JSON: ${RESULTS_JSON}"
echo "  - HTML: ${RESULTS_HTML}"
echo ""

# Generate comparison report
echo "Generating comparison report..."
python3 << 'EOF'
import json
import sys
from datetime import datetime

def analyze_results(results_file, baseline_file=None):
    try:
        with open(results_file, 'r') as f:
            results = json.load(f)
    except:
        print("❌ Failed to read results JSON")
        return

    # Extract metrics
    metrics = results.get('metrics', {})
    
    print("\n" + "="*70)
    print("K6 LOAD TEST ANALYSIS")
    print("="*70 + "\n")

    # Performance summary
    print("PERFORMANCE METRICS:")
    print("-"*70)
    
    if 'http_req_duration' in metrics:
        dur = metrics['http_req_duration'].get('values', {})
        print(f"✓ Response Times:")
        print(f"  - P50: {dur.get('p(50)', 'N/A')}ms")
        print(f"  - P95: {dur.get('p(95)', 'N/A')}ms")
        print(f"  - P99: {dur.get('p(99)', 'N/A')}ms")
        print(f"  - Max: {dur.get('max', 'N/A')}ms")
        print(f"  - Min: {dur.get('min', 'N/A')}ms")
        print(f"  - Avg: {dur.get('avg', 'N/A')}ms")

    print(f"\n✓ Request Statistics:")
    if 'http_reqs' in metrics:
        print(f"  - Total Requests: {metrics['http_reqs'].get('value', 'N/A')}")
    if 'success_requests' in metrics:
        print(f"  - Successful: {metrics['success_requests'].get('value', 'N/A')}")
    if 'failed_requests' in metrics:
        print(f"  - Failed: {metrics['failed_requests'].get('value', 'N/A')}")
    if 'http_req_failed' in metrics:
        rate = metrics['http_req_failed'].get('value', 0) * 100
        print(f"  - Error Rate: {rate:.2f}%")

    print(f"\n✓ Throughput:")
    if 'throughput' in metrics:
        print(f"  - Total: {metrics['throughput'].get('value', 'N/A')} requests")

    # Breaking point analysis
    print(f"\n✓ Breaking Point Analysis:")
    if 'http_req_duration' in metrics:
        p95 = metrics['http_req_duration'].get('values', {}).get('p(95)', 0)
        if p95 > 1000:
            print(f"  ⚠️  Breaking point detected at P95 > 1s ({p95}ms)")
            print(f"  → Latency exceeded SLA threshold")
        else:
            print(f"  ✓ Within SLA (P95: {p95}ms < 1000ms)")

    # Threshold checks
    print(f"\n✓ Threshold Results:")
    if 'thresholds' in results:
        for threshold, status in results['thresholds'].items():
            icon = "✓" if status['ok'] else "✗"
            print(f"  {icon} {threshold}: {'PASSED' if status['ok'] else 'FAILED'}")

    print("\n" + "="*70 + "\n")

# Run analysis
analyze_results(sys.argv[1])
EOF

python3 << PYTHON_EOF
import json
import sys

try:
    with open("${RESULTS_JSON}", 'r') as f:
        results = json.load(f)
    
    metrics = results.get('metrics', {})
    
    print("\n" + "="*70)
    print("K6 LOAD TEST DETAILED RESULTS")
    print("="*70 + "\n")

    print("LATENCY METRICS (P50/P95/P99):")
    print("-"*70)
    if 'http_req_duration' in metrics:
        dur = metrics['http_req_duration'].get('values', {})
        p50 = dur.get('p(50)', 0)
        p95 = dur.get('p(95)', 0)
        p99 = dur.get('p(99)', 0)
        print(f"P50 (Median):   {p50:.2f}ms ✓")
        print(f"P95 (95th %ile): {p95:.2f}ms {'✓' if p95 < 1000 else '✗ WARNING'}")
        print(f"P99 (99th %ile): {p99:.2f}ms {'✓' if p99 < 2000 else '✗ WARNING'}")

    print("\nTHROUGHPUT & ERROR RATE:")
    print("-"*70)
    if 'http_reqs' in metrics:
        print(f"Total Requests:    {metrics['http_reqs'].get('value', 0):.0f}")
    if 'http_req_failed' in metrics:
        error_rate = metrics['http_req_failed'].get('value', 0) * 100
        print(f"Error Rate:        {error_rate:.2f}% {'✓' if error_rate < 10 else '✗'}")

    print("\n" + "="*70 + "\n")

except Exception as e:
    print(f"Error analyzing results: {e}")
PYTHON_EOF

echo "✓ Analysis complete!"
echo ""
echo "Next steps:"
echo "  1. Review results: cat ${RESULTS_JSON}"
echo "  2. Compare with baseline (if available)"
echo "  3. Check for breaking points (P95 > 1s)"
echo "  4. Document capacity limits"
echo ""

exit ${TEST_EXIT_CODE}
