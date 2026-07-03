import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { cleanEnv } from './utils'

let _browserClient: SupabaseClient | null = null

export function createBrowserClient() {
  if (_browserClient) return _browserClient
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (!url || !key) {
    throw new Error('Supabase env vars ausentes: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  _browserClient = createClient(url, key)
  return _browserClient
}

export function createServerClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!url || !key) {
    throw new Error('Supabase env vars ausentes: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  })
}