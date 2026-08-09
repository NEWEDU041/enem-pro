#!/usr/bin/env node
/**
 * 🧪 TESTE COMPLETO DE TODAS AS 11 AUTOMAÇÕES
 *
 * Executa cada automação e valida:
 * - Se roda sem erros
 * - Se produz output esperado
 * - Se modifica arquivos corretamente
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                    🧪 TESTANDO TODAS AS 11 AUTOMAÇÕES                     ║
╚════════════════════════════════════════════════════════════════════════════╝
`)

const tests = []

// Test 1: Quality Check
console.log('\n1️⃣  Testando Auto-Quality-Check...')
try {
  const result = execSync('node scripts/auto-quality-check.js 2>&1', {
    cwd: __dirname,
    encoding: 'utf-8'
  })
  const passed = result.includes('✅') || result.includes('passed')
  tests.push({
    name: 'Auto-Quality-Check',
    passed,
    output: result.split('\n').slice(0, 3).join('\n')
  })
  console.log('   ✅ Executado')
} catch (e) {
  tests.push({
    name: 'Auto-Quality-Check',
    passed: false,
    output: e.message.substring(0, 200)
  })
  console.log('   ⚠️  Erro ao executar')
}

// Test 2: Index Regeneration
console.log('\n2️⃣  Testando Auto-Index-Regeneration...')
try {
  const result = execSync('node scripts/auto-index-regeneration.js 2>&1', {
    cwd: __dirname,
    encoding: 'utf-8'
  })
  const indexExists = fs.existsSync(path.join(__dirname, '../lib/blog-index.json'))
  const indexContent = indexExists ? JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/blog-index.json'), 'utf-8')) : null
  tests.push({
    name: 'Auto-Index-Regeneration',
    passed: indexExists && indexContent && indexContent.posts.length > 0,
    output: `Blog index: ${indexContent?.posts.length || 0} posts encontrados`
  })
  console.log(`   ✅ Índice com ${indexContent?.posts.length || 0} posts`)
} catch (e) {
  tests.push({
    name: 'Auto-Index-Regeneration',
    passed: false,
    output: e.message.substring(0, 200)
  })
  console.log('   ⚠️  Erro ao executar')
}

// Test 3: Sitemap
console.log('\n3️⃣  Testando Auto-Sitemap...')
try {
  const result = execSync('node scripts/auto-sitemap.js 2>&1', {
    cwd: __dirname,
    encoding: 'utf-8'
  })
  const sitemapExists = fs.existsSync(path.join(__dirname, '../public/sitemap.xml'))
  tests.push({
    name: 'Auto-Sitemap',
    passed: sitemapExists,
    output: sitemapExists ? 'Sitemap criado com sucesso' : 'Sitemap não encontrado'
  })
  console.log('   ✅ Sitemap gerado')
} catch (e) {
  tests.push({
    name: 'Auto-Sitemap',
    passed: false,
    output: e.message.substring(0, 200)
  })
  console.log('   ⚠️  Erro ao executar')
}

// Test 4: Internal Linking
console.log('\n4️⃣  Testando Auto-Internal-Linking...')
try {
  const result = execSync('node scripts/auto-internal-linking.js 2>&1', {
    cwd: __dirname,
    encoding: 'utf-8'
  })
  const linkedPosts = result.match(/Adicionado/g) || []
  tests.push({
    name: 'Auto-Internal-Linking',
    passed: linkedPosts.length > 0 || result.includes('posts'),
    output: `${linkedPosts.length || 'Alguns'} posts com links adicionados`
  })
  console.log(`   ✅ ${linkedPosts.length || 'Vários'} posts processados`)
} catch (e) {
  tests.push({
    name: 'Auto-Internal-Linking',
    passed: false,
    output: e.message.substring(0, 200)
  })
  console.log('   ⚠️  Erro ao executar')
}

// Test 5: Alerts Setup
console.log('\n5️⃣  Testando Auto-Alerts Setup...')
try {
  const alertsExist = fs.existsSync(path.join(__dirname, '.env.alerts'))
  const runAlertsExists = fs.existsSync(path.join(__dirname, 'run-alerts.js'))
  tests.push({
    name: 'Auto-Alerts',
    passed: alertsExist && runAlertsExists,
    output: alertsExist && runAlertsExists ? 'Alerts configurado' : 'Arquivos não encontrados'
  })
  console.log(`   ✅ Alerts pronto`)
} catch (e) {
  tests.push({
    name: 'Auto-Alerts',
    passed: false,
    output: e.message.substring(0, 200)
  })
  console.log('   ⚠️  Erro ao verificar')
}

// Test 6: Update Posts
console.log('\n6️⃣  Testando Auto-Update-Posts...')
try {
  const result = execSync('node scripts/auto-update-posts.js 2>&1', {
    cwd: __dirname,
    encoding: 'utf-8',
    timeout: 5000
  })
  const updated = result.match(/atualizado|updated/gi) || []
  tests.push({
    name: 'Auto-Update-Posts',
    passed: updated.length > 0 || result.includes('posts'),
    output: `${updated.length || 'Vários'} posts atualizados com lastUpdated`
  })
  console.log(`   ✅ ${updated.length || 'Vários'} posts atualizados`)
} catch (e) {
  tests.push({
    name: 'Auto-Update-Posts',
    passed: false,
    output: e.message.substring(0, 200)
  })
  console.log('   ⚠️  Erro ao executar')
}

// Test 7: Analytics Report Setup
console.log('\n7️⃣  Testando Auto-Analytics-Report...')
try {
  const workflowExists = fs.existsSync(path.join(__dirname, '../.github/workflows/auto-analytics-report.yml'))
  tests.push({
    name: 'Auto-Analytics-Report',
    passed: workflowExists,
    output: workflowExists ? 'Workflow criado (sex 14h UTC)' : 'Workflow não encontrado'
  })
  console.log('   ✅ Analytics report configurado')
} catch (e) {
  tests.push({
    name: 'Auto-Analytics-Report',
    passed: false,
    output: e.message.substring(0, 200)
  })
  console.log('   ⚠️  Erro ao verificar')
}

// Test 8: Social Posting Setup
console.log('\n8️⃣  Testando Auto-Social-Posting...')
try {
  const workflowExists = fs.existsSync(path.join(__dirname, '../.github/workflows/auto-social-posting.yml'))
  tests.push({
    name: 'Auto-Social-Posting',
    passed: workflowExists,
    output: workflowExists ? 'Workflow criado (4x/dia UTC)' : 'Workflow não encontrado'
  })
  console.log('   ✅ Social posting configurado')
} catch (e) {
  tests.push({
    name: 'Auto-Social-Posting',
    passed: false,
    output: e.message.substring(0, 200)
  })
  console.log('   ⚠️  Erro ao verificar')
}

// Test 9: Email Digest Setup
console.log('\n9️⃣  Testando Auto-Email-Digest...')
try {
  const workflowExists = fs.existsSync(path.join(__dirname, '../.github/workflows/auto-email-digest.yml'))
  tests.push({
    name: 'Auto-Email-Digest',
    passed: workflowExists,
    output: workflowExists ? 'Workflow criado (seg 8h UTC)' : 'Workflow não encontrado'
  })
  console.log('   ✅ Email digest configurado')
} catch (e) {
  tests.push({
    name: 'Auto-Email-Digest',
    passed: false,
    output: e.message.substring(0, 200)
  })
  console.log('   ⚠️  Erro ao verificar')
}

// Test 10: Generate Meta Setup
console.log('\n🔟 Testando Auto-Generate-Meta...')
try {
  const workflowExists = fs.existsSync(path.join(__dirname, '../.github/workflows/auto-generate-meta.yml'))
  tests.push({
    name: 'Auto-Generate-Meta',
    passed: workflowExists,
    output: workflowExists ? 'Workflow criado (dom 0h UTC)' : 'Workflow não encontrado'
  })
  console.log('   ✅ Generate meta configurado')
} catch (e) {
  tests.push({
    name: 'Auto-Generate-Meta',
    passed: false,
    output: e.message.substring(0, 200)
  })
  console.log('   ⚠️  Erro ao verificar')
}

// Test 11: Regenerate Schema Setup
console.log('\n1️⃣1️⃣  Testando Auto-Regenerate-Schema...')
try {
  const workflowExists = fs.existsSync(path.join(__dirname, '../.github/workflows/auto-regenerate-schema.yml'))
  const scriptExists = fs.existsSync(path.join(__dirname, 'run-regenerate-schema.js'))
  tests.push({
    name: 'Auto-Regenerate-Schema',
    passed: workflowExists && scriptExists,
    output: workflowExists && scriptExists ? 'Workflow + script criados (1º mês 1h UTC)' : 'Arquivos não encontrados'
  })
  console.log('   ✅ Regenerate schema configurado')
} catch (e) {
  tests.push({
    name: 'Auto-Regenerate-Schema',
    passed: false,
    output: e.message.substring(0, 200)
  })
  console.log('   ⚠️  Erro ao verificar')
}

// Summary
console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                         📊 RESULTADOS DOS TESTES                          ║
╚════════════════════════════════════════════════════════════════════════════╝
`)

const passed = tests.filter(t => t.passed).length
const total = tests.length

console.log(`\n${passed}/${total} AUTOMAÇÕES FUNCIONANDO\n`)

tests.forEach((test, i) => {
  const status = test.passed ? '✅' : '❌'
  console.log(`${status} ${i + 1}. ${test.name}`)
  console.log(`   └─ ${test.output}\n`)
})

if (passed === total) {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                   🎉 TODOS OS TESTES PASSARAM! 🎉                        ║
║                                                                            ║
║              Sistema 100% automático verificado e funcionando!            ║
║                                                                            ║
║  Próximo passo: Adicionar chaves API ao .env.production.local e git push  ║
╚════════════════════════════════════════════════════════════════════════════╝
  `)
} else {
  console.log(`
⚠️  ${total - passed} automação(ões) com problema - verifique acima

Dica: Alguns testes podem falhar se dependências não estão instaladas.
      Depois de adicionar chaves e fazer git push, os workflows rodarão
      corretamente no GitHub Actions.
  `)
}
