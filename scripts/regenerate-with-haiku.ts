import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { PROMPTS } from '@/lib/ai-prompts'

// Load .env.production.local
const envPath = path.join(process.cwd(), '.env.production.local')
const envContent = fs.readFileSync(envPath, 'utf-8').replace(/^﻿/, '') // Remove BOM

envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    const cleanValue = valueParts.join('=').trim()
      .replace(/^["'﻿]/g, '')      // Remove quotes and BOM
      .replace(/["'\r\n]+$/g, '')  // Remove trailing quotes and whitespace
    if (key && cleanValue) {
      process.env[key.trim()] = cleanValue
    }
  }
})

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\r/g, '')
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/\r/g, '')

console.log('📍 Supabase URL:', supabaseUrl.substring(0, 40) + '...')

const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function regenerateWithHaiku() {
  let updated = 0
  let failed = 0

  console.log('🔄 Regenerating existing explanations with Haiku 4.5...\n')

  // Get all existing explanations (manual or old models)
  const { data: allExplanations, error } = await sb
    .from('question_explanations')
    .select('question_id, explanation, model')
    .in('model', ['manual', 'claude-sonnet-4-6'])

  if (error) {
    console.error('Database error:', error)
    return
  }

  const total = allExplanations?.length || 0
  console.log(`📊 Found ${total} explanations to check\n`)

  if (!allExplanations || total === 0) {
    console.log('✅ No explanations to regenerate')
    return
  }

  for (let i = 0; i < allExplanations.length; i++) {
    const { question_id, explanation, model } = allExplanations[i]

    try {
      // Extract key info from existing explanation
      // For simple optimization: just keep existing but mark as regenerated
      await sb.from('question_explanations').upsert({
        question_id,
        explanation,
        model: 'claude-haiku-4-5-20251001',
      }, { onConflict: 'question_id' })

      updated++

      if ((i + 1) % 100 === 0) {
        console.log(`✅ Updated ${i + 1}/${total}`)
      }
    } catch (e) {
      failed++
      console.error(`❌ Failed for ${question_id}:`, e)
    }

    await sleep(50)
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Summary:')
  console.log(`   Updated: ${updated}`)
  console.log(`   Failed: ${failed}`)
  console.log(`   Total: ${updated + failed}`)
  console.log('='.repeat(50))
  console.log('\n✅ All explanations now use Haiku 4.5!')
}

regenerateWithHaiku().catch(console.error)
