#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

console.log('📧 SETUP AUTO-EMAIL-DIGEST')

const workflowContent = `name: Auto Email Digest

on:
  schedule:
    - cron: '0 8 * * 1'  # Monday 8 AM UTC

jobs:
  send-digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Generate and Send Digest
        env:
          MAILCHIMP_API_KEY: \${{ secrets.MAILCHIMP_API_KEY }}
          MAILCHIMP_LIST_ID: \${{ secrets.MAILCHIMP_LIST_ID }}
        run: node scripts/run-email-digest.js
`

const workflowDir = path.join(__dirname, '../.github/workflows')
fs.writeFileSync(path.join(workflowDir, 'auto-email-digest.yml'), workflowContent, 'utf-8')

console.log('✅ Auto-Email-Digest setup completo')
console.log('   Frequência: Toda segunda 8h (UTC)')
console.log('   Conteúdo: Top 3 posts + CTA + links sociais')
console.log('')
