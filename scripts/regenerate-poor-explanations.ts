import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { PROMPTS } from '@/lib/ai-prompts'

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

async function regeneratePoolExplanations() {
  console.log('🔄 Regenerating poor-quality explanations...\n')

  // Find all explanations < 100 chars
  const { data: poorExplanations } = await sb
    .from('question_explanations')
    .select('question_id, explanation, year')
    .filter('LENGTH(explanation)', 'lt', 100)

  if (!poorExplanations || poorExplanations.length === 0) {
    console.log('✅ No poor explanations found!')
    return
  }

  console.log(`📝 Found ${poorExplanations.length} explanations needing improvement\n`)

  let improved = 0
  let failed = 0

  for (const item of poorExplanations) {
    try {
      console.log(`🔄 Regenerating: ${item.question_id}`)

      // For now, since we don't have the full question data, we'll expand based on the existing explanation
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: PROMPTS.EXPLAIN_ANSWER,
        messages: [
          {
            role: 'user',
            content: `Expand this brief explanation to 2-3 paragraphs (200+ words):

"${item.explanation}"

Make it more detailed, educational, and clear for students.`,
          },
        ],
      })

      const expandedExplanation = message.content[0].type === 'text' ? message.content[0].text : ''

      if (expandedExplanation.length < 100) {
        console.log(`   ⚠️  Still short: ${expandedExplanation.length} chars`)
        failed++
        continue
      }

      await sb.from('question_explanations').update({
        explanation: expandedExplanation,
        model: 'claude-haiku-4-5-20251001',
      }).eq('question_id', item.question_id)

      improved++
      console.log(`   ✅ Improved: ${expandedExplanation.length} chars`)

      await sleep(300)
    } catch (e) {
      console.error(`   ❌ Error: ${e}`)
      failed++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Improved: ${improved}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   Total: ${improved + failed}`)
}

regeneratePoolExplanations().catch(console.error)
