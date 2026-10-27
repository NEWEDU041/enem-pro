#!/usr/bin/env npx ts-node
/**
 * Multi-Region Deployment Status & Test Runner
 * 
 * Usage:
 *   npm run test:multi-region
 *   ts-node scripts/test-multi-region.ts
 */

interface DeploymentStatus {
  project: string;
  timestamp: string;
  regions: {
    [region: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
      latency: number;
      lastCheck: string;
      errors: string[];
    };
  };
  cache: {
    hitRatio: number;
    totalRequests: number;
    cachedRequests: number;
  };
  database: {
    primaryRegion: string;
    replicaRegions: string[];
    replicationLag: Record<string, number>; // ms
  };
  failover: {
    testsPassed: number;
    testsFailed: number;
    averageFailoverTime: number; // ms
  };
}

const ENDPOINTS = {
  'sa-east-1': process.env.NEXT_PUBLIC_SA_ENDPOINT || 'https://enem-pro.vercel.app',
  'eu-west-1': process.env.NEXT_PUBLIC_EU_ENDPOINT || 'https://enem-pro-eu.vercel.app',
  'us-east-1': process.env.NEXT_PUBLIC_US_ENDPOINT || 'https://enem-pro.vercel.app',
};

async function checkRegionHealth(
  region: string,
  endpoint: string
): Promise<DeploymentStatus['regions'][string]> {
  const startTime = performance.now();
  const errors: string[] = [];

  try {
    const response = await fetch(`${endpoint}/api/health-check`, {
      signal: AbortSignal.timeout(10000),
    });

    const latency = performance.now() - startTime;

    if (response.ok) {
      const data = (await response.json()) as { status: string };
      return {
        status: data.status || 'healthy',
        latency: Math.round(latency),
        lastCheck: new Date().toISOString(),
        errors: [],
      };
    } else {
      return {
        status: 'unhealthy',
        latency: Math.round(latency),
        lastCheck: new Date().toISOString(),
        errors: [`HTTP ${response.status}`],
      };
    }
  } catch (error) {
    const latency = performance.now() - startTime;
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return {
      status: 'unhealthy',
      latency: Math.round(latency),
      lastCheck: new Date().toISOString(),
      errors,
    };
  }
}

async function testFailover(): Promise<{ testsPassed: number; testsFailed: number; avgTime: number }> {
  let testsPassed = 0;
  let testsFailed = 0;
  const times: number[] = [];

  for (const [region, endpoint] of Object.entries(ENDPOINTS)) {
    const startTime = performance.now();
    try {
      const response = await fetch(`${endpoint}/api/failover-test?failedRegion=${region}`, {
        signal: AbortSignal.timeout(15000),
      });

      const time = performance.now() - startTime;
      times.push(time);

      if (response.ok) {
        testsPassed++;
        console.log(`✓ Failover test for ${region}: PASS (${time.toFixed(0)}ms)`);
      } else {
        testsFailed++;
        console.log(`✗ Failover test for ${region}: FAIL (HTTP ${response.status})`);
      }
    } catch (error) {
      testsFailed++;
      const time = performance.now() - startTime;
      times.push(time);
      console.log(`✗ Failover test for ${region}: ERROR (${time.toFixed(0)}ms)`);
    }
  }

  return {
    testsPassed,
    testsFailed,
    avgTime: times.reduce((a, b) => a + b, 0) / times.length,
  };
}

async function runDeploymentCheck() {
  console.log('🔍 Multi-Region Deployment Status Check');
  console.log('═'.repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  const status: DeploymentStatus = {
    project: 'enem-pro',
    timestamp: new Date().toISOString(),
    regions: {},
    cache: {
      hitRatio: 0,
      totalRequests: 0,
      cachedRequests: 0,
    },
    database: {
      primaryRegion: 'sa-east-1',
      replicaRegions: ['eu-west-1'],
      replicationLag: {},
    },
    failover: {
      testsPassed: 0,
      testsFailed: 0,
      averageFailoverTime: 0,
    },
  };

  // 1. Check all regions
  console.log('📍 Checking Region Health...');
  for (const [region, endpoint] of Object.entries(ENDPOINTS)) {
    const health = await checkRegionHealth(region, endpoint);
    status.regions[region] = health;
    const icon = health.status === 'healthy' ? '✓' : '✗';
    console.log(`  ${icon} ${region}: ${health.status} (${health.latency}ms)`);
  }
  console.log('');

  // 2. Test failover
  console.log('🔄 Testing Failover...');
  const failoverResults = await testFailover();
  status.failover = {
    testsPassed: failoverResults.testsPassed,
    testsFailed: failoverResults.testsFailed,
    averageFailoverTime: failoverResults.avgTime,
  };
  console.log('');

  // 3. Summary
  console.log('📊 Summary');
  console.log('═'.repeat(60));
  const healthyRegions = Object.entries(status.regions)
    .filter(([, h]) => h.status === 'healthy')
    .length;

  console.log(`Healthy Regions: ${healthyRegions}/${Object.keys(ENDPOINTS).length}`);
  console.log(`Failover Tests: ${failoverResults.testsPassed}/${failoverResults.testsPassed + failoverResults.testsFailed} passed`);
  console.log(`Average Failover Time: ${failoverResults.avgTime.toFixed(0)}ms`);
  console.log('');

  // 4. Latency Report
  console.log('⏱️  Latency Report');
  console.log('─'.repeat(60));
  const latencies = Object.entries(status.regions)
    .map(([region, health]) => ({
      region,
      latency: health.latency,
    }))
    .sort((a, b) => a.latency - b.latency);

  latencies.forEach(({ region, latency }) => {
    const bar = '█'.repeat(Math.round(latency / 10));
    console.log(`${region.padEnd(15)} ${latency.toString().padEnd(4)}ms ${bar}`);
  });
  console.log('');

  // 5. Export JSON
  const jsonPath = 'deployment-status.json';
  console.log(`💾 Deployment status saved to ${jsonPath}`);
  require('fs').writeFileSync(jsonPath, JSON.stringify(status, null, 2));

  // 6. Generate Report
  const reportPath = 'DEPLOYMENT_REPORT.md';
  generateReport(status, reportPath);
  console.log(`📄 Report saved to ${reportPath}`);

  return status;
}

function generateReport(status: DeploymentStatus, filePath: string) {
  const healthyCount = Object.values(status.regions).filter(
    (r) => r.status === 'healthy'
  ).length;
  const totalRegions = Object.keys(status.regions).length;

  const content = `# Multi-Region Deployment Report

**Generated:** ${status.timestamp}  
**Project:** ${status.project}

## Overview

- **Healthy Regions:** ${healthyCount}/${totalRegions}
- **Failover Tests Passed:** ${status.failover.testsPassed}/${status.failover.testsPassed + status.failover.testsFailed}
- **Average Failover Time:** ${status.failover.averageFailoverTime.toFixed(0)}ms

## Region Status

| Region | Status | Latency | Last Check |
|--------|--------|---------|------------|
${Object.entries(status.regions)
  .map(
    ([region, health]) =>
      `| ${region} | ${health.status} | ${health.latency}ms | ${health.lastCheck} |`
  )
  .join('\n')}

## Database

- **Primary:** ${status.database.primaryRegion}
- **Replicas:** ${status.database.replicaRegions.join(', ')}
- **Replication Lag:** ${JSON.stringify(status.database.replicationLag)}

## Recommendations

${
  healthyCount < totalRegions
    ? `⚠️ **Warning:** Not all regions are healthy. Check the Vercel logs for failures.`
    : `✅ **Healthy:** All regions operational.`
}

${
  status.failover.averageFailoverTime > 5000
    ? `⚠️ **Warning:** Failover time exceeds SLO (5s target). Investigate circuit breaker logic.`
    : `✅ **Good:** Failover within SLO.`
}

## Next Steps

1. Review region-specific errors
2. Check Supabase replication status
3. Verify Cloudflare Worker deployment
4. Monitor cache hit ratio over 24h
5. Schedule capacity planning review

---
Generated by Multi-Region Deployment Monitor
`;

  require('fs').writeFileSync(filePath, content);
}

// Run check
runDeploymentCheck().catch(console.error);
