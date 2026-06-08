'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import PushSubscribeButton from '@/components/PushSubscribeButton'

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
  const [stats, setStats] = useState({ total: 0, correct: 0, today: 0, streak: 0 })
  const [discStats, setDiscStats] = useState<DiscStat[]>([])
  const [recentWrong, setRecentWrong] = useState<{ question_id: string; discipline: string; year: number; answered_at: string }[]>([])
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [upgradeSuccess] = useState(searchParams.get('upgrade') === 'success')
  const [goal, setGoal] = useState<{ course: string; university: string; score: number } | null>(null)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalScore, setGoalScore] = useState(700)
  const [referralCode, setReferralCode] = useState('')
  const [referralCount, setReferralCount] = useState(0)
  const [copied, setCopied] = useState(false)

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

      // Streak: dias consecutivos com pelo menos 1 resposta
      const days = [...new Set(answers.map((a) => a.answered_at.split('T')[0]))].sort((a, b) => b.localeCompare(a))
      const todayStr = new Date().toISOString().split('T')[0]
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      let streak = 0
      // Streaks que incluem hoje ou ontem (ontem = ainda válido se não respondeu hoje)
      const startDay = days[0] === todayStr || days[0] === yesterdayStr ? days[0] : null
      if (startDay) {
        const startDate = new Date(startDay)
        for (let i = 0; i < days.length; i++) {
          const expected = new Date(startDate)
          expected.setDate(startDate.getDate() - i)
          const expectedStr = expected.toISOString().split('T')[0]
          if (days[i] === expectedStr) streak++
          else break
        }
      }
      setStats({ total: answers.length, correct, today: todayCount, streak })

      const sub = subRes.data
      const pro = sub?.plan === 'pro' && sub?.expires_at && new Date(sub.expires_at) > new Date()
      setIsPro(!!pro)

      // Gap 10 — load goal from user metadata
      const meta = user.user_metadata || {}
      if (meta.goal_course) {
        const s = meta.goal_score || 700
        setGoal({ course: meta.goal_course, university: meta.goal_university || '', score: s })
        setGoalScore(s)
      }

      // Gap 12 — load referral code
      fetch(`/api/referral?user_id=${user.id}`)
        .then(r => r.json())
        .then(d => { if (d.code) { setReferralCode(d.code); setReferralCount(d.total || 0) } })
        .catch(() => {})

      // Gap 8 — trigger D0 welcome email (only once)
      if (!meta.email_drip_d0_sent) {
        fetch('/api/email-drip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, email: user.email, name: meta.name || '', drip_day: 0 }),
        }).catch(() => {})
        // Mark as triggered (optimistic — avoids second trigger)
        supabase.auth.updateUser({ data: { email_drip_d0_sent: true } }).catch(() => {})
      }

      // Gap 12 — process ref code from localStorage (referred user)
      const refCode = typeof window !== 'undefined' ? localStorage.getItem('enem_ref') : null
      if (refCode && !meta.ref_processed) {
        fetch('/api/referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ref_code: refCode, referred_user_id: user.id }),
        }).catch(() => {})
        supabase.auth.updateUser({ data: { ref_processed: true } }).catch(() => {})
        localStorage.removeItem('enem_ref')
      }

      setLoading(false)
    }
    load()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleSaveGoal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const g = {
      course: fd.get('course') as string,
      university: fd.get('university') as string,
      score: goalScore,
    }
    await supabase.auth.updateUser({ data: { goal_course: g.course, goal_university: g.university, goal_score: g.score } })
    setGoal(g)
    setEditingGoal(false)
  }

  function copyReferral() {
    const siteUrl = window.location.origin
    navigator.clipboard.writeText(`${siteUrl}/r/${referralCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
        <div className="grid grid-cols-4 gap-4 mb-10">
          <StatCard label="Respondidas" value={stats.total.toString()} />
          <StatCard label="Taxa de acerto" value={`${accuracy}%`} />
          <StatCard label="Hoje" value={isPro ? `${stats.today}` : `${stats.today}/${FREE_DAILY_LIMIT}`} />
          <StatCard label="Sequência" value={stats.streak > 0 ? `${stats.streak}d` : '—'} highlight={stats.streak >= 3} />
        </div>

        {/* Quick access — Simulado, Redação, Revisão, Histórico */}
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
          <Link href="/revisao" className="bg-white rounded-2xl border border-red-100 p-6 hover:border-red-400 hover:shadow-sm transition-all flex items-center gap-4">
            <div className="text-3xl">🔁</div>
            <div className="min-w-0">
              <div className="font-bold text-zinc-900">Modo Revisão</div>
              <div className="text-sm text-zinc-500">Todas as questões erradas — filtre por disciplina</div>
            </div>
            <span className="ml-auto text-zinc-300 text-lg shrink-0">→</span>
          </Link>
          <Link href="/historico" className="bg-white rounded-2xl border border-zinc-200 p-6 hover:border-indigo-400 hover:shadow-sm transition-all flex items-center gap-4">
            <div className="text-3xl">📋</div>
            <div className="min-w-0">
              <div className="font-bold text-zinc-900">Histórico completo</div>
              <div className="text-sm text-zinc-500">Todas as respostas com filtros por acerto/disciplina</div>
            </div>
            <span className="ml-auto text-zinc-300 text-lg shrink-0">→</span>
          </Link>
          <Link href="/favoritos" className="bg-white rounded-2xl border border-amber-100 p-6 hover:border-amber-400 hover:shadow-sm transition-all flex items-center gap-4">
            <div className="text-3xl">⭐</div>
            <div className="min-w-0">
              <div className="font-bold text-zinc-900">Questões salvas</div>
              <div className="text-sm text-zinc-500">Favoritos — salve questões importantes para rever</div>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Últimos erros</h2>
              <Link href="/revisao" className="text-xs text-indigo-600 font-semibold hover:underline">
                Ver todos →
              </Link>
            </div>
            <div className="space-y-2">
              {recentWrong.map((w) => (
                <Link key={`${w.question_id}-${w.answered_at}`} href={`/questoes/${w.question_id}?year=${w.year}`}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm">
                  <span className="text-zinc-700">{w.discipline.split(',')[0]} — ENEM {w.year}</span>
                  <span className="text-indigo-500 text-xs">Revisar →</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Gap 10 — Meta de aprovação */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
          {!goal || editingGoal ? (
            <>
              <h2 className="text-lg font-bold mb-1">
                {goal ? 'Editar meta' : 'Defina sua meta de aprovação'}
              </h2>
              <p className="text-zinc-500 text-sm mb-4">
                Qual curso e universidade você quer entrar? A meta muda tudo.
              </p>
              <form onSubmit={handleSaveGoal} className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Curso</label>
                    <select name="course" defaultValue={goal?.course || ''} required
                      className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Selecione</option>
                      {['Medicina','Direito','Engenharia','Odontologia','Psicologia','Administração','Arquitetura','Enfermagem','Farmácia','Pedagogia','Outro'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Universidade</label>
                    <input type="text" name="university" defaultValue={goal?.university || ''}
                      placeholder="ex: USP, UFMG, UNICAMP..."
                      className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">
                    Nota alvo (média das 5 provas): <strong className="text-indigo-600">{goalScore}</strong>
                  </label>
                  <input type="range" name="score" min={500} max={950} step={10}
                    value={goalScore}
                    onChange={e => setGoalScore(Number(e.target.value))}
                    className="w-full accent-indigo-600" />
                  <div className="flex justify-between text-xs text-zinc-400 mt-1">
                    <span>500</span><span>700</span><span>950</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit"
                    className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">
                    Salvar meta
                  </button>
                  {goal && (
                    <button type="button" onClick={() => setEditingGoal(false)}
                      className="text-zinc-500 text-sm px-4 py-2 rounded-lg hover:bg-zinc-100">
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Minha meta</div>
                <div className="font-bold text-zinc-900 text-lg">
                  {goal.course}{goal.university ? ` — ${goal.university}` : ''}
                </div>
                <div className="text-zinc-500 text-sm mt-0.5">
                  Nota alvo: <span className="font-semibold text-indigo-600">{goal.score} pts</span>
                  {stats.total > 0 && (
                    <span className="ml-2 text-zinc-400">
                      · Taxa atual: {Math.round((stats.correct / stats.total) * 1000)}pts TRI estimado
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => { setGoalScore(goal.score); setEditingGoal(true) }}
                className="text-xs text-zinc-400 hover:text-zinc-700 underline shrink-0">
                Editar
              </button>
            </div>
          )}
        </div>

        {/* Gap 12 — Referral */}
        {referralCode && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-zinc-900 mb-1">Indique um amigo — ambos ganham 7 dias Pro</h2>
                <p className="text-zinc-500 text-sm mb-3">
                  Compartilhe seu link. Quando o amigo criar conta, você ganha 7 dias de Pro grátis.
                  {referralCount > 0 && <span className="ml-1 text-indigo-600 font-semibold">{referralCount} indicados até agora.</span>}
                </p>
                <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2 max-w-sm">
                  <span className="text-xs text-zinc-600 truncate flex-1">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://enem-pro-eight.vercel.app'}/r/{referralCode}
                  </span>
                  <button onClick={copyReferral}
                    className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lembrete de estudos */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-6">
          <PushSubscribeButton />
        </div>

        {/* Bottom links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-indigo-600">
          <Link href="/questoes" className="hover:underline">Questões por ano →</Link>
          <Link href="/revisao" className="hover:underline">Modo revisão →</Link>
          <Link href="/historico" className="hover:underline">Histórico completo →</Link>
          <Link href="/favoritos" className="hover:underline">Favoritos →</Link>
          <Link href="/gabarito" className="hover:underline">Gabarito ENEM →</Link>
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
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[1,2,3,4].map(i => (
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

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-6 text-center ${highlight ? 'bg-amber-50 border-amber-200' : 'bg-white border-zinc-200'}`}>
      <div className={`text-3xl font-bold mb-1 ${highlight ? 'text-amber-600' : 'text-indigo-600'}`}>{value}</div>
      <div className="text-sm text-zinc-500">{label}</div>
      {highlight && <div className="text-xs text-amber-500 mt-1">em chamas!</div>}
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
