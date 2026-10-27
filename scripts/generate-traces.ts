#!/usr/bin/env tsx
/**
 * Load test generator for tracing verification
 * Generates realistic traffic across /api/explicar, /api/checkout, and /api/portal
 *
 * Usage: npx tsx scripts/generate-traces.ts
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '5');
const DURATION_SECONDS = parseInt(process.env.DURATION || '30');
const VERBOSE = process.env.VERBOSE === 'true';

interface TestConfig {
  endpoint: string;
  method: string;
  body: Record<string, unknown>;
  weight: number; // Probability weight (0-1)
  description: string;
}

const TEST_CONFIGS: TestConfig[] = [
  {
    endpoint: '/api/explicar',
    method: 'POST',
    body: {
      question_id: `2023-${Math.floor(Math.random() * 180)}`,
      selected_alternative: String.fromCharCode(65 + Math.floor(Math.random() * 5)),
    },
    weight: 0.5,
    description: 'Explanation lookup (cache hit expected)',
  },
  {
    endpoint: '/api/checkout',
    method: 'POST',
    body: {
      plan: Math.random() > 0.5 ? 'monthly' : 'annual',
    },
    weight: 0.2,
    description: 'Checkout initiation',
  },
  {
    endpoint: '/api/portal',
    method: 'POST',
    body: {},
    weight: 0.15,
    description: 'Billing portal access',
  },
  {
    endpoint: '/api/subscribe',
    method: 'POST',
    body: {
      email: `test${Math.floor(Math.random() * 10000)}@example.com`,
    },
    weight: 0.15,
    description: 'Newsletter subscription',
  },
];

interface Result {
  endpoint: string;
  statusCode: number;
  duration: number;
  success: boolean;
  error?: string;
}

const results: Result[] = [];
let requestCount = 0;

async function makeRequest(config: TestConfig): Promise<Result> {
  const startTime = performance.now();
  requestCount++;

  try {
    const response = await fetch(`${BASE_URL}${config.endpoint}`, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        // Mock auth header (actual auth would come from session)
        'Authorization': `Bearer test_token_${Math.random()}`,
      },
      body: JSON.stringify(config.body),
    });

    const duration = Math.round(performance.now() - startTime);
    const result: Result = {
      endpoint: config.endpoint,
      statusCode: response.status,
      duration,
      success: response.status < 400,
    };

    if (VERBOSE) {
      const icon = result.success ? '✓' : '✗';
      console.log(
        `[${new Date().toISOString()}] ${icon} ${config.method} ${config.endpoint} ${response.status} (${duration}ms) - ${config.description}`
      );
    }

    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    const result: Result = {
      endpoint: config.endpoint,
      statusCode: 0,
      duration,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };

    if (VERBOSE) {
      console.error(
        `[${new Date().toISOString()}] ✗ ${config.method} ${config.endpoint} ERROR (${duration}ms) - ${result.error}`
      );
    }

    return result;
  }
}

function selectRandomConfig(): TestConfig {
  const rand = Math.random();
  let cumulative = 0;

  for (const config of TEST_CONFIGS) {
    cumulative += config.weight;
    if (rand <= cumulative) {
      return config;
    }
  }

  return TEST_CONFIGS[TEST_CONFIGS.length - 1];
}

async function runWorker(workerId: number): Promise<void> {
  const endTime = Date.now() + DURATION_SECONDS * 1000;

  while (Date.now() < endTime) {
    const config = selectRandomConfig();
    const result = await makeRequest(config);
    results.push(result);

    // Random delay between 100-500ms
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 400));
  }
}

async function main(): Promise<void> {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          Load Test Generator for Tracing Verification       ║
╚════════════════════════════════════════════════════════════╝

Configuration:
  Base URL:        ${BASE_URL}
  Concurrency:     ${CONCURRENCY} workers
  Duration:        ${DURATION_SECONDS} seconds
  Endpoints:       ${TEST_CONFIGS.map((c) => c.endpoint).join(', ')}

Endpoint Weights:
${TEST_CONFIGS.map((c) => `  ${c.endpoint.padEnd(15)} ${(c.weight * 100).toFixed(0).padStart(3)}%`).join('\n')}

Starting test... (${new Date().toISOString()})
  `);

  const testStartTime = Date.now();

  // Run workers concurrently
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => runWorker(i)));

  const testDuration = (Date.now() - testStartTime) / 1000;

  // Aggregate results
  const successCount = results.filter((r) => r.success).length;
  const errorCount = results.filter((r) => !r.success).length;
  const avgDuration = Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length);
  const minDuration = Math.min(...results.map((r) => r.duration));
  const maxDuration = Math.max(...results.map((r) => r.duration));

  // By endpoint
  const byEndpoint = new Map<string, { success: number; error: number; durations: number[] }>();
  for (const result of results) {
    if (!byEndpoint.has(result.endpoint)) {
      byEndpoint.set(result.endpoint, { success: 0, error: 0, durations: [] });
    }
    const stats = byEndpoint.get(result.endpoint)!;
    if (result.success) {
      stats.success++;
    } else {
      stats.error++;
    }
    stats.durations.push(result.duration);
  }

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                        Test Results                         ║
╚════════════════════════════════════════════════════════════╝

Summary:
  Total Requests:   ${requestCount}
  Successful:       ${successCount} (${((successCount / requestCount) * 100).toFixed(1)}%)
  Failed:           ${errorCount} (${((errorCount / requestCount) * 100).toFixed(1)}%)
  Duration:         ${testDuration.toFixed(1)}s
  Throughput:       ${(requestCount / testDuration).toFixed(1)} req/s

Latency (all endpoints):
  Min:              ${minDuration}ms
  Avg:              ${avgDuration}ms
  Max:              ${maxDuration}ms

By Endpoint:
`);

  for (const [endpoint, stats] of byEndpoint) {
    const avgEndpointDuration = Math.round(
      stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length
    );
    const maxEndpointDuration = Math.max(...stats.durations);
    const successRate = ((stats.success / (stats.success + stats.error)) * 100).toFixed(1);

    console.log(`
  ${endpoint}
    Requests:       ${stats.success + stats.error}
    Success Rate:   ${successRate}%
    Avg Latency:    ${avgEndpointDuration}ms
    Max Latency:    ${maxEndpointDuration}ms
    `);
  }

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                  View Traces in Jaeger                      ║
╚════════════════════════════════════════════════════════════╝

  → Open: http://localhost:16686
  → Service: enem-pro
  → Operation: Choose endpoint above
  → Min Duration: Set to analyze slow requests

Test completed at ${new Date().toISOString()}
  `);
}

main().catch((error) => {
  console.error('Load test failed:', error);
  process.exit(1);
});
