import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// Custom counters
const failedRequests = new Counter('custom_failed_requests');
const successRequests = new Counter('custom_success_requests');
const customThroughput = new Counter('custom_throughput');

// Test configuration with ramping VUs
export const options = {
  stages: [
    { duration: '2m', target: 10 },    
    { duration: '2m', target: 50 },    
    { duration: '2m', target: 100 },   
    { duration: '3m', target: 200 },   
    { duration: '1m', target: 0 },     
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'http_req_failed': ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:3004';

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
  group('Health Check', function () {
    let response = http.get(BASE_URL + '/api/health');
    let success = check(response, {
      'health status is 200': (r) => r.status === 200,
    });
    if (success) {
      successRequests.add(1);
    } else {
      failedRequests.add(1);
    }
    customThroughput.add(1);
  });

  group('Explicar Endpoint', function () {
    let response = http.post(BASE_URL + '/api/explicar', JSON.stringify(explicitPayload), {
      headers: { 'Content-Type': 'application/json' },
    });
    let success = check(response, {
      'explicar status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'explicar has content': (r) => r.body && r.body.length > 0,
    });
    if (success) {
      successRequests.add(1);
    } else {
      failedRequests.add(1);
    }
    customThroughput.add(1);
  });

  group('Checkout Endpoint', function () {
    let response = http.post(BASE_URL + '/api/checkout', JSON.stringify(checkoutPayload), {
      headers: { 'Content-Type': 'application/json' },
    });
    let success = check(response, {
      'checkout status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    });
    if (success) {
      successRequests.add(1);
    } else {
      failedRequests.add(1);
    }
    customThroughput.add(1);
  });

  sleep(Math.random() * 2 + 1);
}
