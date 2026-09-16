import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface SubscribeRequest {
  email: string
  leadMagnet?: string
  utmSource?: string
  utmMedium?: string
}

interface SubscribeResponse {
  success: boolean
  message: string
  data?: {
    id?: string
    email: string
    createdAt?: string
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<SubscribeResponse>> {
  try {
    const body = await request.json() as SubscribeRequest
    const { email, leadMagnet, utmSource, utmMedium } = body

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'Email is required',
          error: 'Invalid email field',
        },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email format',
          error: 'Email validation failed',
        },
        { status: 400 }
      )
    }

    // Check if subscriber already exists
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'Este email já está inscrito',
          error: 'Email already subscribed',
        },
        { status: 409 }
      )
    }

    // Insert into subscribers table
    const { data, error } = await supabase
      .from('subscribers')
      .insert([
        {
          email,
          lead_magnet: leadMagnet || 'cronograma_enem',
          utm_source: utmSource || 'website',
          utm_medium: utmMedium || 'organic',
          subscribed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ])
      .select('id')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        {
          success: false,
          message: 'Erro ao processar inscrição',
          error: error.message,
        },
        { status: 500 }
      )
    }

    // Log successful subscription
    console.log(`📧 New subscriber: ${email} (lead magnet: ${leadMagnet || 'default'})`)

    return NextResponse.json(
      {
        success: true,
        message: 'Inscrição realizada com sucesso! Verifique seu email.',
        data: {
          id: data?.id,
          email,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Subscribe API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao processar sua inscrição',
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
