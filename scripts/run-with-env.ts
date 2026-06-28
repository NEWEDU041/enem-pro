import * as fs from 'fs'
import * as path from 'path'

// Load .env.production.local
const envPath = path.join(process.cwd(), '.env.production.local')
const envContent = fs.readFileSync(envPath, 'utf-8')

envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
    if (key) {
      process.env[key.trim()] = value
    }
  }
})

console.log('✅ Environment variables loaded')
console.log(`   SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 40)}...`)
console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY?.substring(0, 20)}...`)
console.log('')

// Now run the regeneration
import('./regenerate-with-haiku').then(m => m.default?.())
