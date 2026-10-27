#!/usr/bin/env node
/**
 * K6 Load Test Runner - Simplified Load Tester
 * Simulates K6 behavior with realistic HTTP load testing
 */

const http = require('http');
const { URL } = require('url');

// BASELINE COMPARISON (before optimization)
const BASELINE = {
  p50: 534,      // ms
  p95: 2331,     // ms (was threshold target)
  p99: 4852,     // ms
  errorRate: 0.08, // 8%
  throughput: 4.2,  // req/s
  breakingPoint: 3,  // VUs
  breakingErrorRate: 0.65 // 65% error rate at breaking point
};

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Metrics collection
const metrics = {
  requests: 0,
  errors: 0,
  durations: [],
  breakingPoint: null,
  stageResults: {},
  startTime: Date.now(),
  errorsByStage: {}
};

const payloads = {
  explicar: {
    pergunta: 'O que é fotossíntese?',
    contexto: 'Biologia',
    nivel: 'ensino-medio'
  },
  checkout: {
    userId: `test-user-${Math.random().toString(36).substr(2, 9)}`,
    plano: 'premium-anual',
    email: `test-${Math.random().toString(36).substr(2, 5)}@example.com`
  }
};

const endpoints = [
  { method: 'GET', path: '/api/health', name: 'health' },
  { method: 'POST', path: '/api/explicar', name: 'explicar', payload: payloads.explicar },
  { method: 'POST', path: '/api/checkout', name: 'checkout', payload: payloads.checkout }
];

/**
 * Make HTTP request with timeout
 */
function makeRequest(method, path, payload = null) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = new URL(path, BASE_URL);
    
    const options = {
      method: method,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'k6-runner/1.0',
        'Connection': 'keep-alive'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          duration,
          success: res.statusCode >= 200 && res.statusCode < 300,
          body: data
        });
      });
    });

    req.on('error', () => {
      const duration = Date.now() - startTime;
      resolve({ statusCode: 0, duration, success: false, body: '' });
    });

    req.on('timeout', () => {
      req.destroy();
      const duration = Date.now() - startTime;
      resolve({ statusCode: 0, duration, success: false, body: '' });
    });

    if (payload) {
      req.write(JSON.stringify(payload));
    }
    req.end();
  });
}

/**
 * Simulate VU execution
 */
async function simulateVU(vuNumber, stageName) {
  try {
    for (const endpoint of endpoints) {
      const response = await makeRequest(
        endpoint.method,
        endpoint.path,
        endpoint.payload
      );

      metrics.requests++;
      metrics.durations.push(response.duration);

      if (!response.success) {
        metrics.errors++;
        if (!metrics.errorsByStage[stageName]) {
          metrics.errorsByStage[stageName] = 0;
        }
        metrics.errorsByStage[stageName]++;
      }

      // Sleep 1-3 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    }
  } catch (e) {
    metrics.errors += 3;
    metrics.requests += 3;
  }
}

/**
 * Run load test stage with ramping
 */
async function runStage(stageIndex, targetVUs, durationSeconds) {
  const stageName = `${targetVUs}VU`;
  console.log(`\n[Stage ${stageIndex + 1}/${4}] Ramping to ${targetVUs} VUs (${durationSeconds}s)...`);
  
  const stageStartTime = Date.now();
  const stageDurationMs = durationSeconds * 1000;
  const promises = [];
  let activeVUs = 0;
  let reportInterval;

  return new Promise((resolve) => {
    const rampUpInterval = setInterval(() => {
      const elapsed = Date.now() - stageStartTime;
      const targetActiveVUs = Math.min(
        Math.floor((targetVUs * elapsed) / stageDurationMs),
        targetVUs
      );

      // Spawn new VUs
      while (activeVUs < targetActiveVUs) {
        promises.push(simulateVU(activeVUs, stageName).catch(() => {}));
        activeVUs++;
      }

      // Report progress every 30 seconds
      if (!reportInterval) {
        reportInterval = setInterval(() => {
          const errorRate = metrics.requests > 0 ? metrics.errors / metrics.requests : 0;
          console.log(`  ${stageName}: ${metrics.requests} requests, ${metrics.errors} errors (${(errorRate * 100).toFixed(1)}% error rate)`);
          
          // Check breaking point (error rate > 50%)
          if (metrics.requests > 20 && errorRate > 0.5 && !metrics.breakingPoint) {
            metrics.breakingPoint = { vus: targetVUs, errorRate };
            console.log(`  ⚠️  BREAKING POINT DETECTED: ${targetVUs}VU (${(errorRate * 100).toFixed(1)}% errors)`);
          }
        }, 30000);
      }

      if (elapsed >= stageDurationMs) {
        clearInterval(rampUpInterval);
        clearInterval(reportInterval);
        console.log(`  ✓ Ramping complete. Active VUs: ${activeVUs}`);
        
        // Wait for remaining requests to complete
        Promise.all(promises).then(() => {
          const stageErrorRate = metrics.errorsByStage[stageName] ? 
            (metrics.errorsByStage[stageName] / (endpoints.length * activeVUs)) : 0;
          
          metrics.stageResults[stageName] = {
            vus: targetVUs,
            activeVUs,
            requests: metrics.requests,
            errors: metrics.errors,
            errorRate: metrics.errors / Math.max(metrics.requests, 1)
          };
          
          console.log(`  ✓ Stage completed. Total requests: ${metrics.requests}`);
          resolve();
        });
      }
    }, 500);
  });
}

/**
 * Calculate percentiles
 */
function getPercentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = arr.sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Generate comparative report
 */
function generateReport() {
  const p50 = getPercentile(metrics.durations, 50);
  const p95 = getPercentile(metrics.durations, 95);
  const p99 = getPercentile(metrics.durations, 99);
  const errorRate = metrics.requests > 0 ? metrics.errors / metrics.requests : 0;
  const totalTime = (Date.now() - metrics.startTime) / 1000;
  const throughput = metrics.requests / totalTime;

  // Calculate improvements vs baseline
  const improvements = {
    p50Improvement: ((BASELINE.p50 - p50) / BASELINE.p50 * 100).toFixed(1),
    p95Improvement: ((BASELINE.p95 - p95) / BASELINE.p95 * 100).toFixed(1),
    p99Improvement: ((BASELINE.p99 - p99) / BASELINE.p99 * 100).toFixed(1),
    errorRateImprovement: ((BASELINE.errorRate - errorRate) / BASELINE.errorRate * 100).toFixed(1),
    throughputImprovement: ((throughput - BASELINE.throughput) / BASELINE.throughput * 100).toFixed(1)
  };

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalRequests: metrics.requests,
      successfulRequests: metrics.requests - metrics.errors,
      failedRequests: metrics.errors,
      errorRate: (errorRate * 100).toFixed(2) + '%',
      throughput: throughput.toFixed(2) + ' req/s',
      totalDuration: totalTime.toFixed(2) + 's',
      breakingPoint: metrics.breakingPoint
    },
    latency: {
      p50: { value: p50.toFixed(2), unit: 'ms', threshold: '< 500ms' },
      p95: { value: p95.toFixed(2), unit: 'ms', threshold: '< 1000ms' },
      p99: { value: p99.toFixed(2), unit: 'ms', threshold: '< 2000ms' },
      min: Math.min(...metrics.durations).toFixed(2) + 'ms',
      max: Math.max(...metrics.durations).toFixed(2) + 'ms',
      avg: (metrics.durations.reduce((a, b) => a + b, 0) / metrics.durations.length).toFixed(2) + 'ms'
    },
    thresholdValidation: {
      p95_under_1s: p95 < 1000 ? '✓ PASS' : '✗ FAIL',
      error_under_5pct: errorRate < 0.05 ? '✓ PASS' : '✗ FAIL',
      throughput_over_10rps: throughput > 10 ? '✓ PASS' : '✗ FAIL'
    },
    baseline: {
      p50: BASELINE.p50 + 'ms',
      p95: BASELINE.p95 + 'ms (before optimization)',
      p99: BASELINE.p99 + 'ms',
      errorRate: (BASELINE.errorRate * 100).toFixed(2) + '%',
      throughput: BASELINE.throughput + ' req/s',
      breakingPoint: BASELINE.breakingPoint + ' VUs'
    },
    improvements: improvements,
    errorsByStage: metrics.errorsByStage,
    stageResults: metrics.stageResults
  };

  return report;
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(80));
  console.log('K6 LOAD TEST RUNNER - ENEM-PRO (Post-Optimization)');
  console.log('='.repeat(80));
  console.log(`Target: ${BASE_URL}`);
  console.log(`Stages: 10VU → 50VU → 100VU → 200VU (ramping)`);
  console.log(`\nBaseline (before optimization):`);
  console.log(`  P95: ${BASELINE.p95}ms | Error Rate: ${(BASELINE.errorRate*100).toFixed(1)}% | Breaking Point: ${BASELINE.breakingPoint}VU`);
  console.log('');

  // Health check
  console.log('Checking server connectivity...');
  try {
    const healthCheck = await makeRequest('GET', '/api/health');
    if (healthCheck.statusCode === 0) {
      console.warn('⚠️  Server may be down, continuing with test (simulating degraded service)');
    } else {
      console.log('✓ Server is responding\n');
    }
  } catch (e) {
    console.warn('⚠️  Connection warning:', e.message);
  }

  // Run stages with shorter duration for faster execution
  const stages = [
    { vus: 10, duration: 30 },   // 30s per stage instead of 5m for demo
    { vus: 50, duration: 30 },
    { vus: 100, duration: 30 },
    { vus: 200, duration: 30 }
  ];

  for (let i = 0; i < stages.length; i++) {
    await runStage(i, stages[i].vus, stages[i].duration);
    if (metrics.breakingPoint) {
      console.log('\n⚠️  Breaking point reached. Stopping test.');
      break;
    }
  }

  // Generate report
  const report = generateReport();

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('LOAD TEST RESULTS - POST OPTIMIZATION');
  console.log('='.repeat(80));
  console.log(`\n📊 LATENCY METRICS:`);
  console.log(`  P50: ${report.latency.p50.value}ms (threshold: ${report.latency.p50.threshold})`);
  console.log(`  P95: ${report.latency.p95.value}ms (threshold: ${report.latency.p95.threshold}) ${report.thresholdValidation.p95_under_1s}`);
  console.log(`  P99: ${report.latency.p99.value}ms (threshold: ${report.latency.p99.threshold})`);
  console.log(`  Avg: ${report.latency.avg}`);
  console.log(`  Min/Max: ${report.latency.min} / ${report.latency.max}`);
  
  console.log(`\n🚀 THROUGHPUT:`);
  console.log(`  ${report.summary.throughput} (threshold: > 10 req/s) ${report.thresholdValidation.throughput_over_10rps}`);
  console.log(`  Total Requests: ${report.summary.totalRequests}`);
  
  console.log(`\n❌ ERROR ANALYSIS:`);
  console.log(`  ${report.summary.errorRate} (threshold: < 5%) ${report.thresholdValidation.error_under_5pct}`);
  console.log(`  Failed Requests: ${report.summary.failedRequests}`);
  
  if (report.summary.breakingPoint) {
    console.log(`\n⚠️  BREAKING POINT: ${report.summary.breakingPoint.vus}VU (${(report.summary.breakingPoint.errorRate * 100).toFixed(1)}% error rate)`);
    console.log(`  Improvement vs baseline (${BASELINE.breakingPoint}VU): ${((report.summary.breakingPoint.vus - BASELINE.breakingPoint) / BASELINE.breakingPoint * 100).toFixed(1)}%`);
  }
  
  console.log(`\n📈 IMPROVEMENT VS BASELINE:`);
  console.log(`  P50: ${report.improvements.p50Improvement > 0 ? '+' : ''}${report.improvements.p50Improvement}%`);
  console.log(`  P95: ${report.improvements.p95Improvement > 0 ? '+' : ''}${report.improvements.p95Improvement}%`);
  console.log(`  P99: ${report.improvements.p99Improvement > 0 ? '+' : ''}${report.improvements.p99Improvement}%`);
  console.log(`  Error Rate: ${report.improvements.errorRateImprovement > 0 ? '+' : ''}${report.improvements.errorRateImprovement}%`);
  console.log(`  Throughput: ${report.improvements.throughputImprovement > 0 ? '+' : ''}${report.improvements.throughputImprovement}%`);

  console.log('\n' + '='.repeat(80));

  // Save JSON report
  const fs = require('fs');
  const reportPath = '/root/projetos/enem-pro/k6-results-post-optimization.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✓ Results saved to ${reportPath}`);

  // Save baseline comparison CSV
  const csvPath = '/root/projetos/enem-pro/k6-comparison.csv';
  const csvData = `Metric,Baseline,Post-Optimization,Improvement\n` +
    `P50 (ms),${BASELINE.p50},${report.latency.p50.value},${report.improvements.p50Improvement}%\n` +
    `P95 (ms),${BASELINE.p95},${report.latency.p95.value},${report.improvements.p95Improvement}%\n` +
    `P99 (ms),${BASELINE.p99},${report.latency.p99.value},${report.improvements.p99Improvement}%\n` +
    `Error Rate (%),${(BASELINE.errorRate*100).toFixed(2)},${report.summary.errorRate},${report.improvements.errorRateImprovement}%\n` +
    `Throughput (req/s),${BASELINE.throughput},${report.summary.throughput.replace(' req/s', '')},${report.improvements.throughputImprovement}%\n` +
    `Breaking Point (VUs),${BASELINE.breakingPoint},${report.summary.breakingPoint ? report.summary.breakingPoint.vus : 'N/A'},${report.summary.breakingPoint ? ((report.summary.breakingPoint.vus - BASELINE.breakingPoint) / BASELINE.breakingPoint * 100).toFixed(1) + '%' : 'N/A'}`;
  
  fs.writeFileSync(csvPath, csvData);
  console.log(`✓ Comparison saved to ${csvPath}`);

  process.exit(0);
}

main().catch(e => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});
