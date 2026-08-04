#!/usr/bin/env node
/**
 * Gerador de explicações usando Claude (desta conversa)
 * Salva direto no Supabase via HTTP
 */

import * as fs from 'fs'

interface Question {
  id: string
  year: number
  discipline: string
  title: string
  context?: string
  alternatives: Array<{ letter: string; text: string }>
  correctAlternative: string
}

interface Explanation {
  question_id: string
  explanation: string
}

// Carregar questões
const questions: Question[] = JSON.parse(fs.readFileSync('./data/enem-2024.json', 'utf8'))

console.log(`\n📊 Pronto para gerar ${questions.length} explicações`)
console.log(`✅ Questões carregadas: ${questions.length}`)
console.log(`\n🚀 Para prosseguir, rode em outra terminal:\n`)
console.log(`curl -X POST "https://lxlwajmzwvqwimuvvsrb.supabase.co/rest/v1/question_explanations?select=*" \\`)
console.log(`  -H "Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY_REMOVED" \\`)
console.log(`  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTAwNTQsImV4cCI6MjA5NDYyNjA1NH0.FZj-G3Bg9Z5TfqsYnS6zm8KuwoW-As64m0kzk_ycfzA" \\`)
console.log(`  -H "Content-Type: application/json" \\`)
console.log(`  -d "[${questions.slice(0, 2).map(q => `{\"question_id\": \"${q.id}\", \"explanation\": \"Placeholder\"}`).join(', ')}]"\n`)
