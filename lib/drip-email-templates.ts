/**
 * Comprehensive Mailchimp Email Campaign Templates
 * Drip campaigns for onboarding, nurture, re-engagement, churn prevention, and upgrade
 */

export interface EmailTemplate {
  subject: string
  previewText?: string
  htmlContent: string
}

export const dripCampaignTemplates = {
  onboarding: {
    email1: {
      subject: '🎓 Bem-vindo ao ENEM Pro - Seu guia completo',
      previewText: 'Descubra como estudar de forma inteligente para o ENEM',
      htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:40px;text-align:center;border-radius:10px}
.header h1{margin:0;font-size:28px}.content{padding:30px 0}
.button{display:inline-block;background:#667eea;color:white;padding:12px 30px;text-decoration:none;border-radius:5px;margin:20px 0}
.footer{border-top:1px solid #eee;padding-top:20px;font-size:12px;color:#999;text-align:center}
</style></head><body>
<div class="container">
<div class="header"><h1>Bem-vindo ao ENEM Pro! 🎉</h1></div>
<div class="content">
<p>Olá *|FNAME|*,</p>
<p>Estamos muito felizes em tê-lo na comunidade ENEM Pro!</p>
<p><strong>Próximos passos:</strong></p>
<ol><li><strong>Complete seu perfil</strong> - Conte-nos sua série e principais desafios</li>
<li><strong>Faça seu primeiro simulado</strong> - Vamos avaliar seu nível atual</li>
<li><strong>Crie seu plano de estudos</strong> - Personalizamos baseado em suas fraquezas</li></ol>
<p><a href="*|CTAS|*" class="button">Comece Agora →</a></p>
<p><strong>O que você terá acesso:</strong></p>
<ul><li>✅ Banco com 5.000+ questões ENEM</li>
<li>✅ Explicações detalhadas com IA</li>
<li>✅ Simulados completos comentados</li>
<li>✅ Análise de desempenho em tempo real</li></ul>
<p>Qualquer dúvida, nosso suporte está pronto para ajudar!</p>
<p>Sucesso,<br/><strong>Time ENEM Pro</strong></p>
</div>
<div class="footer"><p>© 2024 ENEM Pro. Todos os direitos reservados.</p></div>
</div>
</body></html>`,
    } as EmailTemplate,
    email2: {
      subject: '🚀 Seu simulado inicial está pronto',
      previewText: 'Descubra em qual área você é mais forte',
      htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto;line-height:1.6}
.container{max-width:600px;margin:0 auto;padding:20px}
.alert{background:#f0f4ff;border-left:4px solid #667eea;padding:20px;border-radius:5px;margin:20px 0}
.button{display:inline-block;background:#667eea;color:white;padding:12px 30px;text-decoration:none;border-radius:5px}
</style></head><body>
<div class="container">
<h2>Faça seu simulado inicial!</h2>
<p>Oi *|FNAME|*,</p>
<p>Já preparamos um simulado personalizado para você. Ele levará apenas 30 minutos.</p>
<div class="alert">
<strong>⏱️ Tempo estimado:</strong> 30 minutos<br/>
<strong>📊 Questões:</strong> 20 questões de todas as áreas</div>
<p><a href="*|CTAS|*" class="button">Iniciar Simulado →</a></p>
<p>Após completar, você receberá uma análise detalhada.</p>
</div>
</body></html>`,
    } as EmailTemplate,
    email3: {
      subject: '📈 Veja seus resultados e plano personalizado',
      previewText: 'Começamos a traçar seu caminho para o sucesso',
      htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto;line-height:1.6}
.container{max-width:600px;margin:0 auto;padding:20px}
.stat{display:inline-block;background:#f5f5f5;padding:20px;margin:10px;border-radius:5px;width:45%;text-align:center}
.stat strong{display:block;font-size:24px;color:#667eea}
.button{display:inline-block;background:#667eea;color:white;padding:12px 30px;text-decoration:none;border-radius:5px}
</style></head><body>
<div class="container">
<h2>Seus resultados estão prontos! 🎯</h2>
<p>Oi *|FNAME|*,</p>
<p>Analisamos seu simulado e criamos um plano de estudos personalizado.</p>
<div><div class="stat"><strong>72%</strong><br/>Taxa de acerto</div>
<div class="stat"><strong>Matemática</strong><br/>Área crítica</div></div>
<p><a href="*|CTAS|*" class="button">Ver Análise Completa →</a></p>
<p>Seu plano se concentrará em: funções, geometria e resolução rápida.</p>
</div>
</body></html>`,
    } as EmailTemplate,
  },
  nurture: {
    email1: {
      subject: '💡 3 dicas para melhorar seu desempenho em Matemática',
      previewText: 'Especialistas compartilham suas técnicas secretas',
      htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto;line-height:1.6}
.container{max-width:600px;margin:0 auto;padding:20px}
.tip{background:#f9f9f9;padding:20px;margin:15px 0;border-radius:5px;border-left:4px solid #667eea}
.button{display:inline-block;background:#667eea;color:white;padding:12px 30px;text-decoration:none;border-radius:5px}
</style></head><body>
<div class="container">
<h2>Aumente seu desempenho em Matemática 📐</h2>
<div class="tip">
<strong>Dica 1: Primeiro, entenda a teoria</strong><br/>
Dedique 15 minutos para revisar. Procure por padrões nas questões.</div>
<div class="tip">
<strong>Dica 2: Pratique com cronômetro</strong><br/>
Treine resolvendo questões em 2 minutos cada uma.</div>
<div class="tip">
<strong>Dica 3: Aprenda com seus erros</strong><br/>
Estude POR QUÊ errou. A repetição de padrões é normal.</div>
<p><a href="*|CTAS|*" class="button">Praticar Agora →</a></p>
</div>
</body></html>`,
    } as EmailTemplate,
    email2: {
      subject: '🎥 Vídeo: Resolvendo funções em 3 passos',
      previewText: 'Técnica que faz você economizar tempo na prova',
      htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto">
<div style="max-width:600px;margin:0 auto;padding:20px">
<h2>Aula: Funções Quadráticas em 3 Passos</h2>
<p>Oi *|FNAME|*,</p>
<p>Preparamos uma aula mostrando como resolver qualquer função em menos de 2 minutos.</p>
<p>Esta é a técnica que nossos alunos mais usam na prova.</p>
<a href="*|CTAS|*" style="display:inline-block;background:#667eea;color:white;padding:12px 30px;text-decoration:none;border-radius:5px">Assistir Aula →</a>
</div>
</body></html>`,
    } as EmailTemplate,
    email3: {
      subject: '🏆 Você está no top 15% da sua turma!',
      previewText: 'Veja como você se compara aos outros alunos',
      htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
.badge{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:20px;border-radius:10px;text-align:center;margin:20px 0}
</style></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto">
<div style="max-width:600px;margin:0 auto;padding:20px">
<h2>Excelente progresso! 🎉</h2>
<p>Oi *|FNAME|*,</p>
<p>Seu desempenho nas últimas questões melhorou 18%.</p>
<div class="badge">
<strong>Top 15%</strong><br/>Acima da média dos alunos ENEM Pro</div>
<p>Mantenha o ritmo! Continue praticando e dominará o ENEM.</p>
</div>
</body></html>`,
    } as EmailTemplate,
    email4: {
      subject: '📚 Seu cronograma semanal de estudos',
      previewText: 'Tarefas priorizadas para esta semana',
      htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
.schedule{background:#f9f9f9;padding:20px;border-radius:5px;margin:20px 0}
.day{padding:10px;border-bottom:1px solid #eee}
</style></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto">
<div style="max-width:600px;margin:0 auto;padding:20px">
<h2>Seu plano de estudos para esta semana</h2>
<div class="schedule">
<div class="day"><strong>Segunda</strong><br/>- 10 questões de funções<br/>- Revisar vértice da parábola</div>
<div class="day"><strong>Terça</strong><br/>- Simulado de 30 questões<br/>- Fazer revisão do desempenho</div>
<div class="day"><strong>Quarta</strong><br/>- 15 questões de geometria<br/>- Assistir aula sobre volume</div>
<div class="day"><strong>Quinta</strong><br/>- 10 questões contextualizadas<br/>- Discussão no fórum</div>
<div class="day"><strong>Sexta</strong><br/>- Revisão semanal<br/>- Explorar novas dificuldades</div>
</div>
</div>
</body></html>`,
    } as EmailTemplate,
  },
  reengagement: {
    email1: {
      subject: '👋 A gente sente sua falta, *|FNAME|*',
      previewText: 'Veja as novidades desde quando você saiu',
      htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
.highlight{background:#fff3cd;padding:20px;border-radius:5px;margin:20px 0}
.button{display:inline-block;background:#667eea;color:white;padding:12px 30px;text-decoration:none;border-radius:5px}
</style></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto">
<div style="max-width:600px;margin:0 auto;padding:20px">
<h2>Voltou? A gente se alegra! 💙</h2>
<p>Oi *|FNAME|*,</p>
<p>Não o via há um tempo. Preparamos novidades incríveis para ajudar no ENEM.</p>
<div class="highlight">
<strong>✨ Novidades desde quando você saiu:</strong><br/>
✅ Física Moderna (20 questões)<br/>
✅ IA na correção de redações<br/>
✅ Simulados com proctoring<br/>
✅ Chat ao vivo com especialistas</div>
<p><a href="*|CTAS|*" class="button">Explorar Novidades →</a></p>
</div>
</body></html>`,
    } as EmailTemplate,
    email2: {
      subject: '🎁 Ganhe 7 dias grátis ao voltar',
      previewText: 'Sua segunda chance nos espera',
      htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
.offer{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:40px;text-align:center;border-radius:10px;margin:20px 0}
.button{background:white;color:#667eea}
</style></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto">
<div style="max-width:600px;margin:0 auto;padding:20px">
<h2>Voltou? Temos um presente! 🎉</h2>
<div class="offer">
<h3 style="margin-top:0">7 Dias de Premium Grátis</h3>
<p>Apenas para quem volta nesta semana</p>
<a href="*|CTAS|*" style="display:inline-block;background:white;color:#667eea;padding:12px 30px;text-decoration:none;border-radius:5px;font-weight:bold">Usar Meu Cupom →</a>
</div>
<p>Sem surpresas. Sem cobranças automaticamente.</p>
</div>
</body></html>`,
    } as EmailTemplate,
  },
  churnrisk: {
    email1: {
      subject: '⏰ Você está prestes a perder acesso',
      previewText: 'Sua assinatura vence em 2 dias',
      htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
.warning{background:#fff3cd;border-left:4px solid #ff9800;padding:20px;border-radius:5px;margin:20px 0}
.button{display:inline-block;background:#667eea;color:white;padding:12px 30px;text-decoration:none;border-radius:5px;margin:10px 0}
</style></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto">
<div style="max-width:600px;margin:0 auto;padding:20px">
<h2>⚠️ Sua assinatura vai expirar</h2>
<div class="warning">
<strong>Você tem acesso até:</strong> 31 de dezembro de 2024<br/>
<strong>Próximo passo:</strong> Renove agora para não perder progresso</div>
<p>*|FNAME|*, você fez ótimo progresso. Não pare agora!</p>
<p><a href="*|CTAS|*" class="button">Renovar Acesso →</a></p>
<h3>Por que renovar?</h3>
<ul><li>✅ Continuar seu progresso</li>
<li>✅ Manter acesso a 5.000+ questões</li>
<li>✅ Acompanhamento personalizado da IA</li>
<li>✅ Simulados completos comentados</li></ul>
</div>
</body></html>`,
    } as EmailTemplate,
    email2: {
      subject: '🚀 50% OFF - Última chance de renovar',
      previewText: 'Oferta válida apenas hoje',
      htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
.deal{background:linear-gradient(135deg,#ff6b6b 0%,#ee5a52 100%);color:white;padding:40px;text-align:center;border-radius:10px;margin:20px 0}
.discount{font-size:48px;font-weight:bold}
.button{display:inline-block;background:white;color:#ee5a52;padding:12px 30px;text-decoration:none;border-radius:5px;font-weight:bold;margin-top:20px}
</style></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto">
<div style="max-width:600px;margin:0 auto;padding:20px">
<div class="deal">
<div class="discount">50% OFF</div>
<p>Apenas hoje - Válido até 23:59h</p>
<a href="*|CTAS|*" class="button">Aproveitar Agora →</a>
</div>
<p>*|FNAME|*, esta é sua última chance com esse desconto.</p>
<p style="font-size:12px;color:#999">Oferta expira em 24 horas</p>
</div>
</body></html>`,
    } as EmailTemplate,
  },
  upgrade: {
    email1: {
      subject: '🌟 Desbloqueie IA para Redação + 1000 questões',
      previewText: 'Alunos premium melhoram nota em 40 pontos',
      htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
.premium{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:40px;border-radius:10px;margin:20px 0}
.feature{padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.2)}
.button{display:inline-block;background:white;color:#667eea;padding:12px 30px;text-decoration:none;border-radius:5px;font-weight:bold;margin-top:20px}
</style></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto">
<div style="max-width:600px;margin:0 auto;padding:20px">
<h2>Desbloqueie o Poder do Premium 🚀</h2>
<div class="premium">
<h3 style="margin-top:0">Acesso Premium Completo</h3>
<div class="feature">✨ IA para Correção de Redações</div>
<div class="feature">📊 Análise Profunda de Desempenho</div>
<div class="feature">🎯 Plano Personalizado com IA</div>
<div class="feature">👨‍🏫 Aulas Exclusivas (50+ vídeos)</div>
<div class="feature">💬 Chat com Especialistas</div>
<div class="feature">📈 Rastreamento Detalhado</div>
<a href="*|CTAS|*" class="button">Upgrade Agora →</a>
</div>
<h3>Estatísticas de Alunos Premium:</h3>
<ul><li>📈 +40 pontos em média no ENEM</li>
<li>⏰ -50% tempo de estudo</li>
<li>🎓 98% de satisfação</li></ul>
<p><strong>Preço especial:</strong> R$ 99/mês (3 meses iniciais)</p>
</div>
</body></html>`,
    } as EmailTemplate,
  },
}

/**
 * Get template by campaign type and email number
 */
export function getTemplate(
  campaignType: string,
  emailNumber: number
): EmailTemplate | null {
  const campaign = (dripCampaignTemplates as any)[campaignType]
  if (!campaign) return null

  const emailKey = `email${emailNumber}`
  return (campaign as any)[emailKey] || null
}

/**
 * Personalize email with user data
 */
export function personalizeTemplate(
  template: EmailTemplate,
  userData: {
    firstName?: string
    lastName?: string
    email?: string
    customVars?: Record<string, string>
  }
): EmailTemplate {
  let { subject, htmlContent, previewText } = template

  // Replace standard merge fields
  subject = subject.replace(/\*\|FNAME\|\*/g, userData.firstName || 'Friend')
  htmlContent = htmlContent.replace(/\*\|FNAME\|\*/g, userData.firstName || 'Friend')
  htmlContent = htmlContent.replace(/\*\|LNAME\|\*/g, userData.lastName || '')
  htmlContent = htmlContent.replace(/\*\|EMAIL\|\*/g, userData.email || '')

  if (previewText) {
    previewText = previewText.replace(/\*\|FNAME\|\*/g, userData.firstName || 'Friend')
  }

  // Replace custom variables
  if (userData.customVars) {
    Object.entries(userData.customVars).forEach(([key, value]) => {
      const pattern = new RegExp(`\\*\\|${key}\\|\\*`, 'g')
      subject = subject.replace(pattern, value)
      htmlContent = htmlContent.replace(pattern, value)
      if (previewText) previewText = previewText.replace(pattern, value)
    })
  }

  return { subject, htmlContent, previewText }
}
