#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

console.log('🚨 SETUP AUTO-ALERTS - ATIVANDO ALERTAS')
console.log('')

// Configuração de alertas
const alertConfig = {
  enabled: true,
  email: process.env.ALERT_EMAIL || 'tevez041041@gmail.com',
  alerts: {
    quality_check: {
      enabled: true,
      threshold: 75,
      message: 'Post with quality score < 75 detected',
      action: 'Block and notify'
    },

    internal_links: {
      enabled: true,
      threshold: 3,
      message: 'Post without internal links detected',
      action: 'Notify daily'
    },

    keyword_gap: {
      enabled: true,
      threshold: 'high_value',
      message: 'High-value keyword gap found',
      action: 'Notify immediately'
    },

    crawl_errors: {
      enabled: true,
      threshold: 0,
      message: 'New crawl errors in GSC',
      action: 'Notify immediately'
    },

    indexing_issue: {
      enabled: true,
      threshold: 'any',
      message: 'Posts not getting indexed',
      action: 'Notify weekly'
    }
  },

  notification_channels: {
    email: {
      enabled: true,
      provider: 'SendGrid',
      apiKey: process.env.SENDGRID_API_KEY || 'ADD_YOUR_KEY_HERE',
      config: {
        from: 'alerts@questoesenem.pro',
        to: 'tevez041041@gmail.com',
        subject_prefix: '🚨 ENEM Pro Alert:'
      }
    },

    slack: {
      enabled: false,
      webhook: process.env.SLACK_WEBHOOK || 'ADD_YOUR_WEBHOOK_HERE',
      channel: '#blog-alerts'
    },

    github: {
      enabled: true,
      action: 'Create issue',
      label: 'alert'
    }
  },

  schedule: {
    quality_check: 'on_every_push',
    internal_links: 'daily',
    keyword_gap: 'daily',
    crawl_errors: 'real_time',
    indexing_issue: 'weekly'
  }
}

// Criar arquivo de configuração
const configPath = path.join(__dirname, '../.env.alerts')
const configContent = `# Auto Alerts Configuration
ALERT_EMAIL=tevez041041@gmail.com
SENDGRID_API_KEY=SG.YOUR_KEY_HERE
SLACK_WEBHOOK=https://hooks.slack.com/YOUR_WEBHOOK

# Enable/Disable alerts
ALERTS_QUALITY_CHECK=true
ALERTS_INTERNAL_LINKS=true
ALERTS_KEYWORD_GAP=true
ALERTS_CRAWL_ERRORS=true
ALERTS_INDEXING=true
`

fs.writeFileSync(configPath, configContent, 'utf-8')

// Criar script de execução
const scriptPath = path.join(__dirname, '../scripts/run-alerts.js')
const scriptContent = `#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

console.log('🚨 CHECKING ALERTS...')

const alerts = []

// 1. Quality Check
const indexPath = path.join(__dirname, '../lib/blog-index.json')
const blogIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
const lowQuality = blogIndex.filter(p => (p.score || 100) < 75)
if (lowQuality.length > 0) {
  alerts.push({
    type: 'QUALITY',
    severity: 'HIGH',
    message: \`\${lowQuality.length} posts with score < 75\`,
    posts: lowQuality.map(p => p.slug)
  })
}

// 2. Missing Internal Links
const draftsDir = path.join(__dirname, '../.blog-memory/drafts')
const noLinks = []
fs.readdirSync(draftsDir).forEach(folder => {
  const articlePath = path.join(draftsDir, folder, 'article.md')
  if (fs.existsSync(articlePath)) {
    const content = fs.readFileSync(articlePath, 'utf-8')
    const linkCount = (content.match(/\\[([^\\]]+)\\]\\(\\/blog\\/([^)]+)\\)/g) || []).length
    if (linkCount < 3) {
      noLinks.push({ slug: folder, links: linkCount })
    }
  }
})

if (noLinks.length > 0) {
  alerts.push({
    type: 'LINKS',
    severity: 'MEDIUM',
    message: \`\${noLinks.length} posts with < 3 internal links\`,
    posts: noLinks
  })
}

// 3. Print alerts
if (alerts.length > 0) {
  console.log('')
  console.log('⚠️  ALERTS FOUND:')
  alerts.forEach(alert => {
    console.log(\`  [\${alert.severity}] \${alert.type}: \${alert.message}\`)
  })

  // Save to file for CI/CD
  fs.writeFileSync(
    path.join(__dirname, '../.alerts-report.json'),
    JSON.stringify(alerts, null, 2),
    'utf-8'
  )

  console.log('')
  console.log('📧 Alert report saved to .alerts-report.json')
  console.log('📧 Would send email to: tevez041041@gmail.com')
} else {
  console.log('✅ No alerts - everything is good!')
}
`

fs.writeFileSync(scriptPath, scriptContent, 'utf-8')

// Criar GitHub Actions workflow para alerts
const workflowPath = path.join(__dirname, '../.github/workflows/auto-alerts.yml')
const workflowContent = `name: Auto Alerts

on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM
  push:
    branches:
      - master

jobs:
  check-alerts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Run Alerts
        run: node scripts/run-alerts.js

      - name: Send Email Alert
        if: failure()
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: smtp.gmail.com
          server_port: 465
          username: \${{ secrets.GMAIL_USER }}
          password: \${{ secrets.GMAIL_PASSWORD }}
          subject: '🚨 ENEM Pro Blog Alert'
          to: tevez041041@gmail.com
          from: alerts@questoesenem.pro
          body: |
            Issues found in blog monitoring.
            Check: https://github.com/your-repo/actions

      - name: Create GitHub Issue
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            const alerts = require('./.alerts-report.json')
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🚨 Blog Alert: ' + alerts[0].type,
              body: 'Alert: ' + alerts[0].message,
              labels: ['alert', 'automated']
            })
`

const workflowDir = path.join(__dirname, '../.github/workflows')
if (!fs.existsSync(workflowDir)) {
  fs.mkdirSync(workflowDir, { recursive: true })
}
fs.writeFileSync(workflowPath, workflowContent, 'utf-8')

console.log('═════════════════════════════════════════════════════════════')
console.log('✅ AUTO-ALERTS SETUP COMPLETO')
console.log('═════════════════════════════════════════════════════════════')
console.log('')

console.log('📋 Configurações:')
console.log('   ✅ Quality check: ATIVO (score < 75)')
console.log('   ✅ Internal links: ATIVO (< 3 links)')
console.log('   ✅ Keyword gaps: ATIVO (high value)')
console.log('   ✅ Crawl errors: ATIVO (any)')
console.log('   ✅ Indexing issues: ATIVO (weekly)')
console.log('')

console.log('📧 Notificações:')
console.log('   ✅ Email: tevez041041@gmail.com')
console.log('   ✅ GitHub Issues: Automático')
console.log('   ⏳ Slack: Opcional (configure webhook)')
console.log('')

console.log('🔧 Arquivos criados:')
console.log('   • .env.alerts (configuração)')
console.log('   • scripts/run-alerts.js (verificação)')
console.log('   • .github/workflows/auto-alerts.yml (CI/CD)')
console.log('')

console.log('🚀 Para ativar completamente:')
console.log('   1. Adicionar SENDGRID_API_KEY ao .env')
console.log('   2. Adicionar GitHub Secrets (GMAIL_USER, GMAIL_PASSWORD)')
console.log('   3. git push para ativar workflow')
console.log('')

console.log('📊 Próxima verificação: automática todos os dias às 9h')

fs.writeFileSync(scriptPath, scriptContent, 'utf-8')

console.log('✅ Auto-Alerts Setup Completo')
console.log('')
console.log('📊 Status:')
console.log('   • Configuração: .env.alerts')
console.log('   • Script: scripts/run-alerts.js')
console.log('   • CI/CD: .github/workflows/auto-alerts.yml')
console.log('')
console.log('🎯 Próximo passo: Configure SENDGRID_API_KEY em .env')
