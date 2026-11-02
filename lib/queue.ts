import Queue, { Job, QueueOptions } from 'bull'
import Redis from 'ioredis'

// Redis client singleton
let redisClient: Redis | null = null

export interface QueueJobData {
  [key: string]: any
}

export interface QueueJobResult {
  jobId: string
  status: 'processing' | 'completed' | 'failed'
  result?: any
  error?: string
  timestamp: string
  retries: number
  maxRetries: number
}

/**
 * Get or create a Redis client
 * @returns Redis client instance
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

    redisClient.on('error', (err) => {
      console.error('[redis] Connection error:', err)
    })

    redisClient.on('connect', () => {
      console.log('[redis] Connected successfully')
    })
  }

  return redisClient
}

/**
 * Create or get a queue instance
 * @param queueName - Name of the queue
 * @param options - Optional queue options
 * @returns Bull Queue instance
 */
export function getQueue<T extends QueueJobData>(
  queueName: string,
  options?: Partial<QueueOptions>,
): Queue.Queue<T> {
  const redis = getRedisClient()

  const queue = new Queue<T>(queueName, {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600, // 1 hour
      },
      removeOnFail: false,
      timeout: 30000, // 30 seconds per job
    },
    ...options,
  })

  // Global queue event handlers
  queue.on('error', (err) => {
    console.error(`[${queueName}-queue] Queue error:`, err)
  })

  queue.on('failed', (job, err) => {
    console.error(`[${queueName}-queue] Job ${job.id} failed:`, err)
  })

  queue.on('completed', (job) => {
    console.log(`[${queueName}-queue] Job ${job.id} completed`)
  })

  return queue
}

/**
 * Add a job to the queue
 * @param queueName - Name of the queue
 * @param data - Job data
 * @param options - Optional job options
 * @returns Job ID and status URL
 */
export async function enqueueJob<T extends QueueJobData>(
  queueName: string,
  data: T,
  options?: {
    priority?: number
    delay?: number
    attempts?: number
  },
): Promise<{ jobId: string; statusUrl: string }> {
  const queue = getQueue<T>(queueName)

  const job = await queue.add(data, {
    jobId: `${queueName}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    priority: options?.priority || 10,
    delay: options?.delay,
    attempts: options?.attempts,
  })

  return {
    jobId: job.id as string,
    statusUrl: `/api/queue/${queueName}/status/${job.id}`,
  }
}

/**
 * Get the status of a job
 * @param queueName - Name of the queue
 * @param jobId - Job ID
 * @returns Job status or null if not found
 */
export async function getJobStatus(
  queueName: string,
  jobId: string,
): Promise<QueueJobResult | null> {
  const queue = getQueue<QueueJobData>(queueName)
  const redis = getRedisClient()

  // Try to get from queue first
  const job = await queue.getJob(jobId)

  // Check job result cache in Redis
  const cachedResult = await redis.get(`${queueName}:result:${jobId}`)
  if (cachedResult) {
    return JSON.parse(cachedResult)
  }

  if (!job) {
    return null
  }

  // Map job state to result
  if (job.isCompleted()) {
    const result: QueueJobResult = {
      jobId,
      status: 'completed',
      result: job.returnvalue,
      timestamp: new Date().toISOString(),
      retries: job.attemptsMade,
      maxRetries: job.opts.attempts || 3,
    }
    // Cache result for 1 hour
    await redis.setex(
      `${queueName}:result:${jobId}`,
      3600,
      JSON.stringify(result),
    )
    return result
  }

  if (job.isFailed()) {
    return {
      jobId,
      status: 'failed',
      error: job.failedReason || 'Unknown error',
      timestamp: new Date().toISOString(),
      retries: job.attemptsMade,
      maxRetries: job.opts.attempts || 3,
    }
  }

  return {
    jobId,
    status: 'processing',
    timestamp: new Date().toISOString(),
    retries: job.attemptsMade,
    maxRetries: job.opts.attempts || 3,
  }
}

/**
 * Register a job processor
 * @param queueName - Name of the queue
 * @param processor - Async processor function
 * @param concurrency - Number of concurrent jobs to process
 */
export async function registerProcessor<T extends QueueJobData>(
  queueName: string,
  processor: (job: Job<T>) => Promise<any>,
  concurrency: number = 5,
): Promise<void> {
  const queue = getQueue<T>(queueName)

  queue.process(concurrency, async (job) => {
    try {
      const result = await processor(job)
      return result
    } catch (error) {
      console.error(`[${queueName}-queue] Job ${job.id} processor error:`, error)
      throw error
    }
  })

  console.log(`[${queueName}-queue] Processor registered with concurrency: ${concurrency}`)
}

/**
 * Close all queue connections
 */
export async function closeQueues(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}

export default {
  getRedisClient,
  getQueue,
  enqueueJob,
  getJobStatus,
  registerProcessor,
  closeQueues,
}
