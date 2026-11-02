/**
 * Monitoring Module — Kubernetes-ready Probes
 * 
 * Provides:
 * - Prometheus metrics (/api/metrics)
 * - Readiness probe (/api/ready) — DB connections, dependencies
 * - Liveness probe (/api/live) — service alive
 */

const promClient = require('prom-client')

// Global metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
})

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
})

const dbConnectionPoolSize = new promClient.Gauge({
  name: 'db_connection_pool_size',
  help: 'Current size of database connection pool',
})

const dbConnectionErrors = new promClient.Counter({
  name: 'db_connection_errors_total',
  help: 'Total database connection errors',
  labelNames: ['error_type'],
})

const serviceStartTime = Date.now()

/**
 * Express middleware to track HTTP metrics
 */
function metricsMiddleware() {
  return (req, res, next) => {
    const start = Date.now()
    const originalEnd = res.end

    res.end = function(...args) {
      const duration = (Date.now() - start) / 1000
      const route = req.route?.path || req.path || 'unknown'
      
      httpRequestDuration
        .labels(req.method, route, res.statusCode)
        .observe(duration)
      
      httpRequestTotal
        .labels(req.method, route, res.statusCode)
        .inc()

      originalEnd.apply(res, args)
    }

    next()
  }
}

/**
 * Health check structure for readiness/liveness
 */
async function performChecks(deps = {}) {
  const checks = {
    server: { status: 'ok' },
  }
  let overallStatus = 'ready'

  // Database connectivity check (optional)
  if (deps.dbCheck) {
    try {
      const dbStart = Date.now()
      const result = await deps.dbCheck()
      checks.database = {
        status: result ? 'ok' : 'error',
        latency_ms: Date.now() - dbStart,
      }
      if (!result) overallStatus = 'not-ready'
    } catch (err) {
      checks.database = {
        status: 'error',
        error: err.message,
      }
      overallStatus = 'not-ready'
      dbConnectionErrors.labels('check_error').inc()
    }
  }

  // External service checks (optional)
  if (deps.externalChecks) {
    for (const [name, checkFn] of Object.entries(deps.externalChecks)) {
      try {
        const start = Date.now()
        const result = await checkFn()
        checks[name] = {
          status: result ? 'ok' : 'warning',
          latency_ms: Date.now() - start,
        }
        if (!result) overallStatus = 'degraded'
      } catch (err) {
        checks[name] = {
          status: 'error',
          error: err.message,
        }
        overallStatus = 'not-ready'
      }
    }
  }

  return { overallStatus, checks }
}

/**
 * Metrics endpoint handler
 */
async function handleMetrics(req, res) {
  try {
    const metrics = await promClient.register.metrics()
    res.set('Content-Type', promClient.register.contentType)
    res.send(metrics)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

/**
 * Readiness probe handler
 * Returns 200 if service is ready to receive traffic
 */
async function handleReadiness(req, res, deps = {}) {
  const { overallStatus, checks } = await performChecks(deps)
  const statusCode = overallStatus === 'ready' ? 200 : 503
  
  res.status(statusCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    uptime_ms: Date.now() - serviceStartTime,
  })
}

/**
 * Liveness probe handler
 * Returns 200 if service is alive (lightweight check)
 */
async function handleLiveness(req, res) {
  const uptime = Date.now() - serviceStartTime
  
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime_ms: uptime,
    version: process.env.APP_VERSION || '0.0.0',
  })
}

module.exports = {
  metricsMiddleware,
  handleMetrics,
  handleReadiness,
  handleLiveness,
  performChecks,
  httpRequestDuration,
  httpRequestTotal,
  dbConnectionPoolSize,
  dbConnectionErrors,
}
