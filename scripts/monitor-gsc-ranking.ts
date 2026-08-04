/**
 * MONITOR: GSC Indexation + Ranking (Real Data)
 * Roda 1x/semana pra acompanhar dados reais do Google Search Console
 */

import fs from 'fs'
import path from 'path'
import { getGscAnalytics } from '@/lib/gsc-api'

interface GscSnapshot {
  date: string
  totalImpressions: number
  totalClicks: number
  avgPosition: number
  avgCtr: number
  topPages: { url: string; impressions: number; clicks: number; ctr: number; position: number }[]
  topQueries: { query: string; impressions: number; clicks: number; ctr: number; position: number }[]
}

interface WeeklyReport {
  week: number
  date: string
  gsc: GscSnapshot
  isRealData: boolean
  warnings: string[]
}

export async function createWeeklyReport(weekNumber: number): Promise<WeeklyReport> {
  const date = new Date()
  const warnings: string[] = []

  try {
    const pageData = await getGscAnalytics('page', 50)
    const queryData = await getGscAnalytics('query', 50)

    if (pageData.length === 0) {
      warnings.push('⚠️ No page data from GSC API — check GOOGLE_SERVICE_ACCOUNT_KEY')
    }

    const totalImpressions = pageData.reduce((sum, p) => sum + p.impressions, 0)
    const totalClicks = pageData.reduce((sum, p) => sum + p.clicks, 0)
    const avgPosition = pageData.length ? pageData.reduce((sum, p) => sum + p.position, 0) / pageData.length : 0
    const avgCtr = totalImpressions ? (totalClicks / totalImpressions) * 100 : 0

    return {
      week: weekNumber,
      date: date.toISOString().split('T')[0],
      gsc: {
        date: date.toISOString().split('T')[0],
        totalImpressions,
        totalClicks,
        avgPosition: Math.round(avgPosition * 100) / 100,
        avgCtr: Math.round(avgCtr * 100) / 100,
        topPages: pageData.slice(0, 10).map(p => ({
          url: p.page,
          impressions: p.impressions,
          clicks: p.clicks,
          ctr: Math.round(p.ctr * 100) / 100,
          position: p.position,
        })),
        topQueries: queryData.slice(0, 10).map(q => ({
          query: q.query,
          impressions: q.impressions,
          clicks: q.clicks,
          ctr: Math.round(q.ctr * 100) / 100,
          position: q.position,
        })),
      },
      isRealData: pageData.length > 0,
      warnings,
    }
  } catch (error) {
    return {
      week: weekNumber,
      date: date.toISOString().split('T')[0],
      gsc: {
        date: date.toISOString().split('T')[0],
        totalImpressions: 0,
        totalClicks: 0,
        avgPosition: 0,
        avgCtr: 0,
        topPages: [],
        topQueries: [],
      },
      isRealData: false,
      warnings: [`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`],
    }
  }
}

export async function saveReportToFile(report: WeeklyReport): Promise<void> {
  try {
    const reportDir = path.join(process.cwd(), '.gsc-reports')
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    const filename = `gsc-report-${report.date}-w${report.week}.json`
    const filepath = path.join(reportDir, filename)
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2))

    const markdown = `# GSC Report — ${report.date}

**Data Quality:** ${report.isRealData ? '✅ REAL DATA' : '⚠️ CHECK API'}

## Resumo

| Métrica | Valor |
|---------|-------|
| Total Impressions | ${report.gsc.totalImpressions.toLocaleString()} |
| Total Clicks | ${report.gsc.totalClicks.toLocaleString()} |
| Avg CTR | ${report.gsc.avgCtr}% |
| Avg Position | ${report.gsc.avgPosition} |
`

    fs.writeFileSync(filepath.replace('.json', '.md'), markdown)
    console.log(`✅ Reports saved: ${filepath}`)
  } catch (error) {
    console.error('❌ Error saving report:', error)
  }
}
