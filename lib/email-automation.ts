/**
 * Email Automation System (Phase 2.5)
 * Generates and sends 4 sequences: Welcome, Nurture, Conversion, Retention
 */

import nodemailer from 'nodemailer';
import { sql } from '@vercel/postgres';

interface EmailSequence {
  name: string;
  subject: string;
  delay: number; // hours after signup
  templates: {
    html: string;
    text: string;
  };
}

const EMAIL_SEQUENCES: Record<string, EmailSequence[]> = {
  welcome: [
    {
      name: 'Welcome Email',
      subject: '🎯 Bem-vindo ao ENEM PRO! Seu caminho para a aprovação começa agora',
      delay: 0.5,
      templates: {
        html: `
          <h2>Bem-vindo ao ENEM PRO! 🎉</h2>
          <p>Você acabou de dar o primeiro passo para conquistar sua aprovação.</p>
          <p>Aqui está o que você pode fazer agora:</p>
          <ul>
            <li>✅ Faça um simulado diagnóstico (30 min)</li>
            <li>📊 Visualize sua análise detalhada por competência</li>
            <li>🎯 Receba seu plano de estudos personalizado</li>
          </ul>
          <p><a href="{DASHBOARD_URL}" style="background: #FFD700; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Começar Agora</a></p>
        `,
        text: `Bem-vindo ao ENEM PRO!

Você começou sua jornada. Vamos aproveitar cada minuto de estudo.

Acesse seu dashboard: {DASHBOARD_URL}`,
      },
    },
  ],
  nurture: [
    {
      name: 'Day 2 - Study Tip',
      subject: '💡 Técnica de estudo que 92% aprovados usam',
      delay: 24,
      templates: {
        html: `<p>Saiba por que Active Recall é 3x mais efetivo que revisão passiva...</p>`,
        text: `Aprenda a técnica de estudo mais efetiva.`,
      },
    },
    {
      name: 'Day 5 - Motivation',
      subject: '🏆 Você já estudou 5 dias - veja seu progresso',
      delay: 120,
      templates: {
        html: `<p>Seus dados mostram evolução. Não pare agora!</p>`,
        text: `Você está no caminho certo.`,
      },
    },
  ],
  conversion: [
    {
      name: 'Free Trial Expiring',
      subject: '⏰ Seu plano gratuito expira em 2 dias',
      delay: 336,
      templates: {
        html: `<p>Desbloquear simulados ilimitados e IA completa por apenas R$ 39,90/mês</p>`,
        text: `Assine o ENEM PRO agora.`,
      },
    },
  ],
  retention: [
    {
      name: 'Monthly Check-in',
      subject: '📈 Seu desempenho do mês',
      delay: 720,
      templates: {
        html: `<p>Você avançou {PROGRESS_PERCENT}% em {TOP_SUBJECT}</p>`,
        text: `Veja seu progresso mensal.`,
      },
    },
  ],
};

/**
 * Initialize email service
 */
function getEmailService() {
  return nodemailer.createTransport({
    host: process.env.SENDGRID_SMTP_HOST || 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
  });
}

/**
 * Send email sequence
 */
export async function sendEmailSequence(
  userId: string,
  userEmail: string,
  sequenceType: 'welcome' | 'nurture' | 'conversion' | 'retention',
  userData?: any
) {
  const sequences = EMAIL_SEQUENCES[sequenceType];
  if (!sequences) throw new Error(`Unknown sequence type: ${sequenceType}`);

  const transporter = getEmailService();

  for (const emailSeq of sequences) {
    // Schedule email send
    const sendAt = new Date(Date.now() + emailSeq.delay * 60 * 60 * 1000);

    // Store in database for scheduling
    await sql`
      INSERT INTO email_queue (
        user_id,
        user_email,
        subject,
        html_content,
        text_content,
        sequence_type,
        send_at,
        created_at
      ) VALUES (
        ${userId},
        ${userEmail},
        ${emailSeq.subject},
        ${emailSeq.templates.html},
        ${emailSeq.templates.text},
        ${sequenceType},
        ${sendAt},
        NOW()
      )
    `;

    // If delay is less than 1 hour, send immediately
    if (emailSeq.delay < 1) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@enem-pro.com',
          to: userEmail,
          subject: emailSeq.subject,
          html: emailSeq.templates.html,
          text: emailSeq.templates.text,
        });

        // Track email sent
        await sql`
          UPDATE email_queue SET sent_at = NOW() WHERE user_id = ${userId} AND subject = ${emailSeq.subject}
        `;

        // Log metric
        await trackEmailMetric(userId, sequenceType, 'sent', emailSeq.name);
      } catch (error) {
        console.error(`Failed to send email to ${userEmail}:`, error);
      }
    }
  }
}

/**
 * Track email metrics
 */
async function trackEmailMetric(
  userId: string,
  sequenceType: string,
  action: 'sent' | 'opened' | 'clicked',
  emailName: string
) {
  await sql`
    INSERT INTO email_metrics (
      user_id,
      sequence_type,
      email_name,
      action,
      created_at
    ) VALUES (
      ${userId},
      ${sequenceType},
      ${emailName},
      ${action},
      NOW()
    )
  `;
}

/**
 * Process email queue (run as cron job)
 */
export async function processEmailQueue() {
  const transporter = getEmailService();

  // Get pending emails
  const pendingEmails = await sql`
    SELECT * FROM email_queue
    WHERE sent_at IS NULL
    AND send_at <= NOW()
    ORDER BY send_at ASC
    LIMIT 100
  `;

  for (const email of pendingEmails.rows) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@enem-pro.com',
        to: email.user_email,
        subject: email.subject,
        html: email.html_content,
        text: email.text_content,
        headers: {
          'X-Email-Id': email.id,
          'X-Sequence': email.sequence_type,
        },
      });

      // Mark as sent
      await sql`UPDATE email_queue SET sent_at = NOW() WHERE id = ${email.id}`;

      // Log metric
      await trackEmailMetric(email.user_id, email.sequence_type, 'sent', email.subject);
    } catch (error) {
      console.error(`Failed to send email ID ${email.id}:`, error);
      // Retry logic can be added here
    }
  }
}

/**
 * Handle email opens (pixel tracking)
 */
export async function trackEmailOpen(emailId: string) {
  await sql`
    INSERT INTO email_opens (email_id, opened_at)
    VALUES (${emailId}, NOW())
    ON CONFLICT (email_id) DO NOTHING
  `;

  // Get email details and track metric
  const result = await sql`
    SELECT user_id, sequence_type FROM email_queue WHERE id = ${emailId}
  `;

  if (result.rows.length > 0) {
    const { user_id, sequence_type } = result.rows[0];
    await trackEmailMetric(user_id, sequence_type, 'opened', 'email');
  }
}

/**
 * Handle email link clicks (redirect tracking)
 */
export async function trackEmailClick(emailId: string, linkUrl: string) {
  await sql`
    INSERT INTO email_clicks (email_id, link_url, clicked_at)
    VALUES (${emailId}, ${linkUrl}, NOW())
  `;

  // Get email details and track metric
  const result = await sql`
    SELECT user_id, sequence_type FROM email_queue WHERE id = ${emailId}
  `;

  if (result.rows.length > 0) {
    const { user_id, sequence_type } = result.rows[0];
    await trackEmailMetric(user_id, sequence_type, 'clicked', 'email_link');
  }

  return linkUrl; // Redirect user
}
