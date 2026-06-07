'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'

const supabase = createBrowserClient()
import { DISCIPLINES, YEARS } from '@/lib/enem-api'
import { FREE_DAILY_LIMIT } from '@/lib/utils'

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Carregando...</div>}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { name?: string } } | null>(null)
  type DiscStat = { discipline: string; total: number; correct: number }
  const [stats, setStats] = useState({ total: 0, correct: 0, today: 0 })
  const [discStats, setDiscStats] = useState<DiscStat[]>([])
  const [recentWrong, setRecentWrong] = useState<{ question_id: string; discipline: string; year: number; answered_at: string }[]>([])
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [upgradeSuccess] = useState(searchParams.get('upgrade') === 'success')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      const today = new Date().toISOString().split('T')[0]

      const [answersRes, usageRes, subRes] = await Promise.all([
        supabase.from('user_answers').select('is_correct, discipline, year, question_id, answered_at').eq('user_id', user.id).order('answered_at', { ascending: false }).limit(500),
        supabase.from('daily_usage').select('count').eq('user_id', user.id).eq('date', today).maybeSingle(),
        supabase.from('subscriptions').select('plan, expires_at').eq('user_id', user.id).maybeSingle(),
      ])

      type Answer = { is_correct: boolean; discipline: string; year: number; question_id: string; answered_at: string }
      const answers: Answer[] = answersRes.data || []
      const correct = answers.filter((a) => a.is_correct).length
      const todayCount = usageRes.data?.count || 0

      // Breakdown por disciplina
      const byDisc: Record<string, { total: number; correct: number }> = {}
      for (const a of answers) {
        if (!a.discipline) continue
        if (!byDisc[a.discipline]) byDisc[a.discipline] = { total: 0, correct: 0 }
        byDisc[a.discipline].total++
        if (a.is_correct) byDisc[a.discipline].correct++
      }
      setDiscStats(Object.entries(byDisc).map(([discipline, s]) => ({ discipline, ...s })).sort((a, b) => b.total - a.total))

      const wrong = answers.filter((a) => !a.is_correct && a.discipline && a.year).slice(0, 5)
      setRecentWrong(wrong)

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

  if (loading) return <DashboardSkeleton />

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
        {upgradeSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl px-6 py-4 mb-6 flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <span className="font-medium">Bem-vindo ao Pro! Seu plano foi ativado com sucesso.</span>
          </div>
        )}
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

        {/* Quick access — Simulado e Redação */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link href="/simulado" className="bg-white rounded-2xl border border-zinc-200 p-6 hover:border-indigo-400 hover:shadow-sm transition-all flex items-center gap-4">
            <div className="text-3xl">⏱</div>
            <div className="min-w-0">
              <div className="font-bold text-zinc-900">Modo Simulado</div>
              <div className="text-sm text-zinc-500">10/20/45 questões com timer + relatório</div>
            </div>
            <span className="ml-auto text-zinc-300 text-lg shrink-0">→</span>
          </Link>
          <Link href="/redacao" className="bg-white rounded-2xl border border-zinc-200 p-6 hover:border-indigo-400 hover:shadow-sm transition-all flex items-center gap-4">
            <div className="text-3xl">📝</div>
            <div className="min-w-0">
              <div className="font-bold text-zinc-900">Correção de Redação IA</div>
              <div className="text-sm text-zinc-500">5 competências INEP — nota 0 a 1000</div>
            </div>
            <span className="ml-auto text-zinc-300 text-lg shrink-0">→</span>
          </Link>
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
                defaultValue="Matemática"
                className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todas</option>
                {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <StartButton isPro={isPro} remaining={isPro ? Infinity : Math.max(0, FREE_DAILY_LIMIT - stats.today)} />
        </div>

        {/* Breakdown por disciplina */}
        {discStats.length > 0 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Desempenho por disciplina</h2>
            <div className="space-y-3">
              {discStats.map((d) => {
                const pct = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0
                return (
                  <div key={d.discipline}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-700 truncate max-w-[60%]">{d.discipline}</span>
                      <span className={`font-semibold ${pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{pct}% ({d.correct}/{d.total})</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Revisão de erros recentes */}
        {recentWrong.length > 0 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Revisar questões erradas</h2>
            <div className="space-y-2">
              {recentWrong.map((w) => (
                <Link key={`${w.question_id}-${w.answered_at}`} href={`/questoes/${w.question_id}?year=${w.year}`}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm">
                  <span className="text-zinc-700">{w.discipline} — ENEM {w.year}</span>
                  <span className="text-indigo-500 text-xs">Revisar →</span>
                </Link>
              ))}
            </div>
          </div>
        )}

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

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 animate-pulse">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="h-7 w-28 bg-zinc-200 rounded-lg" />
          <div className="flex items-center gap-4">
            <div className="h-8 w-24 bg-zinc-200 rounded-lg" />
            <div className="h-4 w-32 bg-zinc-100 rounded" />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-6 text-center">
              <div className="h-10 w-16 bg-zinc-200 rounded mx-auto mb-2" />
              <div className="h-4 w-24 bg-zinc-100 rounded mx-auto" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 mb-8">
          <div className="h-6 w-40 bg-zinc-200 rounded mb-6" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-12 bg-zinc-100 rounded-lg" />
            <div className="h-12 bg-zinc-100 rounded-lg" />
          </div>
          <div className="h-14 bg-indigo-100 rounded-xl mt-6" />
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="h-6 w-48 bg-zinc-200 rounded mb-4" />
          {[1,2,3].map(i => (
            <div key={i} className="h-8 bg-zinc-100 rounded-lg mb-3" />
          ))}
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
