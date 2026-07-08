/**
 * MONITOR: GSC Indexation + Ranking Semanal
 *
 * Roda 1x/semana pra acompanhar:
 * - Quantos posts indexados (baseline → hoje)
 * - Ranking de posts por keyword
 * - Nuevos posts publicados vs indexados
 * - Oportunidades de reforço (posts caindo de ranking)
 *
 * Output: relatório JSON + markdown pra Obsidian
 */

import fs from 'fs'
import path from 'path'

interface GscSnapshot {
  date: string
  indexed: number
  pending: number
  error_404: number
  error_redirect: number
  indexed_urls: string[] // amostra
}

interface RankingData {
  url: string
  keyword: string
  position: number
  impressions: number
  ctr: number
}

interface WeeklyReport {
  week: number
  date: string
  gsc: GscSnapshot
  ranking: RankingData[]
  new_posts_published: number
  new_posts_indexed: number
  posts_dropped_ranking: number
  notes: string
}

// Exemplo de structure (em produção, conectar ao Google Search Console API)
export function createWeeklyReport(weekNumber: number): WeeklyReport {
  const date = new Date()
  const week = Math.floor((date.getDate() - date.getDay() + 4) / 7)

  return {
    week: weekNumber,
    date: date.toISOString().split('T')[0],
    gsc: {
      date: date.toISOString().split('T')[0],
      indexed: 247, // placeholder — conectar a GSC API
      pending: 174,
      error_404: 0,
      error_redirect: 0,
      indexed_urls: [], // placeholder
    },
    ranking: [], // placeholder — conectar a SEMrush/Ahrefs/Rank tracker
    new_posts_published: 0,
    new_posts_indexed: 0,
    posts_dropped_ranking: 0,
    notes: '',
  }
}

// Salvar relatório em Obsidian
export function saveReportToObsidian(report: WeeklyReport, obsidianPath: string) {
  const markdown = `---
date: ${report.date}
week: ${report.week}
---

# GSC + Ranking Report — Semana ${report.week} (${report.date})

## Indexação (Google Search Console)

| Métrica | Valor | Status |
|---------|-------|--------|
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
