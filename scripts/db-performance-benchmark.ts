/**
 * Database Performance Analyzer
 * Validates query performance using pg_stat_statements before/after index creation
 * 
 * Usage:
 * npx tsx scripts/db-performance-benchmark.ts
 */

import * as dbPool from '@/lib/db-pool'

interface QueryStats {
  query: string
  calls: number
  totalTime: number
  meanTime: number
  minTime: number
  maxTime: number
}

const criticalQueries = [
  // /api/questoes - question listing
  'SELECT * FROM question_explanations WHERE question_id = $1',
  'SELECT * FROM question_explanations WHERE question_id IN',
  
  // /api/portal - user dashboard (N+1 vulnerable)
  'SELECT * FROM usuario_respostas WHERE user_id = $1 ORDER BY created_at DESC',
  'SELECT * FROM subscriptions WHERE user_id = $1',
  'SELECT * FROM daily_usage WHERE user_id = $1 AND date = $2',
  
  // /api/checkout - payment processing
  'SELECT * FROM checkout_logs WHERE user_id = $1',
  'SELECT * FROM checkout_logs WHERE user_id = $1 AND status = $2',
  
  // /api/user-rate-limit
  'SELECT explanation_count FROM daily_usage WHERE user_id = $1 AND date = $2',
  
  // /api/admin/audit-logs
  'SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC',
]

/**
 * Get query statistics from pg_stat_statements
 * Requires: extension enabled in Supabase
 */
async function getQueryStats(): Promise<QueryStats[]> {
  try {
    const result = await dbPool.queryAll<QueryStats>(`
      SELECT 
        query,
        calls,
        total_time as "totalTime",
        mean_time as "meanTime",
        min_time as "minTime",
        max_time as "maxTime"
      FROM pg_stat_statements
      WHERE query NOT LIKE 'SELECT%pg_stat_statements%'
      AND query NOT LIKE '%pg_stat_reset%'
      ORDER BY mean_time DESC
      LIMIT 50
    `)
    return result
  } catch (error) {
    console.log('[benchmark] pg_stat_statements not available (extension may not be enabled)')
    return []
  }
}

/**
 * Analyze critical queries and report findings
 */
async function analyzeQueries(): Promise<void> {
  console.log('[benchmark] Starting query analysis...\n')

  const stats = await getQueryStats()
  if (stats.length === 0) {
    console.log('[benchmark] No stats available. Enable pg_stat_statements in Supabase:')
    console.log('[benchmark] 1. Go to Supabase Dashboard > Database > Extensions')
    console.log('[benchmark] 2. Search for "pg_stat_statements" and enable it')
    return
  }

  console.log('Top 10 Slowest Queries:')
  console.log('═'.repeat(100))
  
  stats.slice(0, 10).forEach((stat, idx) => {
    const query = stat.query.substring(0, 70).padEnd(70)
    console.log(
      `${String(idx + 1).padEnd(3)} | ${query} | ${stat.meanTime.toFixed(2)}ms avg | ${stat.calls} calls`
    )
  })

  console.log('\n' + '═'.repeat(100))
  console.log(`\nTotal unique queries: ${stats.length}`)

  // Check for N+1 patterns
  const n1Candidates = stats.filter((s) => s.calls > 50 && s.query.includes('WHERE'))
  if (n1Candidates.length > 0) {
    console.log(`\n⚠️  Potential N+1 patterns detected (${n1Candidates.length} high-frequency filters):`)
    n1Candidates.slice(0, 5).forEach((q) => {
      console.log(`   - ${q.query.substring(0, 60)}... (${q.calls} calls)`)
    })
  }
}

/**
 * Run a set of simulated queries to test index effectiveness
 */
async function simulateQueries(): Promise<void> {
  console.log('\n[benchmark] Running simulated queries...\n')

  const results: Array<{ name: string; duration: number }> = []

  try {
    // Reset metrics for clean benchmark
    dbPool.resetMetrics()

    // Simulate critical query patterns
    const startTime = Date.now()

    // 1. Single explanation lookup
    try {
      await dbPool.queryOne(
        'SELECT explanation FROM question_explanations WHERE question_id = $1 LIMIT 1',
        ['2023-1']
      )
      results.push({
        name: 'Single explanation lookup',
        duration: Date.now() - startTime,
      })
    } catch (e) {
      // Table may not exist in test environment
    }

    // 2. Batch explanation lookup
    try {
      await dbPool.queryAll(
        'SELECT question_id, explanation FROM question_explanations WHERE question_id = ANY($1)',
        [['2023-1', '2023-2', '2023-3']]
      )
      results.push({
        name: 'Batch explanation lookup (3 items)',
        duration: Date.now() - startTime,
      })
    } catch (e) {
      // Table may not exist
    }

    console.log('Query Performance Results:')
    console.log('─'.repeat(50))
    results.forEach((r) => {
      console.log(`${r.name.padEnd(40)} ${r.duration}ms`)
    })

    // Show pool metrics
    const metrics = dbPool.getMetrics()
    console.log('\nConnection Pool Metrics:')
    console.log('─'.repeat(50))
    console.log(`Total queries executed: ${metrics.totalQueries}`)
    console.log(
      `Average query time: ${metrics.avgDurationMs}ms`
    )
    console.log(`Total time: ${metrics.totalDuration}ms`)
  } catch (error) {
    console.error('[benchmark] Error during simulation:', (error as Error).message)
  }
}

/**
 * Compare index usage stats
 */
async function analyzeIndexUsage(): Promise<void> {
  console.log('\n[benchmark] Analyzing index usage...\n')

  try {
    const indexStats = await dbPool.queryAll<{
      schemaname: string
      tablename: string
      indexname: string
      idx_scan: number
      idx_tup_read: number
      idx_tup_fetch: number
    }>(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE indexname LIKE 'idx_%'
      ORDER BY idx_scan DESC
      LIMIT 20
    `)

    if (indexStats.length > 0) {
      console.log('Top Used Indexes:')
      console.log('─'.repeat(80))
      console.log('Index Name'.padEnd(50) + 'Scans'.padEnd(15) + 'Tuples Read')
      console.log('─'.repeat(80))
      
      indexStats.forEach((stat) => {
        console.log(
          `${stat.indexname.padEnd(50)} ${String(stat.idx_scan).padEnd(15)} ${stat.idx_tup_read}`
        )
      })
    } else {
      console.log('[benchmark] No index statistics available yet')
      console.log('[benchmark] Indexes will be analyzed after they are used')
    }
  } catch (error) {
    console.log('[benchmark] Index analysis not available:', (error as Error).message)
  }
}

/**
 * Generate performance report
 */
async function generateReport(): Promise<void> {
  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════════════════╗')
  console.log('║                  DATABASE PERFORMANCE BENCHMARK REPORT                  ║')
  console.log('║                           enem-pro / LIVE                               ║')
  console.log('╚════════════════════════════════════════════════════════════════════════╝')
  console.log('')

  await analyzeQueries()
  await analyzeIndexUsage()
  await simulateQueries()

  console.log('\n' + '═'.repeat(100))
  console.log('\nRECOMMENDATIONS:')
  console.log('─'.repeat(100))
  console.log('1. Ensure all recommended indexes are created (see migration file)')
  console.log('2. Run ANALYZE on tables after index creation for query planner optimization')
  console.log('3. Use connection pooling (db-pool.ts) for all database operations')
  console.log('4. Monitor slow queries regularly with: npm run db:benchmark')
  console.log('5. Consider denormalization for frequently joined tables')
  console.log('')
}

// Main execution
async function main() {
  try {
    await generateReport()
    console.log('\n✅ Benchmark complete. Review results above.')
  } catch (error) {
    console.error('❌ Benchmark failed:', (error as Error).message)
    process.exit(1)
  } finally {
    await dbPool.closePool()
  }
}

main()
