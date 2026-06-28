import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load env
const envPath = path.join(process.cwd(), '.env.production.local')
const envContent = fs.readFileSync(envPath, 'utf-8').replace(/^﻿/, '')

envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    const cleanValue = valueParts.join('=').trim()
      .replace(/^["'﻿]/g, '')
      .replace(/["'\r\n]+$/g, '')
    if (key && cleanValue) {
      process.env[key.trim()] = cleanValue
    }
  }
})

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function fixShortQuestions() {
  console.log('🔧 Melhorando questões com respostas muito curtas...\n')

  // Get very short explanations (< 100 chars)
  const { data: shortOnes } = await sb
    .from('question_explanations')
    .select('question_id, explanation')
    .filter('LENGTH(explanation)', 'lt', 100)

  if (!shortOnes || shortOnes.length === 0) {
    console.log('✅ Nenhuma questão muito curta encontrada!')
    return
  }

  console.log(`📝 Encontrado ${shortOnes.length} questão(ões) muito curta(s)\n`)

  let improved = 0
  let failed = 0

  for (const q of shortOnes) {
    try {
      console.log(`🔄 Expandindo: ${q.question_id}`)
      console.log(`   Antes (${q.explanation.length} chars): "${q.explanation.substring(0, 50)}..."`)

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: `Você é professor especialista ENEM. Expanda explicações mantendo precisão técnica.
Escreva 2-3 parágrafos completos (250+ palavras).
Seja claro, didático e educativo.`,
        messages: [{
          role: 'user',
          content: `Expanda esta explicação de questão ENEM, mantendo a resposta correta e sendo mais detalhado:

"${q.explanation}"

Faça uma explicação completa e educativa (250+ palavras).`,
        }],
      })

      const expanded = message.content[0].type === 'text' ? message.content[0].text : ''

      if (expanded.length < 150) {
        console.log(`   ⚠️  Ainda muito curta: ${expanded.length} chars`)
        failed++
        continue
      }

      // Update
      await sb.from('question_explanations').update({
        explanation: expanded,
        model: 'claude-haiku-4-5-20251001',
      }).eq('question_id', q.question_id)

      improved++
      console.log(`   ✅ Expandida para ${expanded.length} chars`)
      console.log(`   Preview: "${expanded.substring(0, 80)}..."`)

      await sleep(400)
    } catch (e) {
      console.error(`   ❌ Erro: ${e}`)
      failed++
    }
  }

  console.log(`\n📊 Resultado:`)
  console.log(`   ✅ Melhoradas: ${improved}`)
  console.log(`   ❌ Falhadas: ${failed}`)
  console.log(`   Total: ${improved + failed}`)

  if (improved > 0) {
    console.log(`\n💰 Custo: ~$${(improved * 400 * 0.000001).toFixed(4)}`)
    console.log(`✨ ${improved} questão(ões) agora com explicações completas!`)
  }
}

fixShortQuestions().catch(console.error)
