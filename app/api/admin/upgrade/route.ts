import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { email, months = 1 } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })

  const supabase = createServerClient()

  // Find user by email via admin API
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  const user = users.find((u) => u.email === email)
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + months)

  const { error } = await supabase.from('subscriptions').upsert(
    { user_id: user.id, plan: 'pro', expires_at: expiresAt.toISOString() },
    { onConflict: 'user_id' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, user_id: user.id, expires_at: expiresAt })
}
