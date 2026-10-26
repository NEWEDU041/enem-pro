/**
 * Audit Logger - LGPD/GDPR Compliance
 * Logs: who (user_id, email), what (action), when (timestamp), IP, changes (before/after)
 * 
 * Usage:
 * await auditLog.log({
 *   userId: 'user123',
 *   email: 'user@example.com',
 *   action: 'UPDATE_PROFILE',
 *   resource: 'users',
 *   changes: { name: { old: 'John', new: 'John Doe' } },
 *   ip: req.headers['x-forwarded-for'],
 *   metadata: {}
 * })
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogEntry {
  id?: string;
  userId: string | null;
  email: string | null;
  action: string; // CREATE, READ, UPDATE, DELETE, LOGIN, EXPORT, CONSENT_CHANGE
  resource: string; // table/resource name
  resourceId?: string | null;
  changes?: Record<string, { old: unknown; new: unknown }> | null;
  ip: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
}

export interface AuditLogQuery {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

class AuditLogger {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<string> {
    try {
      const auditEntry = {
        id: uuidv4(),
        user_id: entry.userId,
        email: entry.email,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resourceId,
        changes: entry.changes ? JSON.stringify(entry.changes) : null,
        ip: entry.ip,
        user_agent: entry.userAgent,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        created_at: new Date().toISOString(),
      };

      const { error } = await this.supabase
        .from('audit_logs')
        .insert([auditEntry]);

      if (error) {
        console.error('Audit log error:', error);
        // Don't throw - audit logging shouldn't break main operations
        return '';
      }

      return auditEntry.id;
    } catch (error) {
      console.error('Audit logger exception:', error);
      return '';
    }
  }

  /**
   * Query audit logs (admin only)
   */
  async query(params: AuditLogQuery) {
    const { userId, action, resource, startDate, endDate, limit = 100 } = params;

    let query = this.supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) query = query.eq('user_id', userId);
    if (action) query = query.eq('action', action);
    if (resource) query = query.eq('resource', resource);
    if (startDate) query = query.gte('created_at', startDate.toISOString());
    if (endDate) query = query.lte('created_at', endDate.toISOString());

    const { data, error } = await query;

    if (error) {
      console.error('Audit query error:', error);
      return [];
    }

    return (data || []).map((entry: any) => ({
      id: entry.id,
      userId: entry.user_id,
      email: entry.email,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resource_id,
      changes: entry.changes ? JSON.parse(entry.changes) : null,
      ip: entry.ip,
      userAgent: entry.user_agent,
      metadata: entry.metadata ? JSON.parse(entry.metadata) : null,
      createdAt: new Date(entry.created_at),
    }));
  }

  /**
   * Get audit trail for a specific user (for GDPR export)
   */
  async getUserAuditTrail(userId: string): Promise<AuditLogEntry[]> {
    return this.query({ userId, limit: 1000 });
  }

  /**
   * Get audit trail for a resource
   */
  async getResourceAuditTrail(resource: string, resourceId?: string): Promise<AuditLogEntry[]> {
    const params: AuditLogQuery = { resource, limit: 1000 };
    if (resourceId) {
      // Custom query for resourceId
      let query = this.supabase
        .from('audit_logs')
        .select('*')
        .eq('resource', resource)
        .order('created_at', { ascending: false });
      
      if (resourceId) {
        query = query.eq('resource_id', resourceId);
      }

      const { data, error } = await query;
      if (error) return [];
      
      return (data || []).map((entry: any) => ({
        userId: entry.user_id,
        email: entry.email,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resource_id,
        changes: entry.changes ? JSON.parse(entry.changes) : null,
        ip: entry.ip,
        userAgent: entry.user_agent,
        metadata: entry.metadata ? JSON.parse(entry.metadata) : null,
        createdAt: new Date(entry.created_at),
      }));
    }

    return this.query(params);
  }
}

export const auditLog = new AuditLogger();
