import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { withErrorHandling } from '@/lib/api-helpers'
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'
import { AdminUpgradeRequestSchema, validateRequestBody } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Verify IP whitelist + TOTP
  const auth = await verifyAdminRequest(request)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error || 'Não autorizado')
  }

  // INPUT VALIDATION
  const validation = await validateRequestBody(request, AdminUpgradeRequestSchema)
  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: 400 })
  }
  const { email, months } = validation.data

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
})
