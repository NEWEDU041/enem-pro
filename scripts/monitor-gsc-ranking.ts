/**
 * MONITOR: GSC Indexation + Ranking (Real Data)
 *
 * Roda 1x/semana pra acompanhar:
 * - Quantos posts/questões indexados (dados REAIS do Google Search Console)
 * - CTR e posição média por página
 * - Trending: top pages por impressions/clicks
 * - Opportunities: pages com high impressions mas low CTR (precisa de rewrite)
 *
 * Output: relatório JSON + markdown pra Obsidian + Slack
 *
 * Requires: GOOGLE_SERVICE_ACCOUNT_KEY env var set in Vercel
 */

import fs from 'fs'
import path from 'path'
import { getGscAnalytics, getGscCoverage } from '@/lib/gsc-api'

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

// REAL integration with Google Search Console API
export async function createWeeklyReport(weekNumber: number): Promise<WeeklyReport> {
  const date = new Date()
  const week = Math.floor((date.getDate() - date.getDay() + 4) / 7)
  const warnings: string[] = []

  try {
    console.log('📊 Fetching real GSC data...')
    const pageData = await getGscAnalytics('page', 50)
    const queryData = await getGscAnalytics('query', 50)

    if (pageData.length === 0) {
      warnings.push('⚠️ No page data returned from GSC API — check GOOGLE_SERVICE_ACCOUNT_KEY env var')
    }
    if (queryData.length === 0) {
      warnings.push('⚠️ No query data returned from GSC API')
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
    console.error('❌ Error creating weekly report:', error)
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
      warnings: [`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    }
  }

// Save real GSC report to file for monitoring/debugging
export async function saveReportToFile(report: WeeklyReport): Promise<void> {
  try {
    const reportDir = path.join(process.cwd(), '.gsc-reports')
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    const filename = `gsc-report-${report.date}-w${report.week}.json`
    const filepath = path.join(reportDir, filename)
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2))

    const markdown = `---
date: ${report.date}
week: ${report.week}
isRealData: ${report.isRealData}
---

# GSC Report — Semana ${report.week} (${report.date})

**Data Quality:** ${report.isRealData ? '✅ REAL DATA FROM GSC API' : '⚠️ PLACEHOLDER DATA — Check GOOGLE_SERVICE_ACCOUNT_KEY'}

${report.warnings.length > 0 ? `## Warnings\n${report.warnings.map(w => `- ${w}`).join('\n')}\n` : ''}

## Resumo

| Métrica | Valor |
|---------|-------|
| Total Impressions | ${report.gsc.totalImpressions.toLocaleString()} |
| Total Clicks | ${report.gsc.totalClicks.toLocaleString()} |
| Avg CTR | ${report.gsc.avgCtr}% |
| Avg Position | ${report.gsc.avgPosition} |

## Top Pages (by Impressions)

| URL | Impressions | Clicks | CTR | Pos |
|-----|------------|--------|-----|-----|
${report.gsc.topPages.map(p => `| ${p.url} | ${p.impressions} | ${p.clicks} | ${p.ctr}% | ${p.position} |`).join('\n')}

## Top Queries (by Impressions)

| Query | Impressions | Clicks | CTR | Pos |
|-------|------------|--------|-----|-----|
${report.gsc.topQueries.map(q => `| ${q.query} | ${q.impressions} | ${q.clicks} | ${q.ctr}% | ${q.position} |`).join('\n')}

---
Report generated: ${new Date().toISOString()}
`

    const markdownFile = filepath.replace('.json', '.md')
    fs.writeFileSync(markdownFile, markdown)

    console.log(`✅ Reports saved:\n  - ${filepath}\n  - ${markdownFile}`)
  } catch (error) {
    console.error('❌ Error saving report:', error)
  }
}
| Indexados | ${report.gsc.indexed} | ✅ |
| Pendentes | ${report.gsc.pending} | ⏳ |
| Erros 404 | ${report.gsc.error_404} | ✅ |
| Redirecionamentos | ${report.gsc.error_redirect} | ✅ |

**Mudança da semana anterior:** +${report.new_posts_indexed} novos indexados

## Posts Publicados vs Indexados

- **Publicados**: ${report.new_posts_published}
- **Indexados**: ${report.new_posts_indexed}
- **Taxa de indexação**: ${report.new_posts_published > 0 ? Math.round((report.new_posts_indexed / report.new_posts_published) * 100) : 0}%

## Ranking

### Top 10 Keywords (posição < 5)
\`\`\`
${report.ranking
  .filter(r => r.position <= 5)
  .slice(0, 10)
  .map(r => `${r.keyword.padEnd(40)} | pos ${r.position} | ${r.impressions} impressões | CTR ${(r.ctr * 100).toFixed(1)}%`)
  .join('\n')}
\`\`\`

### Posts em Queda (position > 10 semana passada)
${report.posts_dropped_ranking > 0 ? `⚠️ ${report.posts_dropped_ranking} posts caíram de ranking` : '✅ Nenhuma queda'}

## Notas
${report.notes || 'Sem notas.'}

---
**Próximo check:** Semana ${report.week + 1}
`

  fs.writeFileSync(obsidianPath, markdown)
  console.log(`📊 Relatório salvo: ${obsidianPath}`)
}

// Agendar rodada semanal
export function scheduleWeeklyCheck() {
  console.log('⏰ Monitor GSC agendado para rodar 1x/semana (sexta-feira 09:00)')
  console.log('Use: \`npx tsx scripts/monitor-gsc-ranking.ts\` para rodar manualmente')
}

if (require.main === module) {
  const report = createWeeklyReport(1)
  const obsidianPath = path.join(
    process.env.OBSIDIAN_VAULT || '',
    'AIOX/_Memory/ENEM-Pro/gsc-reports',
    `week-1-2026-07-08.md`
  )
  saveReportToObsidian(report, obsidianPath)
}

export default { createWeeklyReport, saveReportToObsidian, scheduleWeeklyCheck }
