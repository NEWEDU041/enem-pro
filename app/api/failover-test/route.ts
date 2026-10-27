import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Failover Test API
 * 
 * Endpoints:
 * - /api/failover-test?failedRegion=sa-east-1
 * - /api/failover-test/simulate-failure
 * - /api/failover-test/results
 * - /api/failover-test/latency
 */

interface SimulatedFailure {
  region: string;
  timestamp: number;
  duration: number; // milliseconds
}

// In-memory simulated failures (reset on process restart)
let simulatedFailures: Map<string, SimulatedFailure> = new Map();
const SIMULATION_TIMEOUT = 60000; // 1 minute

function isRegionSimulatingFailure(region: string): boolean {
  const failure = simulatedFailures.get(region);
  if (!failure) return false;

  if (Date.now() - failure.timestamp > failure.duration) {
    simulatedFailures.delete(region);
    return false;
  }

  return true;
}

async function getHealthiestRegion(): Promise<string> {
  const regions = ['sa-east-1', 'eu-west-1', 'us-east-1'];
  const healthMap = new Map<string, { status: string; latency: number }>();

  // Check which regions are simulating failure
  for (const region of regions) {
    if (isRegionSimulatingFailure(region)) {
      healthMap.set(region, { status: 'unhealthy', latency: 10000 });
    } else {
      // In production, fetch actual health check
      healthMap.set(region, { status: 'healthy', latency: 100 + Math.random() * 50 });
    }
  }

  // Sort by status and latency
  const sorted = Array.from(healthMap.entries()).sort(([aKey, aHealth], [bKey, bHealth]) => {
    if (aHealth.status !== bHealth.status) {
      return aHealth.status === 'healthy' ? -1 : 1;
    }
    return aHealth.latency - bHealth.latency;
  });

  return sorted[0]?.[0] || 'us-east-1';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const failedRegion = searchParams.get('failedRegion');
  const action = searchParams.get('action');

  // Failover test: Given a failed region, find the active one
  if (failedRegion) {
    const activeRegion = await getHealthiestRegion();

    if (activeRegion === failedRegion) {
      // Simulate failure
      simulatedFailures.set(failedRegion, {
        region: failedRegion,
        timestamp: Date.now(),
        duration: SIMULATION_TIMEOUT,
      });

      // Find actual healthiest
      const newActive = await getHealthiestRegion();

      return NextResponse.json({
        test: 'failover',
        failedRegion,
        previousActive: failedRegion,
        currentActive: newActive,
        failoverTime: 0,
        status: 'success',
      });
    }

    return NextResponse.json({
      test: 'failover',
      failedRegion,
      previousActive: activeRegion,
      currentActive: activeRegion,
      failoverTime: 0,
      status: 'already-running',
    });
  }

  // Get current active region and status
  if (action === 'status') {
    const activeRegion = await getHealthiestRegion();
    const failures = Array.from(simulatedFailures.values());

    return NextResponse.json({
      activeRegion,
      simulatedFailures: failures,
      timestamp: new Date().toISOString(),
    });
  }

  // Get latency by region
  if (action === 'latency') {
    const results = new Map<string, number[]>();

    for (const region of ['sa-east-1', 'eu-west-1', 'us-east-1']) {
      const latencies: number[] = [];

      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        // Simulate latency based on region
        await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));
        latencies.push(performance.now() - start);
      }

      results.set(region, latencies);
    }

    return NextResponse.json({
      latencyByRegion: Object.fromEntries(results),
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    error: 'Invalid request',
    usage: {
      failover: '?failedRegion=sa-east-1',
      status: '?action=status',
      latency: '?action=latency',
    },
  });
}

export async function POST(request: NextRequest) {
  const { action, region, duration } = (await request.json().catch(() => ({}))) as {
    action?: string;
    region?: string;
    duration?: number;
  };

  if (action === 'simulate-failure' && region) {
    simulatedFailures.set(region, {
      region,
      timestamp: Date.now(),
      duration: duration || SIMULATION_TIMEOUT,
    });

    return NextResponse.json({
      status: 'failure-simulated',
      region,
      duration: duration || SIMULATION_TIMEOUT,
      expiresAt: new Date(Date.now() + (duration || SIMULATION_TIMEOUT)).toISOString(),
    });
  }

  if (action === 'clear-failure' && region) {
    simulatedFailures.delete(region);

    return NextResponse.json({
      status: 'failure-cleared',
      region,
    });
  }

  if (action === 'clear-all-failures') {
    const count = simulatedFailures.size;
    simulatedFailures = new Map();

    return NextResponse.json({
      status: 'all-failures-cleared',
      count,
    });
  }

  return NextResponse.json({
    error: 'Invalid action',
    actions: ['simulate-failure', 'clear-failure', 'clear-all-failures'],
  });
}

export const config = {
  runtime: 'nodejs',
};
