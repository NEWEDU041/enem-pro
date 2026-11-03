import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const latency = new Trend('latency');
export const requestCount = new Counter('requests');
export const connections = new Gauge('connections');

// Options: VU ramp 10 → 50 → 100 → 200
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 VUs
    { duration: '2m', target: 50 },   // Ramp up to 50 VUs
    { duration: '2m', target: 100 },  // Ramp up to 100 VUs
    { duration: '2m', target: 200 },  // Ramp up to 200 VUs (breaking point test)
    { duration: '1m', target: 10 },   // Ramp down
    { duration: '1m', target: 0 },    // Final ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],  // P95 < 1s, P99 < 2s
    'http_req_failed': ['rate<0.1'],  // Error rate < 10%
  },
};

export default function () {
  group('Health Check', function () {
    let res = http.get('http://localhost:3000/api/health', {
      headers: {
        'User-Agent': 'k6-load-test/wave-b',
        'Accept': 'application/json',
      },
      timeout: '5s',
    });
    
    // Validate response
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'has content-type': (r) => r.headers['Content-Type'] !== undefined,
    });
    
    errorRate.add(res.status !== 200);
    latency.add(res.timings.duration);
    requestCount.add(1);
    connections.add(1);
  });

  group('API Query', function () {
    let res = http.get('http://localhost:3000/api/data?limit=10', {
      headers: {
        'User-Agent': 'k6-load-test/wave-b',
        'Accept': 'application/json',
      },
      timeout: '10s',
    });
    
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    errorRate.add(res.status !== 200);
    latency.add(res.timings.duration);
    requestCount.add(1);
  });

  sleep(0.5);  // Pause between requests
}
