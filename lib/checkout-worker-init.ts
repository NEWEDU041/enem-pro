/**
 * Checkout Worker Initialization
 *
 * This file ensures the Bull queue worker is started when the application boots.
 * It's dynamically imported in api/health or another startup route.
 *
 * Usage in an API route:
 * ```
 * import { ensureCheckoutWorkerStarted } from '@/lib/checkout-worker-init'
 * await ensureCheckoutWorkerStarted()
 * ```
 */

import { startCheckoutWorker } from '@/lib/checkout-worker'

let workerStarted = false
let workerStartPromise: Promise<void> | null = null

export async function ensureCheckoutWorkerStarted(): Promise<void> {
  if (workerStarted) {
    return
  }

  // Prevent multiple concurrent startup attempts
  if (workerStartPromise) {
    return workerStartPromise
  }

  workerStartPromise = (async () => {
    try {
      console.log('[checkout-worker-init] Starting checkout worker...')
      await startCheckoutWorker()
      workerStarted = true
      console.log('[checkout-worker-init] Checkout worker started successfully')
    } catch (error) {
      console.error('[checkout-worker-init] Failed to start checkout worker:', error)
      // Don't rethrow - allow app to continue even if worker fails to start
      // The queue will be available again on next attempt
    }
  })()

  return workerStartPromise
}

export function isCheckoutWorkerStarted(): boolean {
  return workerStarted
}
