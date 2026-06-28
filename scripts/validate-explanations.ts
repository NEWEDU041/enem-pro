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

interface ExplanationQuality {
  question_id: string
  length: number
  quality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'needs_regen'
  issues: string[]
}

async function validateExplanations() {
  console.log('🔍 Validating question explanations...\n')

  const { data: allExplanations } = await sb
    .from('question_explanations')
    .select('question_id, explanation')

  if (!allExplanations || allExplanations.length === 0) {
    console.log('❌ No explanations found')
    return
  }

  const results: ExplanationQuality[] = []
  let excellent = 0
  let good = 0
  let acceptable = 0
  let poor = 0
  let needsRegen = 0

  console.log(`📊 Analyzing ${allExplanations.length} explanations...\n`)

  for (const exp of allExplanations) {
    const text = exp.explanation || ''
    const length = text.length
    const issues: string[] = []

    // Quality checks
    if (length < 100) {
      issues.push('too_short')
      needsRegen++
    } else if (length < 200) {
      issues.push('could_be_longer')
      acceptable++
    } else if (length < 500) {
      good++
    } else {
      excellent++
    }

    // Content checks
    if (text.toLowerCase().includes('error')) issues.push('contains_error')
    if (text.toLowerCase().includes('unable') || text.toLowerCase().includes('cannot')) issues.push('negative_tone')
    if (!text.includes('.')) issues.push('no_periods')
    if (text.includes('undefined')) issues.push('undefined_value')
    if (text.length === 0) {
      issues.push('empty')
      needsRegen++
    }

    const quality = issues.length > 0
      ? (needsRegen > 0 ? 'needs_regen' : poor > 0 ? 'poor' : 'acceptable')
      : (length < 200 ? 'good' : 'excellent')

    results.push({
      question_id: exp.question_id,
      length,
      quality,
      issues,
    })
  }

  // Print summary
  console.log('📈 Summary:')
  console.log(`   ✅ Excellent (≥500 chars): ${excellent}`)
  console.log(`   ✓ Good (200-500 chars): ${good}`)
  console.log(`   ⚠️  Acceptable (100-200 chars): ${acceptable}`)
  console.log(`   ❌ Poor (<100 chars, needs regen): ${needsRegen}`)
  console.log(`\nTotal: ${allExplanations.length} explanations`)
  console.log(`Quality: ${Math.round((excellent + good) / allExplanations.length * 100)}% good or better\n`)

  // List items needing regeneration
  if (needsRegen > 0) {
    console.log('🔄 Questions needing regeneration:')
    results
      .filter(r => r.quality === 'needs_regen')
      .slice(0, 10)
      .forEach(r => {
        console.log(`   - ${r.question_id}: ${r.length} chars | Issues: ${r.issues.join(', ')}`)
      })
    if (needsRegen > 10) {
      console.log(`   ... and ${needsRegen - 10} more`)
    }
  }

  // Return summary for regeneration
  return {
    total: allExplanations.length,
    excellent,
    good,
    acceptable,
    poor: needsRegen,
    needsRegen: results.filter(r => r.quality === 'needs_regen').map(r => r.question_id),
  }
}

// Run validation
validateExplanations().then(summary => {
  if (summary && summary.needsRegen.length > 0) {
    console.log(`\n💡 Next: Regenerate ${summary.needsRegen.length} poor explanations`)
    console.log('   npx tsx scripts/regenerate-poor-explanations.ts')
  }
}).catch(console.error)
