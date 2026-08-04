'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { DISCIPLINES } from '@/lib/enem-constants'
import { ENEM_DATE, daysUntil } from '@/lib/utils'

const DISC_SHORT: Record<string, string> = {
  'Matemática': 'Matemática',
  'Linguagens, Códigos e suas Tecnologias': 'Linguagens',
  'Ciências Humanas e suas Tecnologias': 'Ciências Humanas',
  'Ciências da Natureza e suas Tecnologias': 'Ciências da Natureza',
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const SESSIONS_PER_DAY = [
  { label: '1 sessão (30 min)', value: 1 },
  { label: '2 sessões (1h)', value: 2 },
  { label: '3 sessões (1h30)', value: 3 },
  { label: '4 sessões (2h)', value: 4 },
]

type Priority = 'alta' | 'media' | 'baixa'

const PRIO_LABEL: Record<Priority, string> = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }
const PRIO_COLOR: Record<Priority, string> = {
  alta: 'bg-red-50 text-red-700 border-red-200',
  media: 'bg-amber-50 text-amber-700 border-amber-200',
  baixa: 'bg-green-50 text-green-700 border-green-200',
}

type WeekPlan = {
  day: string
  sessions: { disc: string; topic: string }[]
}[]

function buildCronograma(
  daysPerWeek: number[],
  sessionsPerDay: number,
  priorities: Record<string, Priority>
): WeekPlan {
  // Sort disciplines by priority: alta first
  const sorted = DISCIPLINES.slice().sort((a, b) => {
    const order: Record<Priority, number> = { alta: 0, media: 1, baixa: 2 }
    return order[priorities[a] || 'media'] - order[priorities[b] || 'media']
  })

  // Allocate sessions per disc proportionally
  const totalSlots = daysPerWeek.length * sessionsPerDay
  const weights = sorted.map((d) => {
    const p = priorities[d] || 'media'
    return p === 'alta' ? 3 : p === 'media' ? 2 : 1
  })
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  const slots = weights.map((w) => Math.max(1, Math.round((w / totalWeight) * totalSlots)))

  // Build flat session list
  const sessionList: { disc: string; topic: string }[] = []
  const TOPICS: Record<string, string[]> = {
    'Matemática': ['Funções e gráficos', 'Geometria plana', 'Estatística e probabilidade', 'Geometria espacial', 'Progressões PA/PG', 'Trigonometria', 'Logaritmos'],
    'Linguagens, Códigos e suas Tecnologias': ['Interpretação de texto', 'Gramática e norma culta', 'Literatura brasileira', 'Gêneros textuais', 'Língua estrangeira', 'Semiótica'],
    'Ciências Humanas e suas Tecnologias': ['História do Brasil', 'Geopolítica', 'Filosofia', 'Sociologia', 'Geografia física', 'Atualidades'],
    'Ciências da Natureza e suas Tecnologias': ['Química orgânica', 'Física — mecânica', 'Biologia celular', 'Termodinâmica', 'Genética', 'Ecologia'],
  }

  sorted.forEach((disc, i) => {
    const count = slots[i]
    const topics = TOPICS[disc] || []
    for (let j = 0; j < count; j++) {
      sessionList.push({ disc, topic: topics[j % topics.length] || 'Revisão geral' })
    }
  })

  // Distribute sessions across days
  const plan: WeekPlan = daysPerWeek.map((dayIdx) => ({
    day: DAYS_OF_WEEK[dayIdx],
    sessions: [],
  }))

  let si = 0
  for (let slot = 0; slot < sessionsPerDay; slot++) {
    for (let di = 0; di < daysPerWeek.length; di++) {
      if (si < sessionList.length) {
        plan[di].sessions.push(sessionList[si++])
      }
    }
  }

  return plan
}

function CronogramaContent() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  useEffect(() => {
    // Must run client-only post-mount: this page can be statically prerendered
    // and served from cache for up to 24h (see next.config.js Cache-Control),
    // so computing this during render would bake a stale value into cached
    // HTML and mismatch what hydration recomputes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
    setDaysLeft(daysUntil(ENEM_DATE))
  }, [])
  const weeksLeft = daysLeft !== null ? Math.floor(daysLeft / 7) : 0

  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]) // Seg-Sex default
  const [sessionsPerDay, setSessionsPerDay] = useState(2)
  const [priorities, setPriorities] = useState<Record<string, Priority>>({})
  const [plan, setPlan] = useState<WeekPlan | null>(null)
  const [generated, setGenerated] = useState(false)

  function toggleDay(d: number) {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    )
  }

  function generate() {
    if (selectedDays.length === 0) return
    const p = buildCronograma(selectedDays, sessionsPerDay, priorities)
    setPlan(p)
    setGenerated(true)
    // Save to localStorage
    localStorage.setItem('enem_cronograma', JSON.stringify({ selectedDays, sessionsPerDay, priorities, plan: p }))
  }

  // Load saved plan
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('enem_cronograma') || 'null')
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs React state with localStorage, an external system
        setSelectedDays(saved.selectedDays || [1,2,3,4,5])
        setSessionsPerDay(saved.sessionsPerDay || 2)
        setPriorities(saved.priorities || {})
        setPlan(saved.plan || null)
        setGenerated(!!saved.plan)
      }
    } catch { /* empty */ }
  }, [])

  const totalSessionsWeek = selectedDays.length * sessionsPerDay
  const totalQuestoes = totalSessionsWeek * 5 // ~5 questões por sessão

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-900">← Dashboard</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">Cronograma de Estudos ENEM 2026</h1>
          <p className="text-zinc-500 text-sm">
            {daysLeft !== null && daysLeft > 0
              ? `Faltam ${daysLeft} dias (${weeksLeft} semanas) para o ENEM 2026. Monte seu plano agora.`
              : 'Monte seu cronograma de estudos personalizado.'}
          </p>
        </div>

        {/* Countdown */}
        {daysLeft !== null && daysLeft > 0 && (
          <div className="bg-white border border-amber-200 rounded-2xl px-6 py-4 mb-8 flex items-center gap-4">
            <div className="text-3xl">⏰</div>
            <div>
              <div className="text-2xl font-bold text-amber-700">{daysLeft} dias</div>
              <div className="text-sm text-amber-600">para o ENEM 2026 — {ENEM_DATE.toLocaleDateString('pt-BR')}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-lg font-bold text-zinc-700">{weeksLeft} semanas</div>
              <div className="text-xs text-zinc-400">{weeksLeft * totalQuestoes}+ questões possíveis</div>
            </div>
          </div>
        )}

        {/* Setup */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
          <h2 className="font-bold text-zinc-900 mb-4">1. Dias de estudo por semana</h2>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((d, i) => (
              <button
                key={d}
                onClick={() => toggleDay(i)}
                className={`w-12 h-12 rounded-xl text-sm font-semibold transition-colors ${
                  selectedDays.includes(i)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-400 mt-3">{selectedDays.length} dia{selectedDays.length !== 1 ? 's' : ''} selecionado{selectedDays.length !== 1 ? 's' : ''} por semana</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
          <h2 className="font-bold text-zinc-900 mb-4">2. Sessões por dia</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SESSIONS_PER_DAY.map((s) => (
              <button
                key={s.value}
                onClick={() => setSessionsPerDay(s.value)}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                  sessionsPerDay === s.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
          <h2 className="font-bold text-zinc-900 mb-2">3. Prioridade por disciplina</h2>
          <p className="text-sm text-zinc-500 mb-4">Onde você tem mais dificuldade? O cronograma vai alocar mais tempo nessas áreas.</p>
          <div className="space-y-3">
            {DISCIPLINES.map((d) => {
              const short = DISC_SHORT[d]
              const prio = priorities[d] || 'media'
              return (
                <div key={d} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-700 min-w-0 truncate">{short}</span>
                  <div className="flex gap-1.5 shrink-0">
                    {(['alta', 'media', 'baixa'] as Priority[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriorities((prev) => ({ ...prev, [d]: p }))}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                          prio === p
                            ? PRIO_COLOR[p]
                            : 'border-zinc-200 text-zinc-400 hover:bg-zinc-50'
                        }`}
                      >
                        {PRIO_LABEL[p]}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={selectedDays.length === 0}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 mb-8"
        >
          Gerar meu cronograma →
        </button>

        {/* Plan output */}
        {generated && plan && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900">Seu cronograma semanal</h2>
              <div className="text-sm text-zinc-500">{totalSessionsWeek} sessões/semana · ~{totalQuestoes} questões</div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {plan.filter((d) => d.sessions.length > 0).map((dayPlan) => (
                <div key={dayPlan.day} className="bg-white rounded-2xl border border-zinc-200 p-5">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">{dayPlan.day}</div>
                  <div className="space-y-2">
                    {dayPlan.sessions.map((s, i) => {
                      const short = DISC_SHORT[s.disc] || s.disc
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-zinc-800 truncate">{short}</div>
                            <div className="text-xs text-zinc-400 truncate">{s.topic}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {dayPlan.sessions.length > 0 && (
                    <Link
                      href={`/questoes?discipline=${encodeURIComponent(dayPlan.sessions[0].disc)}`}
                      className="block mt-3 text-center text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg py-1.5 hover:bg-indigo-50 transition-colors"
                    >
                      Praticar →
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Dicas de produtividade */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
              <h3 className="font-bold text-zinc-900 mb-4">Dicas para manter o cronograma</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {[
                  { icon: '⏱', tip: 'Use a técnica Pomodoro: 25 min de foco + 5 min de pausa. Repita 4 vezes.' },
                  { icon: '📱', tip: 'Ative o lembrete diário no ENEM Pro para não perder nenhuma sessão.' },
                  { icon: '❌', tip: 'Revise no Modo Revisão toda semana as questões que errou naquela semana.' },
                  { icon: '📊', tip: 'Acompanhe sua taxa de acerto por disciplina no dashboard para ajustar prioridades.' },
                ].map(({ icon, tip }) => (
                  <div key={tip} className="flex gap-3">
                    <span className="text-lg shrink-0">{icon}</span>
                    <p className="text-zinc-600 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <Link href="/questoes" className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                Começar a estudar agora →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function CronogramaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Carregando...</div>}>
      <CronogramaContent />
    </Suspense>
  )
}
