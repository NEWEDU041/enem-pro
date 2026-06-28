import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { fetchQuestionsByYear, YEARS } from '@/lib/enem-api'
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

async function completeAllQuestions() {
  console.log('🚀 Completing all question explanations...\n')

  let totalGenerated = 0
  let totalFailed = 0
  let totalSkipped = 0

  for (const year of YEARS) {
    console.log(`\n📅 Processing ${year}...`)

    try {
      const allQuestions = await fetchQuestionsByYear(year)
      console.log(`   Found ${allQuestions.length} questions`)

      // Check which ones already have explanations
      const { data: existing } = await sb
        .from('question_explanations')
        .select('question_id')

      const existingIds = new Set(existing?.map(e => e.question_id) || [])
      const toGenerate = allQuestions.filter(q => !existingIds.has(q.id))

      console.log(`   Already cached: ${existingIds.size}`)
      console.log(`   To generate: ${toGenerate.length}`)

      for (let i = 0; i < toGenerate.length; i++) {
        const q = toGenerate[i]

        try {
          const msg = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 400,
            system: PROMPTS.EXPLAIN_ANSWER,
            messages: [{
              role: 'user',
              content: `${q.title}\n\nAlternativas:\n${q.alternatives.map((a: any) => `${a.letter}) ${a.text}`).join('\n')}\n\nCorreta: ${q.correctAlternative}`,
            }],
          })

          const explanation = msg.content[0].type === 'text' ? msg.content[0].text : ''

          await sb.from('question_explanations').upsert({
            question_id: q.id,
            explanation,
            model: 'claude-haiku-4-5-20251001',
            year,
          }, { onConflict: 'question_id' })

          totalGenerated++

          if ((i + 1) % 50 === 0) {
            console.log(`   ✅ Generated ${i + 1}/${toGenerate.length}`)
          }
        } catch (e) {
          totalFailed++
          console.error(`   ❌ Failed for ${q.id}:`, e)
        }

        await sleep(250) // Rate limiting
      }

      if (toGenerate.length === 0) {
        totalSkipped += allQuestions.length
      }

      console.log(`   ✅ Complete`)
    } catch (e) {
      console.error(`   ❌ Year ${year} failed:`, e)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Final Summary:')
  console.log(`   ✅ Generated: ${totalGenerated}`)
  console.log(`   ⏭️  Skipped (cached): ${totalSkipped}`)
  console.log(`   ❌ Failed: ${totalFailed}`)
  console.log(`   Total: ${totalGenerated + totalSkipped + totalFailed}`)
  console.log('='.repeat(50))

  if (totalGenerated > 0) {
    console.log(`\n💰 Cost: ~${Math.round(totalGenerated * 300 * 0.000001)} (Haiku tokens)`)
  }
}

completeAllQuestions().catch(console.error)
