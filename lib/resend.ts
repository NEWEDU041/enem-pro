import { Resend } from 'resend'
import { cleanEnv } from './utils'
import { getDripEmail } from './email-templates'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://enem-pro-eight.vercel.app'

export function getResend(): Resend | null {
  const key = cleanEnv(process.env.RESEND_API_KEY)
  if (!key) return null
  return new Resend(key)
}

type DripArgs = { name: string; email: string; weak_disc?: string; drip_day: number }

const FROM = process.env.RESEND_FROM || 'ENEM Pro <noreply@resend.dev>'

function getWelcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: 'Bem-vindo ao ENEM Pro — sua primeira questão espera',
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 16px">
<h2 style="color:#1e1b4b">Olá, ${name || 'estudante'}!</h2>
<p>Você entrou para o ENEM Pro. O próximo passo é simples: responda <strong>10 questões hoje</strong>.</p>
<p>10 questões por dia = 300 por mês. Volume suficiente para melhorar em todas as disciplinas.</p>
<a href="${siteUrl}/dashboard" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;margin:20px 0">Começar agora →</a>
<p style="color:#6b7280;font-size:13px;margin-top:32px">Dúvidas? Responda este email.<br>ENEM Pro · <a href="${siteUrl}/planos" style="color:#4f46e5">Ver Plano Pro</a></p>
</div>`,
  }
}

export async function sendDripEmail(args: DripArgs): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  let subject: string
  let html: string

  if (args.drip_day === 0) {
    const tpl = getWelcomeEmail(args.name)
    subject = tpl.subject
    html = tpl.html
  } else {
    const tpl = getDripEmail({
      name: args.name,
      email: args.email,
      dripDay: args.drip_day,
      weakDisc: args.weak_disc,
    })
    if (!tpl) return false
    subject = tpl.subject
    html = tpl.html
  }

  try {
    await resend.emails.send({ from: FROM, to: args.email, subject, html })
    return true
  } catch {
    return false
  }
}
