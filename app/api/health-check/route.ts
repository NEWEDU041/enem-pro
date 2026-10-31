import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  region: string;
  timestamp: string;
  checks: {
    api: boolean;
    database: boolean;
    cache: boolean;
    external: boolean;
  };
  latency: {
    database: number;
    cache: number;
    external: number;
  };
  version: string;
}

async function checkDatabase(): Promise<{ healthy: boolean; latency: number }> {
  const start = performance.now();
  try {
    // Check Supabase connection
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
      {
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
        signal: AbortSignal.timeout(5000),
      }
    );
    const latency = performance.now() - start;
    return { healthy: response.ok, latency };
  } catch (error) {
    return { healthy: false, latency: performance.now() - start };
  }
}

async function checkCache(): Promise<{ healthy: boolean; latency: number }> {
  const start = performance.now();
  try {
    // Check Redis/KV cache if available
    const response = await fetch('http://localhost:3000/api/cache/ping', {
      signal: AbortSignal.timeout(3000),
    }).catch(() => ({ ok: false }));
    const latency = performance.now() - start;
    return { healthy: response?.ok ?? false, latency };
  } catch (error) {
    return { healthy: false, latency: performance.now() - start };
  }
}

async function checkExternal(): Promise<{ healthy: boolean; latency: number }> {
  const start = performance.now();
  try {
    // Check Google Search Console connectivity
    const response = await fetch('https://www.google.com', {
      signal: AbortSignal.timeout(5000),
    });
    const latency = performance.now() - start;
    return { healthy: response.ok, latency };
  } catch (error) {
    return { healthy: false, latency: performance.now() - start };
  }
}

export async function GET(request: NextRequest) {
  const region = request.headers.get('x-vercel-region') || 'unknown';
  const startTime = performance.now();

  try {
    // Run all checks in parallel
    const [dbCheck, cacheCheck, externalCheck] = await Promise.all([
      checkDatabase(),
      checkCache(),
      checkExternal(),
    ]);

    // Determine overall status
    const allHealthy = dbCheck.healthy && cacheCheck.healthy && externalCheck.healthy;
    const databaseHealthy = dbCheck.healthy;
    const status: HealthCheckResponse['status'] = allHealthy
      ? 'healthy'
      : databaseHealthy
        ? 'degraded'
        : 'unhealthy';

    const response: HealthCheckResponse = {
      status,
      region,
      timestamp: new Date().toISOString(),
      checks: {
        api: true,
        database: dbCheck.healthy,
        cache: cacheCheck.healthy,
        external: externalCheck.healthy,
      },
      latency: {
        database: Math.round(dbCheck.latency),
        cache: Math.round(cacheCheck.latency),
        external: Math.round(externalCheck.latency),
      },
      version: process.env.npm_package_version || '0.0.1',
    };

    const statusCode =
      status === 'healthy' ? 200 : status === 'degraded' ? 503 : 503;

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': status,
        'X-Served-By': region,
      },
    });
  } catch (error) {
    const response: HealthCheckResponse = {
      status: 'unhealthy',
      region,
      timestamp: new Date().toISOString(),
      checks: {
        api: false,
        database: false,
        cache: false,
        external: false,
      },
      latency: {
        database: 0,
        cache: 0,
        external: 0,
      },
      version: process.env.npm_package_version || '0.0.1',
    };

    return NextResponse.json(response, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'unhealthy',
        'X-Served-By': region,
      },
    });
  }
}

export const runtime = 'nodejs';
