'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'

const supabase = createBrowserClient()

export default function PlanosPage() {
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null)

  async function handleCheckout(plan: 'monthly' | 'annual') {
    setLoading(plan)
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
        alert('Erro ao iniciar pagamento. Tente novamente.')
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
        <h1 className="text-4xl font-bold mb-4">Escolha seu plano</h1>
        <p className="text-zinc-500 mb-14">Comece grátis. Assine quando quiser mais.</p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
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

          {/* Pro */}
          <div className="bg-indigo-600 rounded-2xl p-8 text-left text-white relative">
            <div className="absolute top-4 right-4 bg-amber-400 text-zinc-900 text-xs font-bold px-3 py-1 rounded-full">
              MAIS POPULAR
            </div>
            <h2 className="text-xl font-bold mb-1">Pro</h2>
            <p className="text-indigo-200 text-sm mb-6">Cancele quando quiser</p>
            <div className="mb-1">
              <span className="text-4xl font-bold">R$14,90</span>
              <span className="text-indigo-200 text-sm">/mês</span>
            </div>
            <p className="text-indigo-200 text-xs mb-8">ou R$99/ano (R$8,25/mês)</p>
            <ul className="space-y-3 text-sm mb-8">
              {[
                'Questões ilimitadas',
                'IA explica cada resposta',
                'Todos os anos (2009–2024)',
                'Todas as disciplinas',
                'Filtros avançados',
                'Estatísticas detalhadas',
              ].map((f) => (
                <li key={f} className="flex gap-2"><span className="text-indigo-300">✓</span>{f}</li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('monthly')}
              disabled={loading !== null}
              className="block w-full text-center bg-white text-indigo-600 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-70"
            >
              {loading === 'monthly' ? 'Aguarde...' : 'Assinar Pro — R$14,90/mês'}
            </button>
            <button
              onClick={() => handleCheckout('annual')}
              disabled={loading !== null}
              className="block w-full text-center mt-3 border border-indigo-300 text-indigo-100 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors disabled:opacity-70"
            >
              {loading === 'annual' ? 'Aguarde...' : 'Plano anual — R$99/ano (economize 45%)'}
            </button>
          </div>
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

const faqs = [
  {
    q: 'O plano grátis é realmente grátis para sempre?',
    a: 'Sim. O plano gratuito permite 10 questões por dia sem limite de prazo. Não precisa de cartão de crédito.',
  },
  {
    q: 'O que é a "explicação por IA"?',
    a: 'Após você responder uma questão, a IA analisa a questão e gera uma explicação detalhada de por que a alternativa correta é a certa e por que as outras estão erradas.',
  },
  {
    q: 'As questões são as do ENEM oficial?',
    a: 'Sim. Usamos as questões reais do ENEM de 2009 a 2024, disponibilizadas publicamente pelo INEP.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim. Não há fidelidade. Cancele a qualquer momento no painel do Stripe.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Cartão de crédito/débito (Visa, Mastercard, Elo) via Stripe. Parcelamento disponível.',
  },
]
