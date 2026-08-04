import { NextRequest, NextResponse } from 'next/server'
import { createWeeklyReport, saveReportToFile } from '@/scripts/monitor-gsc-ranking'

export const maxDuration = 60

/**
 * Cron: Weekly GSC Report
 * Triggered by Vercel cron schedule (set in vercel.json)
 * Every Monday at 9 AM UTC
 */
export async function GET(request: NextRequest) {
  // Verify it's a Vercel cron request
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('🔄 Starting weekly GSC report generation...')
    const weekNumber = Math.floor((Date.now() / 1000 / 60 / 60 / 24 - 4) / 7)
    const report = await createWeeklyReport(weekNumber)

    // Save to file
    await saveReportToFile(report)

    // Log summary
    const summary = {
      success: true,
      week: report.week,
      date: report.date,
      isRealData: report.isRealData,
      totalImpressions: report.gsc.totalImpressions,
      totalClicks: report.gsc.totalClicks,
      avgCtr: report.gsc.avgCtr,
      warnings: report.warnings,
    }

    console.log('✅ Weekly report generated:', summary)

    return NextResponse.json(summary)
  } catch (error) {
    console.error('❌ Error in weekly GSC report:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 }
    )
  }
}
