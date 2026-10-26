/**
 * Admin Audit Logs Endpoint
 * GET /api/admin/audit-logs?userId=x&action=y&startDate=z&endDate=w&limit=100
 * 
 * Protected endpoint - requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { auditLog } from '@/lib/audit-logger';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return false;
    }

    // Verify token is admin
    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return false;
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    return !profileError && profile?.role === 'admin';
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const admin = await isAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || undefined;
    const action = url.searchParams.get('action') || undefined;
    const resource = url.searchParams.get('resource') || undefined;
    const startDate = url.searchParams.get('startDate') 
      ? new Date(url.searchParams.get('startDate')!) 
      : undefined;
    const endDate = url.searchParams.get('endDate')
      ? new Date(url.searchParams.get('endDate')!)
      : undefined;
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 1000);

    // Query audit logs
    const logs = await auditLog.query({
      userId,
      action,
      resource,
      startDate,
      endDate,
      limit,
    });

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error('Audit logs endpoint error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    method: 'GET',
    endpoint: '/api/admin/audit-logs',
    description: 'Retrieve audit logs (admin only)',
    queryParameters: {
      userId: 'string (optional)',
      action: 'string (optional)',
      resource: 'string (optional)',
      startDate: 'ISO date (optional)',
      endDate: 'ISO date (optional)',
      limit: 'number, max 1000 (default 100)',
    },
    example: '/api/admin/audit-logs?action=UPDATE&limit=50',
  });
}
