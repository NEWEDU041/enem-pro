/**
 * Async queue for sitemap generation and indexing operations
 * Uses Bull for job management + Redis as backend
 */

import Bull, { Queue, Job } from 'bull'
import { createServerClient } from '@/lib/supabase'
import { getAllPostsLight } from '@/lib/blog-index'
import { fetchQuestionsByYearCached } from '@/lib/questions-cache'
import { SITE_URL, YEARS, disciplineToSlug } from '@/lib/enem-api'
import logger from '@/lib/logger'

// Job types
export interface SitemapGenerationJob {
  type: 'sitemap:full' | 'sitemap:questions' | 'sitemap:blog' | 'indexnow:submit'
  priority?: number
  metadata?: Record<string, any>
}

// Singleton queue
let sitemapQueue: Queue<SitemapGenerationJob> | null = null

/**
 * Initialize the sitemap generation queue
 */
export function initSitemapQueue(): Queue<SitemapGenerationJob> {
  if (sitemapQueue) return sitemapQueue

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/0'

  sitemapQueue = new Bull('sitemap-generation', redisUrl, {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
      },
    },
  })

  // Error handling
  sitemapQueue.on('error', (err) => {
    logger.error({ err, label: 'Sitemap queue error' })
  })

  // Job processors
  sitemapQueue.process('sitemap:full', 10, async (job) => {
    return await generateFullSitemap(job)
  })

  sitemapQueue.process('sitemap:questions', 5, async (job) => {
    return await generateQuestionsSitemap(job)
  })

  sitemapQueue.process('sitemap:blog', 5, async (job) => {
    return await generateBlogSitemap(job)
  })

  sitemapQueue.process('indexnow:submit', 3, async (job) => {
    return await submitToIndexNow(job)
  })

  logger.info({ label: 'Sitemap queue initialized' })

  return sitemapQueue
}

/**
 * Queue a job
 */
export async function queueSitemapJob(job: SitemapGenerationJob): Promise<Job<SitemapGenerationJob>> {
  const queue = initSitemapQueue()
  const priority = job.priority || 1
  return queue.add(job, {
    priority,
  })
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string | number) {
  const queue = initSitemapQueue()
  const job = await queue.getJob(jobId)
  if (!job) return null

  return {
    id: job.id,
    type: job.data.type,
    status: await job.getState(),
    progress: job.progress(),
    attempts: job.attemptsMade,
    error: job.failedReason,
  }
}

// ───── Job Processors ─────

async function generateFullSitemap(job: Job<SitemapGenerationJob>) {
  const startTime = Date.now()
  job.progress(0)

  try {
    const blogPages = await generateBlogSitemap(job)
    job.progress(33)

    const questionPages = await generateQuestionsSitemap(job)
    job.progress(66)

    const totalPages = (blogPages?.length || 0) + (questionPages?.length || 0)
    job.progress(100)

    logger.info({
      label: 'Sitemap generation complete',
      duration: Date.now() - startTime,
      pages: totalPages,
    })

    return { totalPages, duration: Date.now() - startTime }
  } catch (error) {
    logger.error({
      err: error,
      label: 'Sitemap generation failed',
    })
    throw error
  }
}

async function generateQuestionsSitemap(
  job: Job<SitemapGenerationJob>,
): Promise<Array<{ url: string; lastModified: string; priority: number }> | null> {
  try {
    const pages: Array<{ url: string; lastModified: string; priority: number }> = []

    for (const year of YEARS) {
      try {
        const questions = await fetchQuestionsByYearCached(year)
        for (const q of questions) {
          const slug = disciplineToSlug(q.discipline)
          if (!slug) continue
          pages.push({
            url: `${SITE_URL}/questoes/${slug}/${year}/${q.id.split('-')[1]}`,
            lastModified: new Date(`${year}-12-01`).toISOString().split('T')[0],
            priority: year >= 2022 ? 0.6 : 0.5,
          })
        }
      } catch {
        continue
      }
    }

    return pages
  } catch (error) {
    logger.error({ err: error, label: 'Question sitemap generation failed' })
    throw error
  }
}

async function generateBlogSitemap(
  job: Job<SitemapGenerationJob>,
): Promise<Array<{ url: string; lastModified: string; priority: number }> | null> {
  try {
    const pages = getAllPostsLight().map((post) => {
      const isHighPriority =
        post.slug.includes('gabarito') ||
        post.slug.includes('resultado') ||
        post.slug.includes('enem') ||
        post.slug.includes('redacao')

      return {
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.date).toISOString().split('T')[0],
        priority: isHighPriority ? 0.8 : 0.65,
      }
    })

    return pages
  } catch (error) {
    logger.error({ err: error, label: 'Blog sitemap generation failed' })
    throw error
  }
}

async function submitToIndexNow(job: Job<SitemapGenerationJob>) {
  try {
    const { urls = [] } = job.data.metadata || {}

    if (!urls.length) {
      throw new Error('No URLs provided for IndexNow submission')
    }

    // Implementation would call IndexNow API
    // This is a placeholder for the actual implementation
    logger.info({
      label: 'IndexNow submission queued',
      urlCount: urls.length,
    })

    return {
      submitted: urls.length,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logger.error({ err: error, label: 'IndexNow submission failed' })
    throw error
  }
}

/**
 * Close the queue (for graceful shutdown)
 */
export async function closeSitemapQueue() {
  if (sitemapQueue) {
    await sitemapQueue.close()
    sitemapQueue = null
  }
}
