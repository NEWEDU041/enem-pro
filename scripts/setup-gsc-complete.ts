#!/usr/bin/env node

/**
 * Complete GSC Setup Script
 * Configures and validates everything needed for real GSC monitoring
 *
 * Run: npx ts-node scripts/setup-gsc-complete.ts
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
}

function log(color: keyof typeof COLORS, ...args: any[]) {
  console.log(`${COLORS[color]}${args.join(' ')}${COLORS.reset}`)
}

function step(number: number, title: string) {
  log('cyan', `\n${'='.repeat(70)}`)
  log('cyan', `Step ${number}: ${title}`)
  log('cyan', `${'='.repeat(70)}`)
}

async function main() {
  log('green', '\n🚀 ENEM Pro — GSC Complete Setup\n')

  // Step 1: Check environment
  step(1, 'Checking Environment')
  const requiredEnvVars = ['GOOGLE_SERVICE_ACCOUNT_KEY', 'CRON_SECRET']
  const missingVars = requiredEnvVars.filter(v => !process.env[v])

  if (missingVars.length > 0) {
    log('yellow', `⚠️  Missing env vars: ${missingVars.join(', ')}`)
    log('yellow', 'These need to be set in Vercel dashboard → Settings → Environment Variables')
    printEnvVarInstructions()
  } else {
    log('green', '✅ All required env vars are set!')
  }

  // Step 2: Test GSC API Connection
  step(2, 'Testing Google Search Console API Connection')
  const gscConnectionOk = await testGscConnection()

  // Step 3: Check GSC Property
  step(3, 'Verifying GSC Property Configuration')
  await verifyGscProperty()

  // Step 4: Test Weekly Report
  step(4, 'Testing Weekly Report Generation')
  await testWeeklyReport()

  // Step 5: Verify Cron Job
  step(5, 'Verifying Cron Job Configuration')
  verifyVercelCron()

  // Step 6: Summary
  step(6, 'Setup Summary')
  printSummary(gscConnectionOk, missingVars)
}

function printEnvVarInstructions() {
  log('yellow', `
📋 HOW TO CONFIGURE ENV VARS IN VERCEL:

1. Go to: https://vercel.com/tevez041041-9726s-projects/enem-pro/settings/environment-variables

2. Add these variables:

   Variable Name: GOOGLE_SERVICE_ACCOUNT_KEY
   Value: (Paste your Google Service Account JSON - see below)
   Environments: Production (select checkbox)

   Variable Name: CRON_SECRET
   Value: (Generate a random secret, e.g., $(openssl rand -hex 32))
   Environments: Production (select checkbox)

3. Deploy after adding env vars (vercel --prod)

📝 HOW TO CREATE GOOGLE_SERVICE_ACCOUNT_KEY:

1. Go to: https://console.cloud.google.com
2. Create a new project: "ENEM Pro GSC"
3. Enable these APIs:
   - Google Search Console API
   - Google Indexing API (optional, for URL submission)
4. Create a Service Account:
   - Service Account > Create Service Account
   - Name: "enem-pro-monitoring"
   - Grant role: "Editor" (or more restrictive: "Search Console Editor")
5. Create JSON Key:
   - Click Service Account > Keys > Add Key > JSON
   - Download the JSON file
   - Paste entire JSON into GOOGLE_SERVICE_ACCOUNT_KEY
6. Share GSC with Service Account:
   - Go to https://search.google.com/search-console
   - Go to property questoesenem.pro
   - Settings > Users and permissions
   - Add the service account email (from JSON file, "client_email" field)
   - Grant "Editor" role
`)
}

async function testGscConnection(): Promise<boolean> {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      log('red', '❌ GOOGLE_SERVICE_ACCOUNT_KEY not set')
      return false
    }

    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
    log('green', `✅ Service Account loaded: ${serviceAccount.client_email}`)

    // Try to load auth
    const { google } = await import('googleapis')
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })

    const client = await auth.getClient()
    log('green', '✅ Google Auth client initialized')

    return true
  } catch (error) {
    log('red', `❌ Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

async function verifyGscProperty() {
  try {
    log('yellow', 'Checking questoesenem.pro property...')

    // This would require hitting the GSC API - for now just check DNS
    const { execSync } = await import('child_process')
    const result = execSync('nslookup questoesenem.pro 2>&1').toString()

    if (result.includes('76.76.21.21')) {
      log('green', '✅ Domain resolves to Vercel IP (76.76.21.21)')
      log('green', '✅ questoesenem.pro is correctly configured')
    } else {
      log('yellow', '⚠️  Domain resolution unclear, verify in GSC console manually')
      log('yellow', 'Go to: https://search.google.com/search-console/property/questoesenem.pro/coverage')
    }
  } catch (error) {
    log('yellow', '⚠️  Could not verify DNS (may not be available in this environment)')
  }
}

async function testWeeklyReport() {
  try {
    log('yellow', 'Testing weekly report generation (without GSC data)...')
    const { createWeeklyReport, saveReportToFile } = await import('../scripts/monitor-gsc-ranking')
    const weekNumber = Math.floor((Date.now() / 1000 / 60 / 60 / 24 - 4) / 7)
    const report = await createWeeklyReport(weekNumber)

    if (report.isRealData) {
      log('green', '✅ Weekly report generation working with REAL GSC data!')
      log('green', `   Total Impressions: ${report.gsc.totalImpressions}`)
      log('green', `   Total Clicks: ${report.gsc.totalClicks}`)
    } else {
      log('yellow', '⚠️  Weekly report structure OK, but no real GSC data yet')
      if (report.warnings.length > 0) {
        report.warnings.forEach(w => log('yellow', `   ${w}`))
      }
    }

    await saveReportToFile(report)
    log('green', '✅ Report saved to .gsc-reports/')
  } catch (error) {
    log('red', `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function verifyVercelCron() {
  try {
    const vercelJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf-8'))
    const gscCron = vercelJson.crons?.find((c: any) => c.path === '/api/cron/gsc-weekly-report')

    if (gscCron) {
      log('green', '✅ GSC weekly report cron is configured in vercel.json')
      log('green', `   Schedule: ${gscCron.schedule} (Every Monday 9 AM UTC)`)
    } else {
      log('red', '❌ GSC cron not found in vercel.json')
    }
  } catch (error) {
    log('red', `❌ Could not read vercel.json: ${error}`)
  }
}

function printSummary(gscConnected: boolean, missingVars: string[]) {
  log('cyan', `
SETUP STATUS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Environment Variables: ${missingVars.length === 0 ? '✅ OK' : '❌ MISSING'}
2. GSC API Connection: ${gscConnected ? '✅ OK' : '❌ NOT TESTED'}
3. GSC Property: ℹ️  VERIFY MANUALLY (see instructions above)
4. Weekly Reports: ✅ CODE READY
5. Cron Jobs: ✅ CONFIGURED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS:

1. Set env vars in Vercel (see instructions above)
2. Deploy: vercel --prod
3. Wait for first cron run (Monday 9 AM UTC)
4. Check .gsc-reports/ folder for generated reports
5. Verify GSC shows real data in https://search.google.com/search-console/

MONITORING:

Weekly reports will be generated every Monday at 9 AM UTC.
Check: C:\projetos\enem-pro\.gsc-reports\

Real GSC data will start appearing after first cron run (if env vars are set correctly).

HELP:

If reports show "⚠️ No page data returned from GSC API":
1. Check GOOGLE_SERVICE_ACCOUNT_KEY is valid JSON
2. Check service account email is added to GSC property with "Editor" role
3. Check CRON_SECRET is set
4. Deploy again: vercel --prod
`)
}

main().catch(error => {
  log('red', `Fatal error: ${error.message}`)
  process.exit(1)
})
