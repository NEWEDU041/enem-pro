'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'

const supabase = createBrowserClient()
import { DISCIPLINES, YEARS } from '@/lib/enem-api'

const FREE_DAILY_LIMIT = 10

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { name?: string } } | null>(null)
  const [stats, setStats] = useState({ total: 0, correct: 0, today: 0 })
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      const today = new Date().toISOString().split('T')[0]

      const [answersRes, usageRes, subRes] = await Promise.all([
        supabase.from('user_answers').select('is_correct').eq('user_id', user.id),
        supabase.from('daily_usage').select('count').eq('user_id', user.id).eq('date', today).single(),
        supabase.from('subscriptions').select('plan, expires_at').eq('user_id', user.id).single(),
      ])

      const answers = answersRes.data || []
      const correct = answers.filter((a: { is_correct: boolean }) => a.is_correct).length
      const todayCount = usageRes.data?.count || 0

      const sub = subRes.data
      const pro = sub?.plan === 'pro' && sub?.expires_at && new Date(sub.expires_at) > new Date()
      setIsPro(!!pro)
      setStats({ total: answers.length, correct, today: todayCount })
      setLoading(false)
    }
    load()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-zinc-400">Carregando...</div>

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
  const remaining = isPro ? '∞' : `${Math.max(0, FREE_DAILY_LIMIT - stats.today)}`

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <div className="flex items-center gap-4">
            {!isPro && (
              <Link href="/planos" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                Upgrade Pro
              </Link>
            )}
            <span className="text-sm text-zinc-500">{user?.user_metadata?.name || user?.email}</span>
            <button onClick={handleLogout} className="text-sm text-zinc-400 hover:text-zinc-700">Sair</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Pro banner */}
        {isPro && (
          <div className="bg-indigo-600 text-white rounded-2xl px-6 py-4 mb-8 flex items-center justify-between">
            <span className="font-semibold">✦ Plano Pro ativo — questões ilimitadas + IA</span>
          </div>
        )}
        {!isPro && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-6 py-4 mb-8 flex items-center justify-between">
            <span className="text-sm">Você está no plano gratuito. <strong>{remaining} questões</strong> restantes hoje.</span>
            <Link href="/planos" className="text-sm font-semibold underline">Ver Pro →</Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <StatCard label="Respondidas" value={stats.total.toString()} />
          <StatCard label="Taxa de acerto" value={`${accuracy}%`} />
          <StatCard label="Hoje" value={isPro ? `${stats.today}` : `${stats.today}/${FREE_DAILY_LIMIT}`} />
        </div>

        {/* Quick start */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 mb-8">
          <h2 className="text-xl font-bold mb-6">Estudar agora</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Ano</label>
              <select
                id="year-select"
                className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Disciplina</label>
              <select
                id="disc-select"
                className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todas</option>
                {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <StartButton isPro={isPro} remaining={isPro ? Infinity : Math.max(0, FREE_DAILY_LIMIT - stats.today)} />
        </div>

        {/* History link */}
        <div className="text-center">
          <Link href="/questoes" className="text-sm text-indigo-600 hover:underline">
            Ver todas as questões por ano e disciplina →
          </Link>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center">
      <div className="text-3xl font-bold text-indigo-600 mb-1">{value}</div>
      <div className="text-sm text-zinc-500">{label}</div>
    </div>
  )
}

function StartButton({ isPro, remaining }: { isPro: boolean; remaining: number }) {
  function handleStart() {
    const year = (document.getElementById('year-select') as HTMLSelectElement)?.value || '2023'
    const disc = (document.getElementById('disc-select') as HTMLSelectElement)?.value || ''
    const params = new URLSearchParams({ year })
    if (disc) params.set('discipline', disc)
    window.location.href = `/questoes?${params.toString()}`
  }

  if (!isPro && remaining <= 0) {
    return (
      <div className="mt-6 text-center">
        <p className="text-sm text-zinc-500 mb-3">Limite diário atingido. Volta amanhã ou assine o Pro.</p>
        <a href="/planos" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors inline-block">
          Ver plano Pro
        </a>
      </div>
    )
  }

  return (
    <button
      onClick={handleStart}
      className="mt-6 w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
    >
      Começar a estudar
    </button>
  )
}
