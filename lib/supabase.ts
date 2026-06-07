import { createClient } from '@supabase/supabase-js'
import { cleanEnv } from './utils'

export function createBrowserClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  return createClient(url || 'https://placeholder.supabase.co', key || 'placeholder-anon-key')
}

export function createServerClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
  return createClient(url || 'https://placeholder.supabase.co', key || 'placeholder-service-key')
}