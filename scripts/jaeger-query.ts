#!/usr/bin/env tsx
/**
 * Jaeger trace query and analysis tool
 * Queries Jaeger API for traces and generates reports
 *
 * Usage:
 *   npx tsx scripts/jaeger-query.ts                    # Summary of all traces
 *   npx tsx scripts/jaeger-query.ts --operation POST%20/api/explicar
 *   npx tsx scripts/jaeger-query.ts --service enem-pro --limit 20
 */

import fetch from 'node-fetch';

const JAEGER_URL = process.env.JAEGER_URL || 'http://localhost:16686';
const SERVICE_NAME = process.env.JAEGER_SERVICE || 'enem-pro';

interface TraceQuery {
  service?: string;
  operation?: string;
  minDuration?: string;
  maxDuration?: string;
  tags?: Record<string, string>;
  limit?: number;
}

async function queryTraces(params: TraceQuery): Promise<void> {
  const searchParams = new URLSearchParams();

  if (params.service) {
    searchParams.append('service', params.service);
  }
  if (params.operation) {
    searchParams.append('operation', params.operation);
  }
  if (params.minDuration) {
    searchParams.append('minDuration', params.minDuration);
  }
  if (params.maxDuration) {
    searchParams.append('maxDuration', params.maxDuration);
  }
  if (params.limit) {
    searchParams.append('limit', params.limit.toString());
  }

  if (params.tags) {
    for (const [key, value] of Object.entries(params.tags)) {
      searchParams.append('tags', JSON.stringify({ [key]: value }));
    }
  }

  console.log(`\nQuerying Jaeger at ${JAEGER_URL}`);
  console.log(`Service: ${params.service || SERVICE_NAME}`);
  if (params.operation) console.log(`Operation: ${params.operation}`);
  console.log(`Limit: ${params.limit || 20}`);
  console.log('');

  try {
    const url = `${JAEGER_URL}/api/traces?${searchParams.toString()}`;
    const response = await fetch(url);
    const data = (await response.json()) as {
      data: Array<{
        traceID: string;
        spans: Array<{
          operationName: string;
          duration: number;
          startTime: number;
          tags?: Array<{ key: string; value: unknown }>;
        }>;
      }>;
      total: number;
    };

    if (!data.data || data.data.length === 0) {
      console.log('No traces found.');
      return;
    }

    console.log(`Found ${data.total} traces\n`);
    console.log('═══════════════════════════════════════════════════════════════');

    for (let i = 0; i < Math.min(10, data.data.length); i++) {
      const trace = data.data[i];
      const rootSpan = trace.spans[0];
      const duration = rootSpan.duration / 1000; // Convert to ms

      console.log(`\nTrace #${i + 1}`);
      console.log(`  ID:        ${trace.traceID}`);
      console.log(`  Operation: ${rootSpan.operationName}`);
      console.log(`  Duration:  ${duration.toFixed(2)}ms`);
      console.log(`  Spans:     ${trace.spans.length}`);

      // Extract useful tags
      if (rootSpan.tags) {
        const tags = new Map<string, unknown>();
        for (const tag of rootSpan.tags) {
          if (tag.key.includes('user') || tag.key.includes('cache') || tag.key.includes('status')) {
            tags.set(tag.key, tag.value);
          }
        }

        if (tags.size > 0) {
          console.log(`  Tags:`);
          for (const [key, value] of tags) {
            console.log(`    - ${key}: ${value}`);
          }
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Summary stats
    const durations = data.data.map((t) => t.spans[0].duration / 1000);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    console.log('Summary Statistics:');
    console.log(`  Total Traces:     ${data.total}`);
    console.log(`  Avg Duration:     ${avgDuration.toFixed(2)}ms`);
    console.log(`  Min Duration:     ${minDuration.toFixed(2)}ms`);
    console.log(`  Max Duration:     ${maxDuration.toFixed(2)}ms`);
  } catch (error) {
    console.error('Error querying Jaeger:', error);
    process.exit(1);
  }
}

async function getServices(): Promise<void> {
  console.log(`\nFetching available services from ${JAEGER_URL}...\n`);

  try {
    const response = await fetch(`${JAEGER_URL}/api/services`);
    const data = (await response.json()) as { data: string[] };

    console.log('Available Services:');
    for (const service of data.data || []) {
      console.log(`  - ${service}`);
    }

    console.log('');
  } catch (error) {
    console.error('Error fetching services:', error);
  }
}

async function getOperations(service: string): Promise<void> {
  console.log(`\nFetching operations for service: ${service}\n`);

  try {
    const response = await fetch(`${JAEGER_URL}/api/services/${service}/operations`);
    const data = (await response.json()) as { data: string[] };

    console.log('Operations:');
    for (const op of data.data || []) {
      console.log(`  - ${op}`);
    }

    console.log('');
  } catch (error) {
    console.error('Error fetching operations:', error);
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
const params: TraceQuery = {
  service: SERVICE_NAME,
  limit: 20,
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--service':
      params.service = args[++i];
      break;
    case '--operation':
      params.operation = args[++i];
      break;
    case '--min-duration':
      params.minDuration = args[++i];
      break;
    case '--limit':
      params.limit = parseInt(args[++i]);
      break;
    case '--services':
      getServices();
      process.exit(0);
    case '--operations':
      if (!params.service) {
        console.error('--service required with --operations');
        process.exit(1);
      }
      getOperations(params.service);
      process.exit(0);
  }
}

queryTraces(params);
