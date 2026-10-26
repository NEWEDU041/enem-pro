import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SentryClient } from '@/lib/sentry/client'

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
  const startTime = Date.now()
  
  try {
    const body = await request.json() as SubscribeRequest
    const { email, leadMagnet, utmSource, utmMedium } = body

    // Validate email
    if (!email || typeof email !== 'string') {
      SentryClient.captureWarning('Invalid email field in subscribe request', {
        endpoint: '/api/subscribe',
        status: 400,
        method: 'POST',
        email: email?.substring(0, 10),
      })
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
      SentryClient.captureWarning('Invalid email format in subscribe request', {
        endpoint: '/api/subscribe',
        status: 400,
        method: 'POST',
        email: email.substring(0, 20),
      })
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
      const duration = Date.now() - startTime
      console.error('Supabase insert error:', error)
      
      SentryClient.captureException(error as unknown as Error, {
        endpoint: '/api/subscribe',
        status: 500,
        method: 'POST',
        duration: duration,
        email: email.substring(0, 20),
        errorCode: (error as any).code,
      })
      
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
    const duration = Date.now() - startTime
    console.log(`📧 New subscriber: ${email} (lead magnet: ${leadMagnet || 'default'})`)
    
    SentryClient.addBreadcrumb(
      `New subscriber: ${email}`,
      'subscription',
      'info',
      { leadMagnet, duration }
    )

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
    const duration = Date.now() - startTime
    console.error('Subscribe API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    SentryClient.captureException(error as Error, {
      endpoint: '/api/subscribe',
      status: 500,
      method: 'POST',
      duration: duration,
      path: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
    })

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
