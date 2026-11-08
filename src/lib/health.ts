// Health check endpoints for enem-pro
// Kubernetes-style health probes: /health, /ready, /live

export const healthResponse = {
  status: 'ok',
  timestamp: new Date().toISOString(),
  service: 'enem-pro',
  version: '1.0.0',
  uptime: process.uptime ? process.uptime() : null,
};

export const readinessResponse = {
  ready: true,
  database: 'connected',
  cache: 'available',
  dependencies: {
    nextjs: 'ready',
    api: 'responding',
  },
};

export const livenessResponse = {
  alive: true,
  timestamp: new Date().toISOString(),
};

// Health check handler for Next.js API route
export async function handleHealthCheck(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return res.status(200).json({
      ...healthResponse,
      checks: {
        memory: process.memoryUsage ? Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB' : 'N/A',
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Health check failed' });
  }
}

export async function handleReadinessCheck(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Add real dependency checks here (database, cache, etc.)
    return res.status(200).json(readinessResponse);
  } catch (error) {
    return res.status(503).json({ ready: false, error: 'Service not ready' });
  }
}

export async function handleLivenessCheck(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return res.status(200).json(livenessResponse);
  } catch (error) {
    return res.status(500).json({ alive: false });
  }
}
