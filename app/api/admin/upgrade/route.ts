import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { cleanEnv } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret')
  if (!secret || secret !== cleanEnv(process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { email, months = 1 } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })

  const supabase = createServerClient()

  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + months)

  const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const found = users?.users?.find((u) => u.email === email)
  if (!found) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  const userId = found.id
  await supabase.from('subscriptions').upsert(
    { user_id: userId, plan: 'pro', expires_at: expiresAt.toISOString(), updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )

  return NextResponse.json({ ok: true, user_id: userId, expires_at: expiresAt })
}
