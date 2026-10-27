#!/usr/bin/env tsx

/**
 * Cache Invalidation Helper Script
 * 
 * Invalidate cache entries via /api/admin/invalidate-cache endpoint
 * 
 * Usage:
 * - Single: npm run cache:invalidate -- single --id "2023-1"
 * - Batch: npm run cache:invalidate -- batch --ids "2023-1,2023-2,2023-3"
 * - All: npm run cache:invalidate -- all
 * - Metrics: npm run cache:invalidate -- metrics
 */

async function invalidateCache() {
  const args = process.argv.slice(2)
  const mode = args[0] || 'metrics'
  const apiUrl = process.env.API_URL || 'http://localhost:3000'
  const adminToken = process.env.ADMIN_TOKEN || ''

  if (!adminToken && mode !== 'metrics') {
    console.error('❌ Missing ADMIN_TOKEN environment variable')
    process.exit(1)
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`
  }

  try {
    if (mode === 'metrics' || args.length === 0) {
      // Get metrics
      console.log('📊 Fetching cache metrics...\n')
      const res = await fetch(`${apiUrl}/api/admin/invalidate-cache`, {
        method: 'GET',
        headers,
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      console.log('Cache Metrics:')
      console.log(JSON.stringify(data, null, 2))
    } else if (mode === 'single') {
      // Single invalidation
      const idIndex = args.indexOf('--id')
      if (idIndex === -1) {
        console.error('❌ Missing --id argument')
        process.exit(1)
      }
      const id = args[idIndex + 1]

      console.log(`🗑️  Invalidating single cache entry: ${id}\n`)
      const res = await fetch(`${apiUrl}/api/admin/invalidate-cache`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: 'single', type: 'explanation', id }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      console.log('Result:')
      console.log(JSON.stringify(data, null, 2))
    } else if (mode === 'batch') {
      // Batch invalidation
      const idsIndex = args.indexOf('--ids')
      if (idsIndex === -1) {
        console.error('❌ Missing --ids argument')
        process.exit(1)
      }
      const ids = args[idsIndex + 1].split(',').map((id) => id.trim())

      console.log(`🗑️  Invalidating ${ids.length} cache entries\n`)
      const res = await fetch(`${apiUrl}/api/admin/invalidate-cache`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: 'batch', type: 'explanation', ids }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      console.log('Result:')
      console.log(JSON.stringify(data, null, 2))
    } else if (mode === 'all') {
      // Invalidate all
      console.log('🗑️  Invalidating ALL explanation cache entries\n')
      const res = await fetch(`${apiUrl}/api/admin/invalidate-cache`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: 'all' }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      console.log('Result:')
      console.log(JSON.stringify(data, null, 2))
    } else {
      console.error(`❌ Unknown mode: ${mode}`)
      console.error('\nUsage:')
      console.error('  npm run cache:invalidate -- metrics')
      console.error('  npm run cache:invalidate -- single --id "2023-1"')
      console.error('  npm run cache:invalidate -- batch --ids "2023-1,2023-2"')
      console.error('  npm run cache:invalidate -- all')
      process.exit(1)
    }

    console.log('\n✨ Done!\n')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

invalidateCache()
