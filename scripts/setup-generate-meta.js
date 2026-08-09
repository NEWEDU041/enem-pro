#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

console.log('✍️  SETUP AUTO-GENERATE-META')

const workflowContent = `name: Auto Generate Meta

on:
  schedule:
    - cron: '0 0 * * 0'  # Sunday midnight UTC

jobs:
  generate-meta:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Generate Meta Descriptions
        env:
          CLAUDE_API_KEY: \${{ secrets.CLAUDE_API_KEY }}
        run: node scripts/run-generate-meta.js
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "Auto Meta Bot"
          git add .blog-memory/drafts/
          git commit -m "🤖 Auto: Updated meta descriptions" || true
          git push
`

const workflowDir = path.join(__dirname, '../.github/workflows')
fs.writeFileSync(path.join(workflowDir, 'auto-generate-meta.yml'), workflowContent, 'utf-8')

console.log('✅ Auto-Generate-Meta setup completo')
console.log('   Frequência: Toda semana (domingo meia-noite)')
console.log('   Função: Gera 3 variações de meta + testa melhor')
console.log('')
