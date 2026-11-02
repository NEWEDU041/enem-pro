import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import crypto from 'crypto'
import { jsonWithSecurityHeaders, withSecurityHeaders } from '@/lib/middleware/security'

// Get user's API keys
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = createServerClient()

  try {
    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('id, name, masked_key, created_at, last_used_at, status, quota_remaining, quota_limit')
      .eq('user_id', auth.userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ keys: keys || [] })
  } catch (error) {
    return jsonWithSecurityHeaders({ error: 'Failed to fetch API keys' }, 500)
  }
}

// Create new API key
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { name } = body

  if (!name) {
    return jsonWithSecurityHeaders({ error: 'Key name is required' }, 400)
  }

  const supabase = createServerClient()

  try {
    // Generate API key
    const rawKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`
    const maskedKey = `sk_live_${rawKey.substring(8, 20)}...${ rawKey.slice(-8)}`

    const { data: newKey, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        user_id: auth.userId,
        name,
        key_hash: crypto
          .createHash('sha256')
          .update(rawKey)
          .digest('hex'),
        masked_key: maskedKey,
        status: 'active',
        quota_limit: 1000, // Default monthly quota
        quota_remaining: 1000,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({
      key: {
        id: newKey.id,
        name: newKey.name,
        key: rawKey, // Only sent once during creation
        masked_key: maskedKey,
        created_at: newKey.created_at,
        status: 'active',
        quota_remaining: 1000,
        quota_limit: 1000,
      },
    })
  } catch (error) {
    return jsonWithSecurityHeaders({ error: 'Failed to create API key' }, 500)
  }
}
