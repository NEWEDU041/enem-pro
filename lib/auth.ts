import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from './supabase'

export type AuthResult =
  | { ok: true; userId: string; token: string }
  | { ok: false; response: NextResponse }

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }

  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return { ok: false, response: NextResponse.json({ error: 'Token inválido' }, { status: 401 }) }
  }

  return { ok: true, userId: user.id, token }
}
