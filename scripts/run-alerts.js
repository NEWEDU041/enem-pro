#!/usr/bin/env node
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
    message: `${lowQuality.length} posts with score < 75`,
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
    const linkCount = (content.match(/\[([^\]]+)\]\(\/blog\/([^)]+)\)/g) || []).length
    if (linkCount < 3) {
      noLinks.push({ slug: folder, links: linkCount })
    }
  }
})

if (noLinks.length > 0) {
  alerts.push({
    type: 'LINKS',
    severity: 'MEDIUM',
    message: `${noLinks.length} posts with < 3 internal links`,
    posts: noLinks
  })
}

// 3. Print alerts
if (alerts.length > 0) {
  console.log('')
  console.log('⚠️  ALERTS FOUND:')
  alerts.forEach(alert => {
    console.log(`  [${alert.severity}] ${alert.type}: ${alert.message}`)
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
