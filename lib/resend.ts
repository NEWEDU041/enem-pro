import { Resend } from 'resend'
import { cleanEnv } from './utils'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://enem-pro-eight.vercel.app'

export function getResend(): Resend | null {
  const key = cleanEnv(process.env.RESEND_API_KEY)
  if (!key) return null
  return new Resend(key)
}

type DripArgs = { name: string; email: string; weak_disc?: string; drip_day: number }

const FROM = process.env.RESEND_FROM || 'ENEM Pro <noreply@resend.dev>'

const templates: Record<number, (a: DripArgs) => { subject: string; html: string }> = {
  0: ({ name }) => ({
    subject: 'Bem-vindo ao ENEM Pro — sua primeira questão espera',
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 16px">
<h2 style="color:#1e1b4b">Olá, ${name || 'estudante'}!</h2>
<p>Você entrou para o ENEM Pro. O próximo passo é simples: responda <strong>10 questões hoje</strong>.</p>
<p>10 questões por dia = 300 por mês. Volume suficiente para melhorar em todas as disciplinas.</p>
<a href="${siteUrl}/dashboard" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;margin:20px 0">Começar agora →</a>
<p style="color:#6b7280;font-size:13px;margin-top:32px">Dúvidas? Responda este email.<br>ENEM Pro · <a href="${siteUrl}/planos" style="color:#4f46e5">Ver Plano Pro</a></p>
</div>`,
  }),
  3: ({ name, weak_disc }) => ({
    subject: `${name || 'Estudante'}, você chegou ao 3° dia — continue`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 16px">
<h2 style="color:#1e1b4b">Terceiro dia, ${name || 'estudante'}!</h2>
<p>Estudantes que chegam ao 3° dia têm <strong>4× mais chance</strong> de manter a consistência até o ENEM.</p>
${weak_disc ? `<p>Sua maior oportunidade agora: <strong>${weak_disc}</strong>. Responda 10 questões dessa disciplina hoje.</p>` : '<p>Continue praticando — consistência é o que separa quem passa de quem não passa.</p>'}
<a href="${siteUrl}/dashboard" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;margin:20px 0">Estudar agora →</a>
<p style="color:#6b7280;font-size:13px;margin-top:32px">ENEM Pro · <a href="${siteUrl}/planos" style="color:#4f46e5">Ver Plano Pro</a></p>
</div>`,
  }),
  7: ({ name }) => ({
    subject: '7 dias de estudo — você está superando 80% dos candidatos',
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 16px">
<h2 style="color:#1e1b4b">Uma semana, ${name || 'estudante'}!</h2>
<p>Apenas 20% dos inscritos chegam a uma semana de estudo consistente. Você está entre eles.</p>
<p>Estudantes que praticam 7 dias seguidos têm <strong>2,3× mais chance de aprovação</strong>.</p>
<a href="${siteUrl}/dashboard" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;margin:20px 0">Ver meu progresso →</a>
<p style="color:#6b7280;font-size:13px;margin-top:32px">ENEM Pro · <a href="${siteUrl}/planos" style="color:#4f46e5">Ver Plano Pro</a></p>
</div>`,
  }),
  14: ({ name }) => ({
    subject: '14 dias — uma oferta para quem está comprometido',
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 16px">
<h2 style="color:#1e1b4b">${name || 'Estudante'}, 14 dias!</h2>
<p>Pouquíssimas pessoas chegam aqui. Você está entre os mais comprometidos.</p>
<p>Para quem chegou até aqui, o <strong>Plano Pro</strong> faz diferença real:</p>
<ul style="margin:16px 0;padding-left:20px">
<li>Questões ilimitadas</li>
<li>IA explica cada resposta errada</li>
<li>Todos os anos 2009–2024</li>
</ul>
<p>Por <strong>R$14,90/mês</strong>. Cancelamento a qualquer momento. Garantia de 30 dias.</p>
<a href="${siteUrl}/planos" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;margin:20px 0">Assinar Pro agora →</a>
<p style="color:#6b7280;font-size:13px;margin-top:32px">ENEM Pro · Garantia incondicional de 30 dias</p>
</div>`,
  }),
}

export async function sendDripEmail(args: DripArgs): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false
  const tpl = templates[args.drip_day]
  if (!tpl) return false
  const { subject, html } = tpl(args)
  try {
    await resend.emails.send({ from: FROM, to: args.email, subject, html })
    return true
  } catch {
    return false
  }
}
