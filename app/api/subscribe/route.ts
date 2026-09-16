import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, leadMagnet = 'study-schedule', utmSource = 'organic', utmMedium = 'blog' } = body;

    // Validate email
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Create/update subscriber in Supabase
    const { data: subscriber, error: dbError } = await supabase
      .from('subscribers')
      .upsert({
        email,
        lead_magnet: leadMagnet,
        utm_source: utmSource,
        utm_medium: utmMedium,
        subscribed_at: new Date().toISOString(),
      }, { onConflict: 'email' })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase error:', dbError);
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    // Send welcome email via Resend
    const emailResponse = await resend.emails.send({
      from: 'ENEM Pro <noreply@enempro.com>',
      to: email,
      subject: 'Seu cronograma ENEM 2026 está pronto! 📅',
      html: `<h2>Bem-vindo ao ENEM Pro!</h2>
<p>Seu cronograma de 90 dias está pronto para download.</p>
<a href="${process.env.NEXT_PUBLIC_SITE_URL}/download/schedule-90day.pdf">Baixar cronograma</a>
<br/>
<a href="${process.env.NEXT_PUBLIC_SITE_URL}/trial?ref=welcome">Começar teste grátis</a>`,
    });

    if (emailResponse.error) {
      console.error('Email error:', emailResponse.error);
      // Still consider it a success if DB succeeded
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription successful',
      email,
      downloadUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/download/schedule-90day.pdf`,
      trialUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/trial?ref=welcome`,
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
