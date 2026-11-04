/**
 * A/B Test Metrics API Endpoint
 * Aggregates GTM events and provides real-time metrics
 * 
 * GET /api/metrics/ab-tests - list all active tests
 * GET /api/metrics/ab-tests/{testId} - get metrics for specific test
 * POST /api/metrics/ab-tests/{testId}/events - submit GTM events batch
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface ABTestMetrics {
  testId: string;
  variants: {
    name: string;
    impressions: number;
    clicks: number;
    conversions: number;
    clickRate: number;
    conversionRate: number;
  }[];
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  lastUpdated: string;
}

export interface ABTestEvent {
  id: string;
  test_id: string;
  variant: string;
  event_type: 'impression' | 'click' | 'conversion';
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * GET /api/metrics/ab-tests
 * Returns aggregated metrics for all active A/B tests
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { testId?: string } }
) {
  try {
    const testId = params?.testId;

    if (!testId) {
      // Get all tests
      const { data: tests, error } = await supabase
        .from('ab_tests')
        .select('id, name, status, created_at');

      if (error) throw error;

      return NextResponse.json({ tests }, { status: 200 });
    }

    // Get specific test metrics
    const { data: events, error } = await supabase
      .from('ab_test_events')
      .select('*')
      .eq('test_id', testId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    // Aggregate metrics by variant
    const variants: Record<string, any> = {};
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;

    (events as ABTestEvent[]).forEach((event) => {
      if (!variants[event.variant]) {
        variants[event.variant] = {
          name: event.variant,
          impressions: 0,
          clicks: 0,
          conversions: 0,
        };
      }

      if (event.event_type === 'impression') {
        variants[event.variant].impressions += 1;
        totalImpressions += 1;
      } else if (event.event_type === 'click') {
        variants[event.variant].clicks += 1;
        totalClicks += 1;
      } else if (event.event_type === 'conversion') {
        variants[event.variant].conversions += 1;
        totalConversions += 1;
      }
    });

    // Calculate rates
    const variantsList = Object.values(variants).map((v: any) => ({
      ...v,
      clickRate:
        v.impressions > 0 ? ((v.clicks / v.impressions) * 100).toFixed(2) : '0.00',
      conversionRate:
        v.clicks > 0 ? ((v.conversions / v.clicks) * 100).toFixed(2) : '0.00',
    }));

    const metrics: ABTestMetrics = {
      testId,
      variants: variantsList,
      totalImpressions,
      totalClicks,
      totalConversions,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/metrics/ab-tests/{testId}/events
 * Submit batch of GTM events for aggregation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;
    const body = await request.json();

    // Validate payload
    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: 'Invalid payload: events array required' },
        { status: 400 }
      );
    }

    // Transform GTM events to DB format
    const eventsToInsert = body.events
      .filter(
        (e: any) =>
          e.ab_test_id === testId &&
          ['impression', 'click', 'conversion'].includes(e.event_type)
      )
      .map((e: any) => ({
        test_id: e.ab_test_id,
        variant: e.ab_test_variant,
        event_type: e.event_type,
        timestamp: e.timestamp || new Date().toISOString(),
        metadata: e.metadata || {},
      }));

    if (eventsToInsert.length === 0) {
      return NextResponse.json(
        { message: 'No valid events to insert' },
        { status: 200 }
      );
    }

    // Insert events in batch
    const { data, error } = await supabase
      .from('ab_test_events')
      .insert(eventsToInsert)
      .select();

    if (error) throw error;

    return NextResponse.json(
      { message: 'Events recorded', count: data?.length || 0 },
      { status: 201 }
    );
  } catch (error) {
    console.error('Event submission error:', error);
    return NextResponse.json(
      { error: 'Failed to record events' },
      { status: 500 }
    );
  }
}
