/**
 * Database Migrations for Phase 2
 * Creates tables for A/B testing, analytics, and email automation
 */

import { sql } from '@vercel/postgres';

export async function runPhase2Migrations() {
  try {
    console.log('Starting Phase 2 database migrations...');

    // Create analytics_events table
    await sql`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_name VARCHAR(255) NOT NULL,
        test_id VARCHAR(255) NOT NULL,
        variant VARCHAR(50) NOT NULL,
        page_url TEXT,
        event_value JSONB,
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        INDEX idx_test_variant (test_id, variant),
        INDEX idx_created_at (created_at)
      )
    `;

    // Create email_queue table
    await sql`
      CREATE TABLE IF NOT EXISTS email_queue (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        html_content TEXT,
        text_content TEXT,
        sequence_type VARCHAR(50), -- welcome, nurture, conversion, retention
        send_at TIMESTAMP,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        INDEX idx_user_id (user_id),
        INDEX idx_send_at (send_at),
        INDEX idx_sent_at (sent_at)
      )
    `;

    // Create email_opens table
    await sql`
      CREATE TABLE IF NOT EXISTS email_opens (
        id SERIAL PRIMARY KEY,
        email_id INTEGER,
        opened_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(email_id),
        FOREIGN KEY (email_id) REFERENCES email_queue(id)
      )
    `;

    // Create email_clicks table
    await sql`
      CREATE TABLE IF NOT EXISTS email_clicks (
        id SERIAL PRIMARY KEY,
        email_id INTEGER,
        link_url TEXT,
        clicked_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (email_id) REFERENCES email_queue(id),
        INDEX idx_email_id (email_id)
      )
    `;

    // Create email_metrics table
    await sql`
      CREATE TABLE IF NOT EXISTS email_metrics (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        sequence_type VARCHAR(50),
        email_name VARCHAR(255),
        action VARCHAR(50), -- sent, opened, clicked
        created_at TIMESTAMP DEFAULT NOW(),
        INDEX idx_user_id (user_id),
        INDEX idx_sequence_action (sequence_type, action)
      )
    `;

    // Create conversion_funnel table for landing page CRO
    await sql`
      CREATE TABLE IF NOT EXISTS conversion_funnel (
        id SERIAL PRIMARY KEY,
        page_url VARCHAR(255) NOT NULL,
        variant_id VARCHAR(50),
        user_id VARCHAR(255),
        step VARCHAR(50), -- view, form_start, form_submit, conversion
        timestamp TIMESTAMP DEFAULT NOW(),
        INDEX idx_page_variant (page_url, variant_id),
        INDEX idx_user_funnel (user_id, step)
      )
    `;

    // Create revenue_tracking table
    await sql`
      CREATE TABLE IF NOT EXISTS revenue_tracking (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2),
        currency VARCHAR(3) DEFAULT 'BRL',
        source VARCHAR(50), -- subscription, product, affiliate
        campaign VARCHAR(100),
        variant VARCHAR(50),
        timestamp TIMESTAMP DEFAULT NOW(),
        INDEX idx_user_revenue (user_id),
        INDEX idx_timestamp (timestamp),
        INDEX idx_campaign_variant (campaign, variant)
      )
    `;

    console.log('✅ Phase 2 migrations completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Phase 2 migration failed:', error);
    throw error;
  }
}

/**
 * Verify migration completion
 */
export async function verifyPhase2Migration(): Promise<boolean> {
  try {
    const tables = [
      'analytics_events',
      'email_queue',
      'email_opens',
      'email_clicks',
      'email_metrics',
      'conversion_funnel',
      'revenue_tracking',
    ];

    for (const table of tables) {
      const result = await sql`SELECT 1 FROM ${sql.identifier([table])} LIMIT 1`;
      console.log(`✅ Table ${table} exists`);
    }

    return true;
  } catch (error) {
    console.error('❌ Migration verification failed:', error);
    return false;
  }
}

/**
 * Cleanup old analytics data (retention policy)
 */
export async function cleanupOldAnalytics(daysToKeep: number = 90) {
  try {
    const before = new Date();
    before.setDate(before.getDate() - daysToKeep);

    const result = await sql`
      DELETE FROM analytics_events WHERE created_at < ${before.toISOString()}
    `;

    console.log(`✅ Deleted ${result.rowCount} old analytics records`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}
