/**
 * Example: How to use the Feedback Queue in ENEM-Pro
 *
 * This example shows how to enqueue feedback jobs and process them asynchronously
 * instead of blocking the HTTP response.
 */

import { enqueueFeedback, initFeedbackQueue, FeedbackJobData } from '@/lib/feedback-queue'

// Initialize the queue processor (call once on app startup)
export async function setupFeedbackQueue() {
  try {
    await initFeedbackQueue()
    console.log('✓ Feedback queue initialized')
  } catch (error) {
    console.error('Failed to initialize feedback queue:', error)
    // Fall back to synchronous processing if queue setup fails
  }
}

// Example API route handler
export async function handleCommentSubmission(
  postId: string,
  userId: string,
  content: string,
) {
  // Validate input
  if (!content || content.length < 1) {
    throw new Error('Comment cannot be empty')
  }

  // Create comment record immediately (fast)
  const comment = await createCommentInDatabase({
    postId,
    userId,
    content,
    status: 'pending', // Mark as pending moderation
  })

  // Enqueue for async processing (no waiting)
  const { jobId, statusUrl } = await enqueueFeedback({
    type: 'comment',
    postId,
    userId,
    commentId: comment.id,
    content,
    metadata: {
      createdAt: new Date().toISOString(),
      ipAddress: getUserIpAddress(), // Useful for spam detection
    },
  })

  // Return immediately to user (< 100ms)
  return {
    success: true,
    commentId: comment.id,
    statusUrl, // User can check status later
    jobId,
    message: 'Comment submitted and queued for processing',
  }
}

export async function handleFeedbackSubmission(
  userId: string,
  content: string,
  metadata?: Record<string, any>,
) {
  // Enqueue feedback for async processing
  const { jobId, statusUrl } = await enqueueFeedback({
    type: 'feedback',
    userId,
    content,
    metadata: {
      ...metadata,
      submittedAt: new Date().toISOString(),
    },
  })

  return {
    success: true,
    statusUrl,
    jobId,
    message: 'Feedback submitted for processing',
  }
}

// Helper functions (replace with your actual implementations)
async function createCommentInDatabase(comment: any) {
  // TODO: Implement
  return { id: `comment-${Date.now()}`, ...comment }
}

function getUserIpAddress(): string {
  // TODO: Extract from request
  return 'unknown'
}
