/**
 * GDPR Export Endpoint - /api/export-my-data
 * 
 * POST /api/export-my-data
 * Body: { email: string, password?: string }
 * Response: { downloadUrl: string, expiresIn: number }
 * 
 * Creates a ZIP file containing:
 * - Personal data (profile, email, phone, etc.)
 * - Audit trail (all actions)
 * - Consent history
 * - Preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auditLog } from '@/lib/audit-logger';
import { consentManager } from '@/lib/consent-manager';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ExportRequest {
  email: string;
  password?: string;
}

interface UserData {
  profile: any;
  auditTrail: any[];
  consentHistory: any[];
  preferences: any;
  requestedAt: string;
  expiresAt: string;
}

async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getProfileData(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return data;
}

async function getAuditTrail(userId: string) {
  return auditLog.getUserAuditTrail(userId);
}

async function getConsentHistory(userId: string) {
  return consentManager.getConsentHistory(userId, 1000);
}

async function getUserPreferences(userId: string) {
  const { data } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId);

  return data || [];
}

async function createExportZip(userData: UserData): Promise<Buffer> {
  const zip = new JSZip();

  // Add README
  zip.file(
    'README.md',
    `# Your Personal Data Export

This ZIP file contains your personal data as requested under LGPD/GDPR regulations.

**Export Date:** ${userData.requestedAt}
**Valid Until:** ${userData.expiresAt}

## Contents

1. **profile.json** - Your personal information
2. **audit-trail.json** - All actions and changes to your account
3. **consents.json** - Your consent history for data collection
4. **preferences.json** - Your user preferences
5. **metadata.json** - Export metadata

---

If you have questions, contact support@example.com
`
  );

  // Add data files
  zip.file('profile.json', JSON.stringify(userData.profile, null, 2));
  zip.file('audit-trail.json', JSON.stringify(userData.auditTrail, null, 2));
  zip.file('consents.json', JSON.stringify(userData.consentHistory, null, 2));
  zip.file('preferences.json', JSON.stringify(userData.preferences, null, 2));
  zip.file(
    'metadata.json',
    JSON.stringify(
      {
        requestedAt: userData.requestedAt,
        expiresAt: userData.expiresAt,
        totalRecords: {
          profile: userData.profile ? 1 : 0,
          auditTrail: userData.auditTrail.length,
          consents: userData.consentHistory.length,
          preferences: userData.preferences.length,
        },
      },
      null,
      2
    )
  );

  return Buffer.from(await zip.generateAsync({ type: 'arraybuffer' }));
}

async function uploadExportToStorage(
  userId: string,
  buffer: Buffer,
  filename: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('gdpr-exports')
    .upload(`${userId}/${filename}`, buffer, {
      contentType: 'application/zip',
      cacheControl: '1', // No cache
    });

  if (error) {
    console.error('Storage upload error:', error);
    return null;
  }

  // Create signed URL (valid for 7 days)
  const { data: signedUrl, error: signError } = await supabase.storage
    .from('gdpr-exports')
    .createSignedUrl(`${userId}/${filename}`, 7 * 24 * 60 * 60); // 7 days

  if (signError) {
    console.error('Signed URL error:', signError);
    return null;
  }

  return signedUrl.signedUrl;
}

export async function POST(request: NextRequest) {
  try {
    // Get IP for audit
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const body = (await request.json()) as ExportRequest;
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal whether email exists (security)
      return NextResponse.json(
        { 
          message: 'If an account exists with this email, an export will be prepared.',
          estimatedTime: '24 hours'
        },
        { status: 202 }
      );
    }

    const userId = user.id;

    // Log the export request
    await auditLog.log({
      userId,
      email,
      action: 'GDPR_EXPORT_REQUESTED',
      resource: 'gdpr_exports',
      ip,
      userAgent,
      metadata: { method: 'api' },
    });

    // Gather user data
    const profile = await getProfileData(userId);
    const auditTrail = await getAuditTrail(userId);
    const consentHistory = await getConsentHistory(userId);
    const preferences = await getUserPreferences(userId);

    const requestedAt = new Date();
    const expiresAt = new Date(requestedAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const userData: UserData = {
      profile: profile ? {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        // Don't include passwords or sensitive auth tokens
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      } : null,
      auditTrail,
      consentHistory,
      preferences,
      requestedAt: requestedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Create ZIP
    const buffer = await createExportZip(userData);

    // Upload to storage
    const filename = `gdpr-export-${userId}-${uuidv4()}.zip`;
    const downloadUrl = await uploadExportToStorage(userId, buffer, filename);

    if (!downloadUrl) {
      return NextResponse.json(
        { error: 'Failed to prepare export' },
        { status: 500 }
      );
    }

    // Log successful export
    await auditLog.log({
      userId,
      email,
      action: 'GDPR_EXPORT_COMPLETED',
      resource: 'gdpr_exports',
      ip,
      userAgent,
      metadata: { 
        filename,
        sizeInBytes: buffer.length,
        expiresAt: expiresAt.toISOString()
      },
    });

    return NextResponse.json({
      success: true,
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
      expiresIn: '7 days',
      message: 'Your data export is ready. The link will expire in 7 days.',
    });
  } catch (error) {
    console.error('Export endpoint error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    method: 'POST',
    endpoint: '/api/export-my-data',
    description: 'GDPR/LGPD data export',
    body: {
      email: 'user@example.com',
    },
    response: {
      downloadUrl: 'https://...',
      expiresAt: 'ISO timestamp',
      expiresIn: '7 days',
    },
  });
}
