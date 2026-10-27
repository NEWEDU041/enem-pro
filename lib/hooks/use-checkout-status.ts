import { useState, useEffect, useCallback } from 'react'

export interface CheckoutStatus {
  jobId: string
  status: 'processing' | 'completed' | 'failed'
  sessionUrl?: string
  stripeSessionId?: string
  error?: string
  timestamp: string
  retries: number
  maxRetries: number
}

export interface UseCheckoutStatusOptions {
  pollIntervalMs?: number
  maxPolls?: number
  onComplete?: (status: CheckoutStatus) => void
  onError?: (error: string) => void
}

export function useCheckoutStatus(
  jobId: string | null,
  options: UseCheckoutStatusOptions = {},
) {
  const {
    pollIntervalMs = 1000, // Poll every 1 second
    maxPolls = 300, // Max 5 minutes of polling
    onComplete,
    onError,
  } = options

  const [status, setStatus] = useState<CheckoutStatus | null>(null)
  const [isPolling, setIsPolling] = useState(!!jobId)
  const [pollCount, setPollCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/checkout/status/${id}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Checkout session not found')
          onError?.('Checkout session not found')
          return null
        }
        throw new Error(`Status check failed: ${response.statusText}`)
      }

      const data: CheckoutStatus = await response.json()
      setStatus(data)
      setError(null)

      if (data.status === 'completed') {
        setIsPolling(false)
        onComplete?.(data)
      } else if (data.status === 'failed') {
        setIsPolling(false)
        setError(data.error || 'Checkout processing failed')
        onError?.(data.error || 'Unknown error')
      }

      return data
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setError(errorMsg)
      onError?.(errorMsg)
      return null
    }
  }, [onComplete, onError])

  useEffect(() => {
    if (!jobId || !isPolling) return

    let pollTimer: NodeJS.Timeout | null = null

    const poll = async () => {
      if (pollCount >= maxPolls) {
        setIsPolling(false)
        setError('Checkout status check timed out after ' + maxPolls + ' attempts')
        return
      }

      await checkStatus(jobId)
      setPollCount((prev) => prev + 1)

      // Schedule next poll
      pollTimer = setTimeout(poll, pollIntervalMs)
    }

    // Start polling immediately
    poll()

    return () => {
      if (pollTimer) clearTimeout(pollTimer)
    }
  }, [jobId, isPolling, pollCount, maxPolls, pollIntervalMs, checkStatus])

  return {
    status,
    isPolling,
    error,
    pollCount,
  }
}
