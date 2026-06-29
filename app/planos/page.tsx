'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import { trackBeginCheckout } from '@/lib/analytics'

const supabase = createBrowserClient()

export default function PlanosPage() {
  const [loading, setLoading] = useState<'monthly' | 'annual' | 'portal' | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      supabase.from('subscriptions').select('plan, expires_at').eq('user_id', session.user.id).maybeSingle()
        .then(({ data }) => {
          if (data?.plan === 'pro' && data?.expires_at && new Date(data.expires_at) > new Date()) setIsPro(true)
        })
    })
  }, [])

  async function handlePortal() {
    setLoading('portal')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth/login?next=/planos'; return }
      const res = await fetch('/api/portal', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  async function handleCheckout(plan: 'monthly' | 'annual') {
    setLoading(plan)
    trackBeginCheckout(plan, plan === 'monthly' ? 14.90 : 99)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/auth/login?next=/planos'
        return
      }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError('Erro ao iniciar pagamento. Tente novamente em instantes.')
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-900">Voltar</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 text-center">
        {isPro && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-6 py-5 mb-10 flex items-center justify-between">
            <div className="text-left">
              <p className="font-bold text-indigo-900">✦ Você é Pro!</p>
              <p className="text-indigo-600 text-sm">Questões ilimitadas + IA ativos.</p>
            </div>
            <button onClick={handlePortal} disabled={loading === 'portal'}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {loading === 'portal' ? 'Aguarde...' : 'Gerenciar assinatura →'}
            </button>
          </div>
        )}
        <h1 className="text-4xl font-bold mb-4">Pratique as questões reais do ENEM até passar</h1>
        <p className="text-zinc-500 mb-14">Comece grátis hoje, sem cartão. Faça upgrade quando quiser questões ilimitadas e a IA explicando cada erro.</p>

        <EnemCountdown />
        {checkoutError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-sm text-red-800">
            {checkoutError}
          </div>
        )}

        {/* Value Stack */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-10 text-left">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-3">O que está incluso no Pro</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { name: 'Sistema de Questões INEP Real', value: 'R$197', desc: '3.600+ questões reais 2009–2024' },
              { name: 'IA por Questão (streaming)', value: 'R$147', desc: 'Explicação completa de cada erro' },
              { name: 'Sistema de 90 Dias para o ENEM', value: 'R$97', desc: 'Cronograma personalizado automático' },
              { name: 'Banco de Temas de Redação', value: 'R$47', desc: '50+ temas com repertório pronto' },
              { name: 'Calculadora TRI + Mapa de Cursos', value: 'R$37', desc: 'Estime sua nota e veja onde passar' },
              { name: 'Correção de Redação por IA', value: 'R$67', desc: 'Feedback nas 5 competências do ENEM' },
            ].map(b => (
              <div key={b.name} className="flex items-start gap-3 bg-white rounded-xl p-3 border border-indigo-100">
                <span className="text-indigo-500 mt-0.5 shrink-0">✓</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">{b.name}</p>
                  <p className="text-xs text-zinc-500">{b.desc}</p>
                </div>
                <span className="text-xs font-bold text-indigo-400 shrink-0 ml-auto">{b.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-indigo-100 flex items-center justify-between">
            <span className="text-sm text-zinc-600">Valor total se vendido separado:</span>
            <div className="text-right">
              <span className="text-zinc-400 line-through text-sm">R$592</span>
              <span className="text-indigo-700 font-bold text-lg ml-2">Pro Anual: R$99/ano</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Free */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-left">
            <h2 className="text-xl font-bold mb-1">Grátis</h2>
            <p className="text-zinc-400 text-sm mb-6">Para sempre</p>
            <div className="text-4xl font-bold mb-8">R$0</div>
            <ul className="space-y-3 text-sm text-zinc-600 mb-8">
              {[
                '10 questões por dia',
                'Todos os anos (2009–2024)',
                'Todas as disciplinas',
                'Gabarito após responder',
                'Histórico de respostas',
              ].map((f) => (
                <li key={f} className="flex gap-2"><span className="text-zinc-400">✓</span>{f}</li>
              ))}
              <li className="flex gap-2 text-zinc-300"><span>✗</span>Explicação por IA</li>
              <li className="flex gap-2 text-zinc-300"><span>✗</span>Questões ilimitadas</li>
            </ul>
            <Link href="/auth/register" className="block text-center border border-zinc-300 text-zinc-700 py-3 rounded-xl font-semibold hover:bg-zinc-50">
              Criar conta grátis
            </Link>
          </div>

          {/* Pro Anual — HERO */}
          <div className="bg-indigo-600 rounded-2xl p-8 text-left text-white relative ring-4 ring-amber-400 ring-offset-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-zinc-900 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
              ESCOLHA PARA O ENEM 2026
            </div>
            <h2 className="text-xl font-bold mb-1">Pro Anual</h2>
            <p className="text-indigo-200 text-sm mb-4">Compromisso com a aprovação</p>
            <div className="mb-1 flex items-end gap-2">
              <span className="text-4xl font-bold">R$8,25</span>
              <span className="text-indigo-200 text-sm mb-1">/mês</span>
            </div>
            <p className="text-indigo-100 font-semibold text-sm mb-1">R$99 cobrado anualmente</p>
            <p className="text-indigo-300 text-xs mb-8">Economize 45% vs plano mensal</p>
            <ul className="space-y-3 text-sm mb-8">
              {[
                'Questões ilimitadas',
                'IA explica cada resposta',
                'Todos os anos (2009–2024)',
                'Todas as disciplinas',
                'Filtros avançados',
                'Estatísticas detalhadas',
                'Correção de redação — 2 grátis/mês',
              ].map((f) => (
                <li key={f} className="flex gap-2"><span className="text-indigo-300">✓</span>{f}</li>
              ))}
            </ul>
            <div className="flex items-center gap-2 bg-indigo-500/20 rounded-xl px-4 py-2.5 mb-3">
              <span className="text-amber-300 text-lg">🛡️</span>
              <p className="text-indigo-100 text-xs"><strong>Garantia 30 dias</strong> — Devolução total, sem perguntas, sem formulário</p>
            </div>
            <button
              onClick={() => handleCheckout('annual')}
              disabled={loading !== null}
              className="block w-full text-center bg-amber-400 text-zinc-900 py-3.5 rounded-xl font-bold hover:bg-amber-300 transition-colors disabled:opacity-70"
            >
              {loading === 'annual' ? 'Aguarde...' : 'Assinar anual — R$99/ano'}
            </button>
            <p className="text-center text-indigo-300 text-xs mt-2">Garantia de 30 dias · Cancele quando quiser</p>
          </div>

          {/* Pro Mensal */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-left">
            <h2 className="text-xl font-bold mb-1">Pro Mensal</h2>
            <p className="text-zinc-400 text-sm mb-6">Flexibilidade total</p>
            <div className="mb-1">
              <span className="text-4xl font-bold">R$14,90</span>
              <span className="text-zinc-400 text-sm">/mês</span>
            </div>
            <p className="text-zinc-400 text-xs mb-8">Cancele a qualquer momento</p>
            <ul className="space-y-3 text-sm text-zinc-600 mb-8">
              {[
                'Questões ilimitadas',
                'IA explica cada resposta',
                'Todos os anos (2009–2024)',
                'Todas as disciplinas',
                'Filtros avançados',
                'Estatísticas detalhadas',
              ].map((f) => (
                <li key={f} className="flex gap-2"><span className="text-indigo-500">✓</span>{f}</li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('monthly')}
              disabled={loading !== null}
              className="block w-full text-center bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-70"
            >
              {loading === 'monthly' ? 'Aguarde...' : 'Assinar mensal'}
            </button>
          </div>
        </div>

        {/* Garantia */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8 text-center">
          <p className="text-green-800 font-semibold">🛡️ Garantia de 30 dias — devolução total sem perguntas</p>
          <p className="text-green-700 text-sm mt-1">Estude 30 questões/dia por 30 dias. Se não sentir evolução, devolvemos tudo.</p>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-left">
          <h3 className="text-lg font-bold mb-6 text-center">Perguntas frequentes</h3>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <p className="font-medium text-zinc-900 mb-1">{faq.q}</p>
                <p className="text-sm text-zinc-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function EnemCountdown() {
  const days = Math.ceil((new Date('2026-10-26').getTime() - Date.now()) / 86400000)
  if (days <= 0) return null
  return (
    <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 text-sm font-medium text-amber-800 mb-8">
      ⏱️ Faltam <strong>{days} dias</strong> para o ENEM 2026
    </div>
  )
}

const faqs = [
  {
    q: 'Vou realmente melhorar minha nota?',
    a: 'Quem usa a plataforma consistentemente (20+ questões/dia) identifica seus pontos fracos em menos de 2 semanas. A IA explica cada questão errada — não só o gabarito, mas o raciocínio completo. É o mesmo que ter um professor particular por R$8,25/mês.',
  },
  {
    q: 'Funciona para quem tem pouco tempo?',
    a: 'Sim. 15 minutos por dia (10 questões no plano grátis, 30 no Pro) são suficientes para criar consistência. O cronograma integrado distribui as matérias automaticamente pela sua disponibilidade.',
  },
  {
    q: 'É melhor que cursinho?',
    a: 'Para questões do ENEM específico, sim. Um cursinho custa R$3.000-R$8.000/ano e mistura ENEM com vestibulares estaduais. O ENEM Pro usa as questões reais do INEP — as mesmas que vão aparecer na prova — por R$99/ano.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim. Sem fidelidade, sem formulário, sem enrolação. Cancele direto no "Gerenciar assinatura" no dashboard ou nesta página. O reembolso em 30 dias é automático.',
  },
  {
    q: 'As questões são as do ENEM oficial?',
    a: 'Sim. Usamos as questões reais do ENEM de 2009 a 2024, disponibilizadas pelo INEP. Não são "questões inspiradas" — são as mesmas que gerações de candidatos responderam.',
  },
]
