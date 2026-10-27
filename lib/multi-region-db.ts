/**
 * Multi-Region Database Configuration
 * 
 * This file configures Supabase read replicas for eu-west-1 and sa-east-1
 * with automatic failover and connection pooling.
 */

export interface RegionConfig {
  region: string;
  name: string;
  supabaseUrl: string;
  priority: number;
  capabilities: {
    read: boolean;
    write: boolean;
    queryCache: boolean;
  };
}

export const REGION_CONFIGS: RegionConfig[] = [
  {
    region: 'sa-east-1',
    name: 'São Paulo (Primary)',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    priority: 1,
    capabilities: {
      read: true,
      write: true,
      queryCache: true,
    },
  },
  {
    region: 'eu-west-1',
    name: 'Frankfurt (Read Replica)',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_EU || '',
    priority: 2,
    capabilities: {
      read: true,
      write: false,
      queryCache: true,
    },
  },
  {
    region: 'us-east-1',
    name: 'US East (Fallback)',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_US || '',
    priority: 3,
    capabilities: {
      read: true,
      write: false,
      queryCache: false,
    },
  },
];

export interface ConnectionPoolConfig {
  maxConnections: number;
  idleTimeout: number;
  acquireTimeout: number;
  reapInterval: number;
}

export const CONNECTION_POOL_CONFIG: ConnectionPoolConfig = {
  maxConnections: 20,
  idleTimeout: 300000, // 5 minutes
  acquireTimeout: 5000, // 5 seconds
  reapInterval: 60000, // 1 minute
};

export interface ReplicationMetrics {
  region: string;
  replicationLag: number; // milliseconds
  lastUpdate: Date;
  bytesReplicated: number;
  transactionsApplied: number;
  status: 'synced' | 'syncing' | 'behind' | 'failed';
}

/**
 * Determines the best region for a given operation
 */
export function selectRegion(
  operation: 'read' | 'write',
  userRegion?: string
): RegionConfig {
  if (operation === 'write') {
    // All writes go to primary
    return REGION_CONFIGS[0];
  }

  // For reads, prefer local region if available
  if (userRegion) {
    const local = REGION_CONFIGS.find((r) => r.region === userRegion);
    if (local?.capabilities.read) {
      return local;
    }
  }

  // Otherwise use first available read replica
  const readable = REGION_CONFIGS.filter((r) => r.capabilities.read);
  return readable[0] || REGION_CONFIGS[0];
}

/**
 * Circuit breaker pattern for region failover
 */
export class RegionCircuitBreaker {
  private failureCount: Map<string, number> = new Map();
  private lastFailure: Map<string, number> = new Map();
  private threshold = 5;
  private timeout = 60000; // 1 minute

  isOpen(region: string): boolean {
    const failures = this.failureCount.get(region) || 0;
    if (failures >= this.threshold) {
      const lastFail = this.lastFailure.get(region) || 0;
      if (Date.now() - lastFail < this.timeout) {
        return true;
      }
      // Reset after timeout
      this.failureCount.set(region, 0);
    }
    return false;
  }

  recordFailure(region: string): void {
    const current = this.failureCount.get(region) || 0;
    this.failureCount.set(region, current + 1);
    this.lastFailure.set(region, Date.now());
  }

  recordSuccess(region: string): void {
    this.failureCount.set(region, 0);
  }
}

/**
 * Replication lag monitor
 */
export class ReplicationLagMonitor {
  private lags: Map<string, ReplicationMetrics> = new Map();

  async checkLag(region: string): Promise<ReplicationMetrics> {
    // In production, query the actual pg_stat_replication view
    // This is a placeholder implementation
    const cached = this.lags.get(region);
    if (
      cached &&
      Date.now() - cached.lastUpdate.getTime() < 30000
    ) {
      return cached;
    }

    const metrics: ReplicationMetrics = {
      region,
      replicationLag: Math.random() * 100, // ms
      lastUpdate: new Date(),
      bytesReplicated: 0,
      transactionsApplied: 0,
      status: 'synced',
    };

    this.lags.set(region, metrics);
    return metrics;
  }

  getMetrics(region: string): ReplicationMetrics | undefined {
    return this.lags.get(region);
  }

  getAllMetrics(): ReplicationMetrics[] {
    return Array.from(this.lags.values());
  }
}

// Singleton instances
export const regionCircuitBreaker = new RegionCircuitBreaker();
export const replicationLagMonitor = new ReplicationLagMonitor();

export default {
  REGION_CONFIGS,
  CONNECTION_POOL_CONFIG,
  selectRegion,
  regionCircuitBreaker,
  replicationLagMonitor,
};
