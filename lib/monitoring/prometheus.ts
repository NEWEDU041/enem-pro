/**
 * Prometheus metrics exporter for enem-pro
 * Exposes: latency, error_rate, throughput, cache_hit_rate, db_connections
 */

// In-memory metrics storage (in production, use prom-client library)
export interface MetricsStore {
  // HTTP request metrics
  requestDuration: Map<string, number[]>; // endpoint -> [latencies]
  requestCount: number;
  errorCount: number;
  
  // Cache metrics
  cacheHits: number;
  cacheMisses: number;
  
  // Database metrics
  dbConnectionsActive: number;
  dbConnectionsMax: number;
  dbQueryDuration: number[];
  
  // Custom metrics
  explanationsGenerated: number;
  usersActive: number;
  
  // Timestamps
  startTime: number;
  lastResetTime: number;
}

class PrometheusExporter {
  private store: MetricsStore;
  private readonly maxHistorySize = 1000;

  constructor() {
    this.store = {
      requestDuration: new Map(),
      requestCount: 0,
      errorCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      dbConnectionsActive: 0,
      dbConnectionsMax: 10,
      dbQueryDuration: [],
      explanationsGenerated: 0,
      usersActive: 0,
      startTime: Date.now(),
      lastResetTime: Date.now(),
    };
  }

  /**
   * Record HTTP request
   */
  recordRequest(
    endpoint: string,
    duration: number,
    statusCode: number
  ): void {
    this.store.requestCount++;

    // Track latency per endpoint
    if (!this.store.requestDuration.has(endpoint)) {
      this.store.requestDuration.set(endpoint, []);
    }
    const latencies = this.store.requestDuration.get(endpoint)!;
    latencies.push(duration);
    if (latencies.length > this.maxHistorySize) {
      latencies.shift();
    }

    // Track errors
    if (statusCode >= 400) {
      this.store.errorCount++;
    }
  }

  /**
   * Record cache operation
   */
  recordCacheHit(isHit: boolean): void {
    if (isHit) {
      this.store.cacheHits++;
    } else {
      this.store.cacheMisses++;
    }
  }

  /**
   * Record database query
   */
  recordDbQuery(duration: number, activeConnections: number): void {
    this.store.dbQueryDuration.push(duration);
    if (this.store.dbQueryDuration.length > this.maxHistorySize) {
      this.store.dbQueryDuration.shift();
    }
    this.store.dbConnectionsActive = activeConnections;
  }

  /**
   * Record custom metric
   */
  recordExplanationGenerated(): void {
    this.store.explanationsGenerated++;
  }

  recordActiveUser(count: number): void {
    this.store.usersActive = count;
  }

  recordActiveUsers(count: number): void {
    this.store.usersActive = count;
  }

  /**
   * Calculate percentile (P50, P95, P99)
   */
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Generate Prometheus text format metrics
   */
  generateMetrics(): string {
    const uptime = Date.now() - this.store.startTime;
    const allLatencies: number[] = Array.from(this.store.requestDuration.values()).flat();
    
    const errorRate =
      this.store.requestCount > 0
        ? (this.store.errorCount / this.store.requestCount) * 100
        : 0;
    
    const cacheHitRate =
      this.store.cacheHits + this.store.cacheMisses > 0
        ? (this.store.cacheHits / (this.store.cacheHits + this.store.cacheMisses)) * 100
        : 0;

    const lines: string[] = [];

    // HELP and TYPE declarations
    lines.push('# HELP http_request_duration_seconds HTTP request latency in seconds');
    lines.push('# TYPE http_request_duration_seconds histogram');

    // HTTP request latency (by endpoint)
    this.store.requestDuration.forEach((latencies, endpoint) => {
      const p50 = this.percentile(latencies, 50);
      const p95 = this.percentile(latencies, 95);
      const p99 = this.percentile(latencies, 99);
      const avg = latencies.length > 0 ? latencies.reduce((a, b) => a + b) / latencies.length : 0;

      lines.push(
        `http_request_duration_p50{endpoint="${endpoint}",quantile="0.5"} ${p50}`
      );
      lines.push(
        `http_request_duration_p95{endpoint="${endpoint}",quantile="0.95"} ${p95}`
      );
      lines.push(
        `http_request_duration_p99{endpoint="${endpoint}",quantile="0.99"} ${p99}`
      );
      lines.push(`http_request_duration_avg{endpoint="${endpoint}"} ${avg}`);
    });

    // Overall latency percentiles
    lines.push('# HELP http_request_duration_overall Overall HTTP request latency');
    lines.push('# TYPE http_request_duration_overall gauge');
    lines.push(
      `http_request_duration_overall{quantile="0.5"} ${this.percentile(allLatencies, 50)}`
    );
    lines.push(
      `http_request_duration_overall{quantile="0.95"} ${this.percentile(allLatencies, 95)}`
    );
    lines.push(
      `http_request_duration_overall{quantile="0.99"} ${this.percentile(allLatencies, 99)}`
    );

    // Request count and error metrics
    lines.push('# HELP http_requests_total Total HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    lines.push(`http_requests_total ${this.store.requestCount}`);

    lines.push('# HELP http_errors_total Total HTTP errors');
    lines.push('# TYPE http_errors_total counter');
    lines.push(`http_errors_total ${this.store.errorCount}`);

    lines.push('# HELP http_error_rate HTTP error rate (percentage)');
    lines.push('# TYPE http_error_rate gauge');
    lines.push(`http_error_rate ${errorRate}`);

    // Throughput (requests per second)
    const throughput = uptime > 0 ? this.store.requestCount / (uptime / 1000) : 0;
    lines.push('# HELP http_throughput_rps HTTP throughput (requests per second)');
    lines.push('# TYPE http_throughput_rps gauge');
    lines.push(`http_throughput_rps ${throughput.toFixed(2)}`);

    // Cache metrics
    lines.push('# HELP cache_hits_total Total cache hits');
    lines.push('# TYPE cache_hits_total counter');
    lines.push(`cache_hits_total ${this.store.cacheHits}`);

    lines.push('# HELP cache_misses_total Total cache misses');
    lines.push('# TYPE cache_misses_total counter');
    lines.push(`cache_misses_total ${this.store.cacheMisses}`);

    lines.push('# HELP cache_hit_rate Cache hit rate (percentage)');
    lines.push('# TYPE cache_hit_rate gauge');
    lines.push(`cache_hit_rate ${cacheHitRate}`);

    // Database metrics
    lines.push('# HELP db_connections_active Active database connections');
    lines.push('# TYPE db_connections_active gauge');
    lines.push(`db_connections_active ${this.store.dbConnectionsActive}`);

    lines.push('# HELP db_connections_max Maximum database connections');
    lines.push('# TYPE db_connections_max gauge');
    lines.push(`db_connections_max ${this.store.dbConnectionsMax}`);

    if (this.store.dbQueryDuration.length > 0) {
      const dbP95 = this.percentile(this.store.dbQueryDuration, 95);
      const dbAvg =
        this.store.dbQueryDuration.reduce((a, b) => a + b) /
        this.store.dbQueryDuration.length;

      lines.push(
        '# HELP db_query_duration_avg Average database query duration (milliseconds)'
      );
      lines.push('# TYPE db_query_duration_avg gauge');
      lines.push(`db_query_duration_avg ${dbAvg}`);

      lines.push(
        '# HELP db_query_duration_p95 P95 database query duration (milliseconds)'
      );
      lines.push('# TYPE db_query_duration_p95 gauge');
      lines.push(`db_query_duration_p95 ${dbP95}`);
    }

    // Custom metrics
    lines.push(
      '# HELP explanations_generated_total Total explanations generated'
    );
    lines.push('# TYPE explanations_generated_total counter');
    lines.push(`explanations_generated_total ${this.store.explanationsGenerated}`);

    lines.push('# HELP users_active Active users');
    lines.push('# TYPE users_active gauge');
    lines.push(`users_active ${this.store.usersActive}`);

    // System/uptime metrics
    lines.push('# HELP process_uptime_seconds Process uptime in seconds');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${(uptime / 1000).toFixed(2)}`);

    lines.push('');
    return lines.join('\n');
  }

  /**
   * Get current metrics as JSON (for debugging)
   */
  getMetricsJSON() {
    const allLatencies: number[] = Array.from(this.store.requestDuration.values()).flat();
    const uptime = Date.now() - this.store.startTime;
    
    return {
      uptime_ms: uptime,
      requests: {
        total: this.store.requestCount,
        errors: this.store.errorCount,
        error_rate: this.store.requestCount > 0 ? (this.store.errorCount / this.store.requestCount) * 100 : 0,
        throughput_rps: uptime > 0 ? this.store.requestCount / (uptime / 1000) : 0,
      },
      latency: {
        p50_ms: this.percentile(allLatencies, 50),
        p95_ms: this.percentile(allLatencies, 95),
        p99_ms: this.percentile(allLatencies, 99),
        avg_ms: allLatencies.length > 0 ? allLatencies.reduce((a, b) => a + b) / allLatencies.length : 0,
      },
      cache: {
        hits: this.store.cacheHits,
        misses: this.store.cacheMisses,
        hit_rate: this.store.cacheHits + this.store.cacheMisses > 0 ? (this.store.cacheHits / (this.store.cacheHits + this.store.cacheMisses)) * 100 : 0,
      },
      database: {
        active_connections: this.store.dbConnectionsActive,
        max_connections: this.store.dbConnectionsMax,
      },
      custom: {
        explanations_generated: this.store.explanationsGenerated,
        active_users: this.store.usersActive,
      },
      endpoints: Array.from(this.store.requestDuration.entries()).map(([endpoint, latencies]) => ({
        endpoint,
        requests: latencies.length,
        p50_ms: this.percentile(latencies, 50),
        p95_ms: this.percentile(latencies, 95),
      })),
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset(): void {
    this.store = {
      requestDuration: new Map(),
      requestCount: 0,
      errorCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      dbConnectionsActive: 0,
      dbConnectionsMax: 10,
      dbQueryDuration: [],
      explanationsGenerated: 0,
      usersActive: 0,
      startTime: Date.now(),
      lastResetTime: Date.now(),
    };
  }
}

// Global instance
export const prometheusExporter = new PrometheusExporter();
