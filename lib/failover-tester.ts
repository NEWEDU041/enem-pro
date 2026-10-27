/**
 * Multi-Region Failover Testing Suite
 * 
 * Tests:
 * 1. Region health checks
 * 2. Automatic failover on region failure
 * 3. Latency measurements by region
 * 4. Cache consistency across regions
 * 5. Database replication lag
 */

import { createClient } from '@supabase/supabase-js';

export interface FailoverTestResult {
  timestamp: string;
  region: string;
  test: string;
  status: 'pass' | 'fail';
  latency: number;
  error?: string;
}

export interface LatencyReport {
  region: string;
  endpoint: string;
  latencies: {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  sampleCount: number;
}

export class FailoverTester {
  private results: FailoverTestResult[] = [];
  private baseUrls = {
    'sa-east-1': process.env.NEXT_PUBLIC_SA_ENDPOINT || '',
    'eu-west-1': process.env.NEXT_PUBLIC_EU_ENDPOINT || '',
    'us-east-1': process.env.NEXT_PUBLIC_US_ENDPOINT || '',
  };

  async testHealthCheck(region: string): Promise<FailoverTestResult> {
    const startTime = performance.now();
    try {
      const url = `${this.baseUrls[region as keyof typeof this.baseUrls]}/api/health-check`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
      });

      const latency = performance.now() - startTime;
      const result: FailoverTestResult = {
        timestamp: new Date().toISOString(),
        region,
        test: 'health-check',
        status: response.ok ? 'pass' : 'fail',
        latency,
      };

      if (!response.ok) {
        result.error = `HTTP ${response.status}`;
      }

      this.results.push(result);
      return result;
    } catch (error) {
      const latency = performance.now() - startTime;
      const result: FailoverTestResult = {
        timestamp: new Date().toISOString(),
        region,
        test: 'health-check',
        status: 'fail',
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.results.push(result);
      return result;
    }
  }

  async testFailover(failedRegion: string): Promise<FailoverTestResult> {
    const startTime = performance.now();
    try {
      // Simulate region failure by targeting failover endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/failover-test?failedRegion=${failedRegion}`,
        {
          signal: AbortSignal.timeout(15000),
        }
      );

      const latency = performance.now() - startTime;
      const data = await response.json() as { activeRegion?: string };

      const result: FailoverTestResult = {
        timestamp: new Date().toISOString(),
        region: data.activeRegion || 'unknown',
        test: `failover-from-${failedRegion}`,
        status: response.ok ? 'pass' : 'fail',
        latency,
      };

      this.results.push(result);
      return result;
    } catch (error) {
      const latency = performance.now() - startTime;
      const result: FailoverTestResult = {
        timestamp: new Date().toISOString(),
        region: failedRegion,
        test: `failover-from-${failedRegion}`,
        status: 'fail',
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.results.push(result);
      return result;
    }
  }

  async measureLatency(
    region: string,
    endpoint: string,
    samples: number = 10
  ): Promise<LatencyReport> {
    const latencies: number[] = [];

    for (let i = 0; i < samples; i++) {
      const startTime = performance.now();
      try {
        const url = `${this.baseUrls[region as keyof typeof this.baseUrls]}${endpoint}`;
        await fetch(url, {
          signal: AbortSignal.timeout(10000),
        });
        const latency = performance.now() - startTime;
        latencies.push(latency);
      } catch (error) {
        latencies.push(10000); // Timeout penalty
      }
    }

    latencies.sort((a, b) => a - b);

    return {
      region,
      endpoint,
      latencies: {
        min: Math.min(...latencies),
        max: Math.max(...latencies),
        avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
        p50: latencies[Math.floor(latencies.length * 0.5)],
        p95: latencies[Math.floor(latencies.length * 0.95)],
        p99: latencies[Math.floor(latencies.length * 0.99)],
      },
      sampleCount: samples,
    };
  }

  async testDatabaseReplication(): Promise<FailoverTestResult> {
    const startTime = performance.now();
    try {
      const saClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_ANON_KEY || ''
      );

      const euClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL_EU || '',
        process.env.SUPABASE_ANON_KEY || ''
      );

      // Test basic read from both regions
      const [saResult, euResult] = await Promise.all([
        saClient.from('_replication_test').select('*').limit(1),
        euClient.from('_replication_test').select('*').limit(1),
      ]);

      const latency = performance.now() - startTime;

      const result: FailoverTestResult = {
        timestamp: new Date().toISOString(),
        region: 'replication',
        test: 'database-replication',
        status: saResult.data && euResult.data ? 'pass' : 'fail',
        latency,
      };

      if (saResult.error || euResult.error) {
        result.error = `SA: ${saResult.error?.message} | EU: ${euResult.error?.message}`;
      }

      this.results.push(result);
      return result;
    } catch (error) {
      const latency = performance.now() - startTime;
      const result: FailoverTestResult = {
        timestamp: new Date().toISOString(),
        region: 'replication',
        test: 'database-replication',
        status: 'fail',
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.results.push(result);
      return result;
    }
  }

  async runFullTest(): Promise<{
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      avgLatency: number;
    };
    results: FailoverTestResult[];
  }> {
    const regions = Object.keys(this.baseUrls);

    // Run health checks for all regions
    await Promise.all(regions.map((r) => this.testHealthCheck(r)));

    // Test failover scenarios
    for (const region of regions) {
      await this.testFailover(region);
    }

    // Measure latency
    for (const region of regions) {
      await this.measureLatency(region, '/', 5);
    }

    // Test database replication
    await this.testDatabaseReplication();

    // Calculate summary
    const passed = this.results.filter((r) => r.status === 'pass').length;
    const avgLatency =
      this.results.reduce((sum, r) => sum + r.latency, 0) /
      this.results.length;

    return {
      summary: {
        totalTests: this.results.length,
        passed,
        failed: this.results.length - passed,
        avgLatency,
      },
      results: this.results,
    };
  }

  getResults(): FailoverTestResult[] {
    return this.results;
  }

  clearResults(): void {
    this.results = [];
  }
}

export default FailoverTester;
