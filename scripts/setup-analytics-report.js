#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

console.log('📊 SETUP AUTO-ANALYTICS-REPORT')
console.log('')

// Criar workflow
const workflowContent = `name: Auto Analytics Report

on:
  schedule:
    - cron: '0 14 * * 5'  # Friday 2 PM UTC

jobs:
  generate-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Generate Analytics Report
        env:
          GOOGLE_ANALYTICS_ID: \${{ secrets.GOOGLE_ANALYTICS_ID }}
          SENDGRID_API_KEY: \${{ secrets.SENDGRID_API_KEY }}
        run: |
          node scripts/run-analytics-report.js

      - name: Send Report Email
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: smtp.sendgrid.net
          server_port: 587
          username: apikey
          password: \${{ secrets.SENDGRID_API_KEY }}
          subject: '📊 ENEM Pro Weekly Report'
          to: tevez041041@gmail.com
          from: reports@questoesenem.pro
          body: 'Weekly analytics report attached'
`

const workflowDir = path.join(__dirname, '../.github/workflows')
if (!fs.existsSync(workflowDir)) fs.mkdirSync(workflowDir, { recursive: true })
fs.writeFileSync(path.join(workflowDir, 'auto-analytics-report.yml'), workflowContent, 'utf-8')

console.log('✅ Auto-Analytics-Report setup completo')
console.log('   Frequência: Toda sexta 14h (UTC)')
console.log('   Envia: Email com Top 10 posts, CTR, keywords')
console.log('')
