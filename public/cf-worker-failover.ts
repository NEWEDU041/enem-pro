/**
 * Cloudflare Worker: Multi-Region Failover Handler
 * 
 * This worker implements automatic failover based on region health checks.
 * It routes requests to the healthiest region and caches responses appropriately.
 */

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  region: string;
  timestamp: string;
  latency: {
    database: number;
    cache: number;
    external: number;
  };
}

interface RegionConfig {
  url: string;
  weight: number;
  priority: number;
  healthCheckPath: string;
}

// Region configurations
const REGIONS: Record<string, RegionConfig> = {
  'primary-gru': {
    url: 'https://enem-pro-gru.vercel.app',
    weight: 100,
    priority: 1,
    healthCheckPath: '/api/health-check',
  },
  'eu-west': {
    url: 'https://enem-pro-eu.vercel.app',
    weight: 100,
    priority: 2,
    healthCheckPath: '/api/health-check',
  },
  'fallback-iad': {
    url: 'https://enem-pro.vercel.app',
    weight: 50,
    priority: 3,
    healthCheckPath: '/api/health-check',
  },
};

// Health check cache (in-memory for this worker instance)
const healthCache: Map<string, { status: HealthCheckResponse; timestamp: number }> = new Map();
const HEALTH_CHECK_INTERVAL = 30 * 1000; // 30 seconds
const HEALTH_CHECK_TIMEOUT = 5 * 1000; // 5 seconds

async function checkRegionHealth(
  regionKey: string
): Promise<HealthCheckResponse | null> {
  const config = REGIONS[regionKey];
  if (!config) return null;

  const cached = healthCache.get(regionKey);
  if (
    cached &&
    Date.now() - cached.timestamp < HEALTH_CHECK_INTERVAL
  ) {
    return cached.status;
  }

  try {
    const response = await fetch(
      `${config.url}${config.healthCheckPath}`,
      {
        cf: { cacheTtl: 0 },
        signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT),
      }
    );

    if (response.ok) {
      const health: HealthCheckResponse = await response.json();
      healthCache.set(regionKey, {
        status: health,
        timestamp: Date.now(),
      });
      return health;
    }
  } catch (error) {
    console.error(`Health check failed for ${regionKey}:`, error);
  }

  return null;
}

async function getHealthiestRegion(): Promise<string> {
  const healthChecks = await Promise.all(
    Object.keys(REGIONS).map(async (key) => ({
      key,
      health: await checkRegionHealth(key),
    }))
  );

  // Sort by health status and priority
  const sorted = healthChecks.sort((a, b) => {
    // Healthy regions first
    const aStatus = a.health?.status || 'unhealthy';
    const bStatus = b.health?.status || 'unhealthy';
    const statusScore = { healthy: 3, degraded: 2, unhealthy: 1 };

    if (statusScore[aStatus as keyof typeof statusScore] !== 
        statusScore[bStatus as keyof typeof statusScore]) {
      return (statusScore[bStatus as keyof typeof statusScore] || 0) - 
             (statusScore[aStatus as keyof typeof statusScore] || 0);
    }

    // Then by priority
    const aPrio = REGIONS[a.key].priority;
    const bPrio = REGIONS[b.key].priority;
    return aPrio - bPrio;
  });

  return sorted[0]?.key || 'fallback-iad';
}

function getGeolocationRegion(
  request: Request
): string {
  // Use Cloudflare geolocation headers
  const country = request.headers.get('cf-ipcountry');
  
  // Route based on country
  if (
    country &&
    ['BR', 'AR', 'CL', 'CO', 'PE', 'UY'].includes(country)
  ) {
    return 'primary-gru';
  }

  if (
    country &&
    ['DE', 'FR', 'IT', 'ES', 'UK', 'NL', 'BE', 'AT', 'CH', 'SE'].includes(
      country
    )
  ) {
    return 'eu-west';
  }

  return 'fallback-iad';
}

async function routeRequest(
  request: Request,
  regionKey: string
): Promise<Response> {
  const config = REGIONS[regionKey];
  const url = new URL(request.url);
  url.host = new URL(config.url).host;
  url.protocol = 'https:';

  try {
    const response = await fetch(new Request(url, request), {
      cf: {
        cacheTtl: ['/', '/blog'].includes(url.pathname) ? 3600 : -1,
        cacheEverything: url.pathname.startsWith('/assets/'),
      },
    });

    // Add region header for transparency
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-Served-By-Region', regionKey);
    newResponse.headers.set('X-Served-By-Url', config.url);

    // If response is unhealthy, try fallback
    if (response.status >= 500 && regionKey !== 'fallback-iad') {
      return routeRequest(request, 'fallback-iad');
    }

    return newResponse;
  } catch (error) {
    console.error(`Request failed to ${regionKey}:`, error);

    // Fallback to next region
    if (regionKey !== 'fallback-iad') {
      return routeRequest(request, 'fallback-iad');
    }

    return new Response('Service Unavailable', { status: 503 });
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    // Skip certain paths
    const url = new URL(request.url);
    
    // Health checks should go directly to the origin
    if (url.pathname === '/api/health-check') {
      const geoRegion = getGeolocationRegion(request);
      const region = await getHealthiestRegion();
      const selectedRegion = region || geoRegion;
      return routeRequest(request, selectedRegion);
    }

    // For other requests, use geolocation or health-based routing
    const geoRegion = getGeolocationRegion(request);
    const health = await checkRegionHealth(geoRegion);

    // If geo-selected region is healthy, use it
    if (health?.status === 'healthy') {
      return routeRequest(request, geoRegion);
    }

    // Otherwise find healthiest region
    const healthiestRegion = await getHealthiestRegion();
    return routeRequest(request, healthiestRegion);
  },
};
