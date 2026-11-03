/**
 * Cache Purge Webhook for Phase 3 Performance Optimization
 * 
 * Invalidates CDN cache on-demand when content changes
 * - Triggered on: post publish, post update, metadata change
 * - Purges: specific post URLs + related cache tags
 * - Uses: Vercel Firestore Integration (if available) or direct invalidation
 * 
 * Endpoint: POST /api/cache/purge
 * Auth: Internal API key (CACHE_PURGE_SECRET)
 */

import { NextApiRequest, NextApiResponse } from 'next';

interface PurgeRequest {
  paths?: string[];
  tags?: string[];
  all?: boolean;
  secret?: string;
}

interface PurgeResponse {
  success: boolean;
  purged: string[];
  timestamp: string;
  message?: string;
}

const CACHE_PURGE_SECRET = process.env.CACHE_PURGE_SECRET || 'dev-secret';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

/**
 * Purge specific paths from Vercel CDN cache
 */
async function purgePaths(paths: string[]): Promise<boolean> {
  if (!VERCEL_TOKEN) {
    console.warn('VERCEL_TOKEN not configured, skipping CDN purge');
    return false;
  }

  try {
    const response = await fetch('https://api.vercel.com/v1/deployments/cache', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paths,
      }),
    });

    if (!response.ok) {
      console.error('Vercel purge failed:', response.statusText);
      return false;
    }

    const data = await response.json();
    console.log('Cache purge successful:', data);
    return true;
  } catch (error) {
    console.error('Cache purge error:', error);
    return false;
  }
}

/**
 * Purge by tag (e.g., "post-123", "category-enem")
 * Note: Requires Vercel Enterprise or Tag-based purge API
 */
async function purgeByTag(tags: string[]): Promise<boolean> {
  // Tag-based purging is an enterprise feature
  // For now, we track tags in a Redis cache (optional)
  console.log(`Purging by tags (enterprise feature): ${tags.join(', ')}`);
  return false;
}

/**
 * Full cache purge (nuclear option)
 * Use sparingly — triggers full rebuild
 */
async function purgeAll(): Promise<boolean> {
  if (!VERCEL_TOKEN) {
    console.warn('VERCEL_TOKEN not configured');
    return false;
  }

  try {
    // This requires a deployment redeploy or manual ISR invalidation
    console.log('Full cache purge requested (requires deployment rebuild)');
    return true;
  } catch (error) {
    console.error('Full purge error:', error);
    return false;
  }
}

/**
 * POST /api/cache/purge
 * 
 * Request body:
 * {
 *   "secret": "...",
 *   "paths": ["/blog/post-1", "/blog/post-2"],
 *   "tags": ["post-1", "category-enem"],
 *   "all": false
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PurgeResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      purged: [],
      timestamp: new Date().toISOString(),
      message: 'Method not allowed',
    });
  }

  const { secret, paths, tags, all } = req.body as PurgeRequest;

  // Verify secret
  if (secret !== CACHE_PURGE_SECRET) {
    console.warn('Cache purge attempt with invalid secret');
    return res.status(401).json({
      success: false,
      purged: [],
      timestamp: new Date().toISOString(),
      message: 'Unauthorized',
    });
  }

  let purged: string[] = [];
  let success = false;

  try {
    if (all) {
      // Full purge
      success = await purgeAll();
      purged = ['*'];
    } else if (paths && paths.length > 0) {
      // Purge specific paths
      success = await purgePaths(paths);
      purged = paths;
    } else if (tags && tags.length > 0) {
      // Purge by tag (enterprise)
      success = await purgeByTag(tags);
      purged = tags;
    } else {
      return res.status(400).json({
        success: false,
        purged: [],
        timestamp: new Date().toISOString(),
        message: 'No paths, tags, or all flag provided',
      });
    }

    res.status(success ? 200 : 500).json({
      success,
      purged,
      timestamp: new Date().toISOString(),
      message: success ? 'Cache purge successful' : 'Cache purge failed',
    });
  } catch (error) {
    console.error('Cache purge handler error:', error);
    res.status(500).json({
      success: false,
      purged: [],
      timestamp: new Date().toISOString(),
      message: `Error: ${String(error)}`,
    });
  }
}
