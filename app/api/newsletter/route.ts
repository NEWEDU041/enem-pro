import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      )
    }

    // TODO: Integrar com Brevo API
    // Exemplo de integração Brevo:
    /*
    const brevoApiKey = process.env.BREVO_API_KEY
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        listIds: [2], // Seu ID da lista no Brevo
        updateEnabled: true,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to add contact to Brevo')
    }
    */

    // Por enquanto, just log
    console.log('📧 Newsletter signup:', email)

    return NextResponse.json(
      {
        success: true,
        message: 'Inscrição realizada com sucesso!',
        email,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Newsletter API error:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    )
  }
}
