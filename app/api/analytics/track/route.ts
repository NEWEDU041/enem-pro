/**
 * Analytics Tracking Endpoint (Phase 2)
 * Receives all A/B test and revenue events
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

interface TrackingEvent {
  event: string;
  testId: string;
  variant: string;
  value: any;
  pageUrl: string;
  timestamp: string;
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const event: TrackingEvent = await request.json();

    // Validate required fields
    if (!event.event || !event.variant || !event.testId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert into analytics database
    await sql`
      INSERT INTO analytics_events (
        event_name,
        test_id,
        variant,
        page_url,
        event_value,
        user_id,
        created_at
      ) VALUES (
        ${event.event},
        ${event.testId},
        ${event.variant},
        ${event.pageUrl || ''},
        ${JSON.stringify(event.value)},
        ${event.userId || null},
        NOW()
      )
    `;

    // Also track in Vercel Analytics (if configured)
    if (process.env.VERCEL_ANALYTICS_ID) {
      try {
        await fetch('https://api.vercel.com/analytics/record', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: event.event,
            properties: {
              variant: event.variant,
              testId: event.testId,
              page: event.pageUrl,
            },
          }),
        }).catch(() => {
          // Silent fail - don't block if Vercel Analytics is unavailable
        });
      } catch {}
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for analytics dashboard
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const testId = searchParams.get('testId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!testId) {
    return NextResponse.json(
      { error: 'testId parameter required' },
      { status: 400 }
    );
  }

  try {
    // Get aggregated metrics by variant
    const results = await sql`
      SELECT
        variant,
        COUNT(*) as total_events,
        COUNT(DISTINCT CASE WHEN event_name = 'ab_test_pageView' THEN 1 END) as page_views,
        COUNT(DISTINCT CASE WHEN event_name = 'ab_test_clickTracking' THEN 1 END) as clicks,
        AVG(CASE WHEN event_name = 'ab_test_timeOnPage' THEN (event_value->>'value')::FLOAT ELSE NULL END) as avg_time_on_page,
        AVG(CASE WHEN event_name = 'ab_test_scrollDepth' THEN (event_value->>'value')::FLOAT ELSE NULL END) as avg_scroll_depth
      FROM analytics_events
      WHERE
        test_id = ${testId}
        AND created_at >= ${from || 'NOW() - INTERVAL 7 days'}
        AND created_at <= ${to || 'NOW()'}
      GROUP BY variant
      ORDER BY page_views DESC
    `;

    // Calculate conversion rates
    const variantStats = results.rows.map(row => ({
      ...row,
      ctr: row.clicks / (row.page_views || 1),
      avg_time_seconds: (row.avg_time_on_page || 0) / 1000,
    }));

    return NextResponse.json({
      testId,
      period: { from, to },
      variants: variantStats,
      summary: {
        totalEvents: variantStats.reduce((sum, v) => sum + v.total_events, 0),
        totalViews: variantStats.reduce((sum, v) => sum + v.page_views, 0),
        bestVariant: variantStats[0]?.variant || 'unknown',
      },
    });
  } catch (error) {
    console.error('Analytics query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
