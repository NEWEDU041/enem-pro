import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const explicitRate = new Rate('explicit');
const latencyP50 = new Trend('latency_p50', { percentiles: [0.5] });
const latencyP95 = new Trend('latency_p95', { percentiles: [0.95] });
const latencyP99 = new Trend('latency_p99', { percentiles: [0.99] });
const httpDuration = new Trend('http_req_duration');
const failedRequests = new Counter('failed_requests');
const successRequests = new Counter('success_requests');
const throughput = new Counter('throughput');
const activevus = new Gauge('active_vus');

// Test configuration with ramping VUs - QUICK VERSION (10m total)
export const options = {
  stages: [
    { duration: '2m', target: 10 },    // Ramp to 10 VUs
    { duration: '2m', target: 50 },    // Ramp to 50 VUs
    { duration: '2m', target: 100 },   // Ramp to 100 VUs
    { duration: '3m', target: 200 },   // Ramp to 200 VUs
    { duration: '1m', target: 0 },     // Ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'http_req_failed': ['rate<0.05'],
    'errors': ['rate<0.05'],
  },
};

const BASE_URL = `http://localhost:3004`;
const HEALTH_ENDPOINT = '/api/health';
const EXPLICAR_ENDPOINT = '/api/explicar';
const CHECKOUT_ENDPOINT = '/api/checkout';

const explicitPayload = {
  pergunta: 'O que é fotossíntese?',
  contexto: 'Biologia',
  nivel: 'ensino-medio'
};

const checkoutPayload = {
  userId: 'test-user-' + Math.random(),
  plano: 'premium-anual',
  email: 'test@example.com'
};

export default function () {
  activevus.add(__VU);

  group('Health Check', function () {
    let response = http.get(BASE_URL + HEALTH_ENDPOINT);
    let success = check(response, {
      'health status is 200': (r) => r.status === 200,
      'health response time < 100ms': (r) => r.timings.duration < 100,
    });
    if (success) {
      successRequests.add(1);
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }
    httpDuration.add(response.timings.duration);
    latencyP50.add(response.timings.duration);
    latencyP95.add(response.timings.duration);
    latencyP99.add(response.timings.duration);
    throughput.add(1);
  });

  group('Explicar Endpoint', function () {
    let response = http.post(BASE_URL + EXPLICAR_ENDPOINT, JSON.stringify(explicitPayload), {
      headers: { 'Content-Type': 'application/json' },
    });
    let success = check(response, {
      'explicar status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'explicar has content': (r) => r.body && r.body.length > 0,
      'explicar response time < 2s': (r) => r.timings.duration < 2000,
    });
    if (success) {
      successRequests.add(1);
      explicitRate.add(1);
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }
    httpDuration.add(response.timings.duration);
    latencyP50.add(response.timings.duration);
    latencyP95.add(response.timings.duration);
    latencyP99.add(response.timings.duration);
    throughput.add(1);
  });

  group('Checkout Endpoint', function () {
    let response = http.post(BASE_URL + CHECKOUT_ENDPOINT, JSON.stringify(checkoutPayload), {
      headers: { 'Content-Type': 'application/json' },
    });
    let success = check(response, {
      'checkout status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'checkout response time < 3s': (r) => r.timings.duration < 3000,
    });
    if (success) {
      successRequests.add(1);
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }
    httpDuration.add(response.timings.duration);
    latencyP50.add(response.timings.duration);
    latencyP95.add(response.timings.duration);
    latencyP99.add(response.timings.duration);
    throughput.add(1);
  });

  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data),
  };
}

function textSummary(data) {
  const lines = [];
  lines.push('\n' + '='.repeat(70));
  lines.push('K6 LOAD TEST SUMMARY - ENEM-PRO (PÓS-FIX)');
  lines.push('='.repeat(70) + '\n');
  
  if (data.metrics) {
    lines.push('PERFORMANCE METRICS:');
    lines.push('-'.repeat(70));
    
    const metrics = data.metrics;
    if (metrics.http_req_duration) {
      const vals = metrics.http_req_duration.values;
      const p50 = vals['p(50)'] ? vals['p(50)'].toFixed(2) : 'N/A';
      const p95 = vals['p(95)'] ? vals['p(95)'].toFixed(2) : 'N/A';
      const p99 = vals['p(99)'] ? vals['p(99)'].toFixed(2) : 'N/A';
      lines.push('P50: ' + p50 + 'ms, P95: ' + p95 + 'ms, P99: ' + p99 + 'ms');
    }
    if (metrics.http_req_failed) {
      lines.push('Error Rate: ' + (metrics.http_req_failed.value * 100).toFixed(2) + '%');
    }
    if (metrics.success_requests) {
      lines.push('Success Requests: ' + metrics.success_requests.value);
    }
    if (metrics.failed_requests) {
      lines.push('Failed Requests: ' + metrics.failed_requests.value);
    }
    if (metrics.throughput) {
      lines.push('Throughput: ' + metrics.throughput.value + ' requests');
    }
  }
  lines.push('');
  lines.push('='.repeat(70));
  return lines.join('\n');
}
