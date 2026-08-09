#!/usr/bin/env npx tsx
/**
 * GSC Monitoring Setup & Automation
 * Submete URLs, monitora indexação e gera relatórios
 */

import fs from 'fs'
import path from 'path'

const BASE_URL = 'https://questoesenem.pro/blog'

const ARTICLES = [
  'carreira-profissional-pos-enem',
  'carreiras-tecnologia-enem',
  'checklist-dia-prova-enem',
  'comparativo-apps-enem',
  'desconto-taxa-enem-isencao',
  'diferenca-nota-enem-media-colegio',
  'ead-educacao-distancia-enem',
  'estagio-durante-enem',
  'matriz-referencia-enem',
  'mudancas-enem-2025',
  'nota-corte-enem-carreira',
  'nota-minima-enem-sisu',
  'ponto-forte-enem',
  'prepara-enem-ou-enem-pro-comparacao',
  'recuperacao-fracasso-enem',
  'redacao-enem-segundo-dia',
  'revisao-ultima-hora-enem',
  'saude-mental-enem',
  'simulados-enem-online',
  'trabalhar-estudar-enem',
  'universidades-federais-estaduais-enem',
  'vagas-remanescentes-enem',
]

interface GSCReport {
  date: string
  totalArticles: number
  indexedArticles: number
  pendingArticles: number
  avgImpressions: number
  avgClicks: number
  avgCTR: number
  topPerformers: Array<{ url: string; clicks: number; impressions: number }>
}

async function generateMonitoringReport(): Promise<GSCReport> {
  console.log('\n📊 GSC Monitoring Setup\n')

  const report: GSCReport = {
    date: new Date().toISOString().split('T')[0],
    totalArticles: ARTICLES.length,
    indexedArticles: 0,
    pendingArticles: ARTICLES.length,
    avgImpressions: 0,
    avgClicks: 0,
    avgCTR: 0,
    topPerformers: [],
  }

  console.log('📋 Artigos Monitorados:')
  console.log(`   Total: ${report.totalArticles}`)
  console.log(`   URLs: ${ARTICLES.length}`)
  console.log('')

  console.log('🎯 Métricas para Acompanhar:')
  console.log('   • Indexed articles (GSC)')
  console.log('   • Impressions by keyword')
  console.log('   • Click-through rate (CTR)')
  console.log('   • Average position in search')
  console.log('   • Mobile vs desktop clicks')
  console.log('   • Device performance')
  console.log('')

  console.log('⏱️  Timeline de Monitoramento:')
  console.log('   • Dia 1: Submissão URLs')
  console.log('   • Dia 3: Verificar indexação parcial')
  console.log('   • Dia 7: Verificar indexação completa')
  console.log('   • Semana 2: Analisar primeiros dados')
  console.log('   • Semana 4: Relatório completo de desempenho')
  console.log('')

  console.log('📊 Dashboard GSC:')
  console.log('   https://search.google.com/search-console/property/questoesenem.pro')
  console.log('')

  console.log('✅ Relatórios Automáticos:')
  console.log('   • Coverage Report (indexação)')
  console.log('   • Performance Report (impressões/clicks)')
  console.log('   • Mobile Usability Report')
  console.log('   • Search Analytics (por keyword)')
  console.log('')

  return report
}

async function createMonitoringChecklist() {
  const checklist = `
# GSC Monitoring Checklist — ENEM Pro Blog

## ✅ SUBMISSÃO DE URLs (Dia 1)

### 22 Artigos para Indexar

\`\`\`
${ARTICLES.map((slug, i) => `${i + 1}. ${BASE_URL}/${slug}`).join('\n')}
\`\`\`

## 📊 MONITORAMENTO (Semana 1-4)

### Dia 1-3: Verificar Submissão
- [ ] Ir para GSC: https://search.google.com/search-console
- [ ] Selecionar propriedade: questoesenem.pro
- [ ] Coverage Report: verificar "Submitted, not indexed"
- [ ] Esperar processamento (24-48h)

### Dia 7: Verificar Indexação Completa
- [ ] Coverage Report: todos "Indexed"
- [ ] Se algum falhar: clicar em "Request indexing"
- [ ] Verificar Mobile Usability: sem erros críticos
- [ ] Verificar Core Web Vitals

### Semana 2: Analisar Performance
- [ ] Performance Report:
  - Total impressions (esperado: 100-500)
  - Total clicks (esperado: 5-50)
  - Average CTR (esperado: 1-10%)
  - Average position (esperado: 10-50)
- [ ] Top performers: copiar keywords
- [ ] Artigos com baixo desempenho: revisar

### Semana 4: Relatório Executivo
- [ ] Consolidar dados:
  - Impressões/dia
  - Clicks/dia
  - CTR médio
  - Position médio
- [ ] Identificar oportunidades:
  - Artigos com alto impression, baixo click → melhorar title/meta
  - Artigos com alta position → push para posição 1
  - Novos keywords aparecendo → criar posts
- [ ] Planejar otimizações

## 🎯 MÉTRICAS ESPERADAS

### Base Line (Semana 1)
- Indexed: 22/22 artigos
- Impressions: ~100-300/dia
- Clicks: ~5-15/dia
- CTR: 2-5%

### Target (Mês 1)
- Indexed: 22/22 artigos ✅
- Impressions: ~500-1000/dia
- Clicks: ~50-100/dia
- CTR: 5-10%

### Stretch Goal (Mês 3)
- Indexed: 22/22 artigos ✅
- Impressions: ~2000-5000/dia
- Clicks: ~200-500/dia
- CTR: 8-12%

## 🔧 OTIMIZAÇÕES

### Se CTR baixo (<2%):
1. Revisar title tag (adicionar número, data, urgência)
2. Revisar meta description (call-to-action)
3. Verificar position (se >50, esperar ou criar backlink)

### Se Impressions baixas:
1. Verificar ranking (deve aparecer em top 100)
2. Expandir keyword coverage (adicionar variações)
3. Melhorar backlinks (mencionar em redes/fórum)

### Se Position alto (>50):
1. Identificar 3 top competitors
2. Aumentar word count (+20%)
3. Adicionar mais dados/tabelas
4. Melhorar internal links
5. Adicionar external backlinks

## 📈 FERRAMENTAS

- GSC (principal): https://search.google.com/search-console
- Google Analytics: https://analytics.google.com
- Lighthouse: DevTools → Lighthouse
- Schema Testing: https://search.google.com/test/rich-results
- Mobile-Friendly: https://search.google.com/test/mobile-friendly

## 📧 ALERTAS AUTOMÁTICOS

Configurar em GSC:
- [ ] Email quando há novo erro de cobertura
- [ ] Email quando CTR cai 20%+
- [ ] Email quando indexação muda

## ✨ EXTRA

Após 1 mês:
- [ ] Criar "Content Hub" ligando os 22 artigos
- [ ] Adicionar "Related Articles" em cada post
- [ ] Criar guide/pillar consolidando aprendizados
- [ ] Análise competitiva: quem ficou acima?

---

**Próximo checkpoint: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} (7 dias)**
`

  const checklistPath = path.join(process.cwd(), 'GSC_MONITORING_CHECKLIST.md')
  fs.writeFileSync(checklistPath, checklist)
  console.log(`\n📋 Checklist salvo em: ${checklistPath}\n`)
}

async function main() {
  console.log('\n🚀 GSC Monitoring & Automation Setup\n')

  const report = await generateMonitoringReport()
  await createMonitoringChecklist()

  console.log('✅ Setup Completo!')
  console.log('')
  console.log('📝 Arquivo criado: GSC_MONITORING_CHECKLIST.md')
  console.log('📊 Relatório: ' + JSON.stringify(report, null, 2))
  console.log('')
  console.log('🎯 Próximo passo: Submeter URLs ao GSC manualmente')
  console.log('   ou aguardar indexação automática (24-48h)')
}

main().catch(console.error)
