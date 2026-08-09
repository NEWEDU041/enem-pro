#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

console.log('📱 SETUP AUTO-SOCIAL-POSTING')

const workflowContent = `name: Auto Social Posting

on:
  schedule:
    - cron: '0 9,12,15,18 * * *'  # 4x daily: 9am, 12pm, 3pm, 6pm UTC

jobs:
  post-to-social:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Post to Social Media
        env:
          BUFFER_API_KEY: \${{ secrets.BUFFER_API_KEY }}
        run: node scripts/run-social-posting.js
`

const workflowDir = path.join(__dirname, '../.github/workflows')
fs.writeFileSync(path.join(workflowDir, 'auto-social-posting.yml'), workflowContent, 'utf-8')

console.log('✅ Auto-Social-Posting setup completo')
console.log('   Frequência: 4x por dia (9h, 12h, 15h, 18h UTC)')
console.log('   Plataformas: TikTok, Instagram, Twitter, LinkedIn')
console.log('')
