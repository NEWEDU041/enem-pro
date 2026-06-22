import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { cleanEnv } from './utils'

let _browserClient: SupabaseClient | null = null

export function createBrowserClient() {
  if (_browserClient) return _browserClient
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  _browserClient = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder-anon-key')
  return _browserClient
}

export function createServerClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
  return createClient(url || 'https://placeholder.supabase.co', key || 'placeholder-service-key', {
    auth: { persistSession: false },
  })
}