import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

const SubscribeSchema = z.object({
  email: z.string().email('Email inválido'),
  firstName: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').optional(),
  productId: z.string().min(1, 'ID do produto é obrigatório'),
  productName: z.string().min(1, 'Nome do produto é obrigatório'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = SubscribeSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { email, firstName, productId, productName } = parsed.data
    const sb = createServerClient()

    // Check if subscriber exists
    const { data: existing } = await sb
      .from('premium_subscribers')
      .select('id, total_downloads')
      .eq('email', email)
      .maybeSingle()

    let subscriberId: string

    if (existing) {
      subscriberId = existing.id
      // Update last activity
      await sb
        .from('premium_subscribers')
        .update({
          updated_at: new Date().toISOString(),
          last_download_at: new Date().toISOString(),
        })
        .eq('id', subscriberId)
    } else {
      // Create new subscriber
      const { data: newSub } = await sb
        .from('premium_subscribers')
        .insert([{
          email,
          first_name: firstName || null,
          source: productId,
          last_download_at: new Date().toISOString(),
        }])
        .select('id')
        .single()

      if (!newSub) {
        throw new Error('Failed to create subscriber')
      }
      subscriberId = newSub.id
    }

    // Record download
    await sb
      .from('product_downloads')
      .insert([{
        subscriber_id: subscriberId,
        product_id: productId,
        product_name: productName,
        file_size_kb: 2048, // approximate
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent'),
      }])

    // Track analytics event
    await sb
      .from('product_analytics')
      .insert([{
        event_type: 'download_click',
        product_id: productId,
        email,
        metadata: { first_name: firstName || null },
      }])

    // Increment download counter
    await sb
      .from('premium_subscribers')
      .update({ total_downloads: (existing?.total_downloads || 0) + 1 })
      .eq('id', subscriberId)

    // Generate trial offer code
    const offerCode = `TRIAL${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    await sb
      .from('trial_offers')
      .insert([{
        subscriber_id: subscriberId,
        offer_code: offerCode,
      }])

    return Response.json({
      success: true,
      downloadUrl: `/downloads/${productId}.pdf`,
      offerCode,
      message: 'Email capturado com sucesso! Seu download começará em breve.',
    })

  } catch (error) {
    console.error('Subscribe error:', error)
    return Response.json(
      { error: 'Erro ao processar sua solicitação' },
      { status: 500 }
    )
  }
}
