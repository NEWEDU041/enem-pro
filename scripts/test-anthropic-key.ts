import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.production.local')
const envContent = fs.readFileSync(envPath, 'latin1')

const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) return

  const key = trimmed.slice(0, eqIdx).trim()
  let val = trimmed.slice(eqIdx + 1).trim()
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1)
  }
  val = val.replace(/^\xef\xbb\xbf/, '').replace(/\r?\n$/, '').trim()
  if (key && val) env[key] = val
})

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY || '' })

async function main() {
  console.log('🔍 Testing ANTHROPIC_API_KEY from .env.production.local...\n')

  try {
    const test = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'test' }],
    })
    console.log('✅ ANTHROPIC_API_KEY is VALID!\n')
    console.log('Ready to generate explanations.')
  } catch (e: any) {
    console.log('❌ ANTHROPIC_API_KEY is INVALID')
    console.log('Error:', e.message)
    process.exit(1)
  }
}

main().catch(e => {
  console.error('Error:', e)
  process.exit(1)
})
