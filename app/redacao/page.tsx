'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'

const supabase = createBrowserClient()

const COMPETENCIAS = [
  { label: 'C1', desc: 'Domínio da Língua Escrita' },
  { label: 'C2', desc: 'Compreensão da Proposta' },
  { label: 'C3', desc: 'Seleção e Organização' },
  { label: 'C4', desc: 'Coesão Textual' },
  { label: 'C5', desc: 'Proposta de Intervenção' },
]

function parseScores(text: string): number[] | null {
  const block = text.match(/---SCORES---([\s\S]*?)---END---/)
  if (!block) return null
  const result = Array(5).fill(0) as number[]
  for (const m of block[1].matchAll(/C(\d):\s*(\d+)/g)) {
    const idx = parseInt(m[1]) - 1
    if (idx >= 0 && idx < 5) result[idx] = Math.min(200, parseInt(m[2]))
  }
  return result
}

function cleanText(text: string): string {
  return text.replace(/---SCORES---[\s\S]*?---END---/, '').trim()
}

function scoreColor(score: number): string {
  if (score >= 160) return 'text-green-600'
  if (score >= 120) return 'text-amber-600'
  if (score >= 80) return 'text-orange-500'
  return 'text-red-500'
}

function totalColor(total: number): string {
  if (total >= 800) return 'text-green-600'
  if (total >= 600) return 'text-amber-600'
  if (total >= 400) return 'text-orange-500'
  return 'text-red-500'
}

export default function RedacaoPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [token, setToken] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [freeUsed, setFreeUsed] = useState(false)
  const [loading, setLoading] = useState(true)

  const [tema, setTema] = useState('')
  const [texto, setTexto] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [result, setResult] = useState('')
  const [scores, setScores] = useState<number[] | null>(null)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push(`/auth/login?next=${encodeURIComponent(pathname)}`); return }
      setToken(session.access_token)

      const [subRes, countRes] = await Promise.all([
        supabase.from('subscriptions').select('plan, expires_at').eq('user_id', session.user.id).maybeSingle(),
        supabase.from('redacao_submissions').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),
      ])
      const sub = subRes.data
      const pro = sub?.plan === 'pro' && sub?.expires_at && new Date(sub.expires_at) > new Date()
      setIsPro(!!pro)
      setFreeUsed(!pro && (countRes.count ?? 0) >= 1)
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (texto.trim().length < 200) { setError('Redação muito curta (mínimo 200 caracteres).'); return }
    if (texto.length > 6000) { setError('Redação muito longa (máximo 6000 caracteres).'); return }

    setError('')
    setResult('')
    setScores(null)
    setSubmitting(true)
    setStreaming(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch('/api/corrigir-redacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tema, texto }),
        signal: ctrl.signal,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.freeUsed) { setFreeUsed(true); setStreaming(false); setSubmitting(false); return }
        throw new Error(data.error || `Erro ${res.status}`)
      }

      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += dec.decode(value, { stream: true })
        setResult(full)
      }

      const parsed = parseScores(full)
      setScores(parsed)
      setResult(cleanText(full))
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const isNetworkError = /fetch|network/i.test(err.message)
        setError(isNetworkError ? 'Erro de conexão. Verifique sua internet e tente novamente.' : err.message)
      }
    } finally {
      setStreaming(false)
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-zinc-400 animate-pulse">Carregando...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-indigo-600 font-bold text-xl">ENEM Pro</Link>
          <div className="flex items-center gap-3">
            {isPro && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">PRO</span>}
            <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-800">← Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Correção de Redação IA</h1>
        <p className="text-zinc-500 mb-8">Avaliação com os critérios exatos do INEP — 5 competências, nota de 0 a 1000.</p>

        {/* Info das competências */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {COMPETENCIAS.map((c) => (
              <div key={c.label} className="text-center">
                <div className="text-indigo-600 font-bold text-sm">{c.label}</div>
                <div className="text-zinc-500 text-xs mt-1">{c.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-400 text-center mt-3">Cada competência vale até 200 pontos · Total: 0–1000</p>
        </div>

        {/* Paywall */}
        {freeUsed && !isPro && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center mb-8">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-bold text-amber-900 mb-1">Você usou sua correção gratuita</h3>
            <p className="text-amber-700 text-sm mb-4">Assine o Pro para correções ilimitadas com IA + análise detalhada.</p>
            <Link href="/planos" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 inline-block">
              Ver Plano Pro — R$29,90/mês
            </Link>
          </div>
        )}

        {/* Formulário */}
        {(!freeUsed || isPro) && !scores && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Tema da redação <span className="text-zinc-400">(opcional)</span></label>
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ex: Desafios da mobilidade urbana no Brasil"
                className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Redação <span className="text-zinc-400">({texto.length}/6000 caracteres)</span>
              </label>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={14}
                placeholder="Cole ou escreva sua redação aqui (mínimo 200 caracteres)..."
                className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <p className="text-xs text-zinc-400 mt-1">
                {!isPro && 'Plano gratuito: 1 correção total. '}
                Mínimo 200 · máximo 6000 caracteres.
              </p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={submitting || texto.trim().length < 200}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Analisando...' : 'Corrigir Redação com IA'}
            </button>
          </form>
        )}

        {/* Resultado streaming */}
        {(streaming || result) && (
          <div className="mt-8">
            {/* Scores */}
            {scores && (
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
                <div className="text-center mb-6">
                  <div className={`text-5xl font-black ${totalColor(scores.reduce((a, b) => a + b, 0))}`}>
                    {scores.reduce((a, b) => a + b, 0)}
                  </div>
                  <div className="text-zinc-500 text-sm mt-1">pontos de 1000</div>
                </div>
                <div className="space-y-3">
                  {COMPETENCIAS.map((c, i) => (
                    <div key={c.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-700">{c.label} — {c.desc}</span>
                        <span className={`font-bold ${scoreColor(scores[i])}`}>{scores[i]}/200</span>
                      </div>
                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${scores[i] >= 160 ? 'bg-green-500' : scores[i] >= 120 ? 'bg-amber-400' : scores[i] >= 80 ? 'bg-orange-400' : 'bg-red-400'}`}
                          style={{ width: `${(scores[i] / 200) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Texto da análise */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <h3 className="font-bold text-zinc-900 mb-4">Análise detalhada</h3>
              <div className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                {result}
                {streaming && <span className="inline-block w-0.5 h-4 bg-zinc-400 animate-pulse ml-0.5 align-text-bottom" />}
              </div>
            </div>

            {scores && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setResult(''); setScores(null); setTexto(''); setTema('') }}
                  className="flex-1 border border-indigo-300 text-indigo-600 py-3 rounded-xl font-semibold hover:bg-indigo-50"
                >
                  Nova redação
                </button>
                <Link href="/questoes?discipline=Linguagens" className="flex-1 text-center bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700">
                  Praticar Linguagens →
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
