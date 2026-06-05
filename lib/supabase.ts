import { createClient } from '@supabase/supabase-js'

// Strip BOM (U+FEFF) and CR/LF that PowerShell injects when setting env vars
function cleanEnv(val: string | undefined): string {
  return (val || '').replace(new RegExp(String.fromCharCode(65279), 'g'), '').replace(/[\r\n]/g, '').trim()
}

export function createBrowserClient() {
  return createClient(
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) || 'https://placeholder.supabase.co',
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 'placeholder-anon-key'
  )
}

export function createServerClient() {
  return createClient(
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) || 'https://placeholder.supabase.co',
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) || 'placeholder-service-key'
  )
}