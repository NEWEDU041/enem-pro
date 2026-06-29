export interface DripEmailData {
  name: string
  email: string
  dripDay: number
  weakDisc?: string
}

export function getDripEmail(data: DripEmailData): { subject: string; html: string } | null {
  const firstName = data.name?.split(' ')[0] || 'Estudante'
  const enemDays = Math.ceil((new Date('2026-10-26').getTime() - Date.now()) / 86400000)
  const url = process.env.NEXT_PUBLIC_SITE_URL || 'https://questoesenem.pro'

  const base = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#18181b;max-width:560px;margin:0 auto;padding:40px 24px`
  const btn = `display:inline-block;background:#4f46e5;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;margin:20px 0`
  const footer = `color:#71717a;font-size:12px;margin-top:32px;border-top:1px solid #e4e4e7;padding-top:16px`

  const templates: Record<number, { subject: string; html: string }> = {
    1: {
      subject: `${firstName}, qual é seu ponto fraco no ENEM?`,
      html: `<div style="${base}">
        <h2 style="color:#4f46e5;margin-bottom:8px">Olá, ${firstName} 👋</h2>
        <p>Você está no ENEM Pro há 1 dia. Já respondeu suas primeiras questões?</p>
        <p>A maioria dos candidatos tem <strong>uma matéria que trava tudo</strong>. Pode ser Matemática, Química, Redação...</p>
        ${data.weakDisc ? `<p>Pelo seu histórico, <strong>${data.weakDisc}</strong> merece atenção. A IA explica cada questão errada — experimente hoje.</p>` : '<p>Responda 5 questões da matéria que mais te trava. A IA vai explicar cada erro.</p>'}
        <a href="${url}/questoes" style="${btn}">Praticar agora →</a>
        <p style="${footer}">ENEM Pro · <a href="${url}/planos" style="color:#4f46e5">Ver planos</a></p>
      </div>`,
    },
    3: {
      subject: `O que a IA faz que seu professor não faz`,
      html: `<div style="${base}">
        <h2 style="color:#4f46e5">${firstName}, veja isso 👇</h2>
        <p>Quando você erra uma questão do ENEM, o gabarito diz <em>"resposta: C"</em>. E pronto.</p>
        <p>A IA do ENEM Pro faz diferente:</p>
        <ul style="padding-left:20px;line-height:1.8">
          <li>Explica POR QUE a resposta certa está certa</li>
          <li>Explica POR QUE cada alternativa errada está errada</li>
          <li>Conecta com o conteúdo que você precisa revisar</li>
        </ul>
        <p>Tudo em 30 segundos, na hora que você erra. Sem esperar o professor.</p>
        <a href="${url}/questoes" style="${btn}">Experimentar a IA →</a>
        <p style="${footer}">ENEM Pro · Faltam ~${enemDays} dias para o ENEM 2026</p>
      </div>`,
    },
    7: {
      subject: `7 dias de ENEM Pro — você está no caminho certo`,
      html: `<div style="${base}">
        <h2 style="color:#4f46e5">Uma semana, ${firstName}! 🎯</h2>
        <p>Você criou o hábito de estudar questões do ENEM. Isso já coloca você à frente de 70% dos candidatos.</p>
        <p>Uma coisa que candidatos aprovados fazem diferente: <strong>não estudam mais horas — estudam questões certas</strong>.</p>
        <p>Com o Pro, você pode fazer 30 questões/dia (vs 10 no grátis). Em 90 dias, são 2.700 questões de prática.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:20px 0">
          <p style="margin:0;font-size:14px"><strong>🛡️ Garantia de 30 dias</strong> — Não sentiu evolução? Devolvemos tudo. Sem formulário.</p>
        </div>
        <a href="${url}/planos" style="${btn}">Ver Pro por R$8,25/mês →</a>
        <p style="${footer}">ENEM Pro</p>
      </div>`,
    },
    14: {
      subject: `Faltam ${enemDays} dias para o ENEM 2026`,
      html: `<div style="${base}">
        <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:24px;text-align:center">
          <p style="margin:0;font-size:24px;font-weight:700;color:#92400e">⏱️ ${enemDays} dias</p>
          <p style="margin:4px 0 0;color:#92400e;font-size:13px">para o ENEM 2026</p>
        </div>
        <p>Olá, ${firstName}.</p>
        <p>Com 10 questões/dia (grátis), você vai praticar <strong>${10 * enemDays} questões</strong> até o ENEM.</p>
        <p>Com 30 questões/dia (Pro), são <strong>${30 * enemDays} questões</strong> — 3× mais prática, com IA explicando cada erro.</p>
        <a href="${url}/planos" style="${btn}">Triplicar minha prática por R$99/ano →</a>
        <p style="font-size:12px;color:#71717a">R$99/ano = R$8,25/mês = menos que um almoço por mês</p>
        <p style="${footer}">ENEM Pro</p>
      </div>`,
    },
    21: {
      subject: `3 semanas de ENEM Pro, ${firstName} — o que está achando?`,
      html: `<div style="${base}">
        <h2 style="color:#4f46e5">3 semanas, ${firstName} 🔥</h2>
        <p>Poucos candidatos chegam até aqui. A maioria para na primeira semana.</p>
        <p>Você está praticando há 21 dias. Com 10 questões/dia, já respondeu mais de <strong>210 questões do ENEM</strong>.</p>
        <p>Com o Pro, seriam <strong>630 questões</strong> — com a IA explicando cada erro. Isso é a diferença entre adivinhar e entender.</p>
        <div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:12px;padding:16px;margin:20px 0;text-align:center">
          <p style="margin:0;font-size:14px;color:#4f46e5"><strong>Pro Anual: R$8,25/mês</strong> (R$99/ano)</p>
          <p style="margin:4px 0 0;font-size:12px;color:#6b7280">Menos que uma pizza. Mais questões do que qualquer cursinho.</p>
        </div>
        <a href="${url}/planos" style="${btn}">Assinar Pro →</a>
        <p style="${footer}">ENEM Pro · Faltam ~${enemDays} dias</p>
      </div>`,
    },
    30: {
      subject: `Uma pergunta rápida, ${firstName}`,
      html: `<div style="${base}">
        <h2 style="color:#4f46e5">30 dias de ENEM Pro 🙌</h2>
        <p>Tenho uma pergunta: <strong>o que está te impedindo de assinar o Pro?</strong></p>
        <div style="display:flex;flex-direction:column;gap:8px;margin:20px 0">
          ${['Achei caro para o meu orçamento', 'Ainda não vi diferença na minha nota', 'Já assino o Pro ✓', 'Quero mais funcionalidades'].map(opt =>
            `<a href="${url}/planos?feedback=${encodeURIComponent(opt)}" style="display:block;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:10px;padding:12px 16px;text-decoration:none;color:#18181b;font-size:14px">${opt}</a>`
          ).join('')}
        </div>
        <p style="font-size:13px;color:#71717a">Sua resposta ajuda a melhorar o produto para todos os candidatos.</p>
        <p style="${footer}">ENEM Pro</p>
      </div>`,
    },
  }

  return templates[data.dripDay] ?? null
}
