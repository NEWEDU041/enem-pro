'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { DISCIPLINES, YEARS } from '@/lib/enem-api'
import { isPro, FREE_DAILY_LIMIT } from '@/lib/utils'

const supabase = createBrowserClient()

type SimState = 'setup' | 'loading' | 'active' | 'finished'

interface Question {
  index: number
  year: number
  discipline: string
  alternativesIntroduction: string
  alternatives: { letter: string; text: string }[]
  correctAlternative: string
  files?: { type: string; src: string }[]
}

interface Answer {
  question_id: string
  selected_alternative: string
  correct_alternative: string
  discipline: string
  year: number
  is_correct: boolean
  time_ms: number
}

const DISC_COLORS = ['bg-indigo-500', 'bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function SimuladoPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Setup state
  const [qCount, setQCount] = useState<10 | 20 | 45>(20)
  const [year, setYear] = useState(2023)
  const [discipline, setDiscipline] = useState('')

  // Simulado state
  const [state, setState] = useState<SimState>('setup')
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)

  // Answers tracked via ref to avoid stale closures
  const answersRef = useRef<Answer[]>([])

  // Timer
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const questionStartRef = useRef<number>(0)

  // Finished state
  const [finalAnswers, setFinalAnswers] = useState<Answer[]>([])
  const [totalTime, setTotalTime] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth/login'); return }
      setToken(session.access_token)
      setAuthLoading(false)
    })
  }, [router])

  const finishSimulado = useCallback((answers: Answer[], elapsed: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setFinalAnswers(answers)
    setTotalTime(elapsed)
    setState('finished')
  }, [])

  // Timer tick
  useEffect(() => {
    if (state !== 'active') return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          finishSimulado(answersRef.current, qCount * 60 - 1)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state, qCount, finishSimulado])

  async function startSimulado() {
    // Verificar limite free antes de iniciar
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const today = new Date().toISOString().split('T')[0]
      const { data: usage } = await supabase.from('daily_usage').select('count').eq('user_id', session.user.id).eq('date', today).maybeSingle()
      const { data: sub } = await supabase.from('subscriptions').select('plan, expires_at').eq('user_id', session.user.id).maybeSingle()

      if (!isPro(sub) && (usage?.count ?? 0) >= FREE_DAILY_LIMIT) {
        alert('Você atingiu o limite diário de 10 questões. Volte amanhã ou assine o Pro para questões ilimitadas.')
        return
      }
    }

    setState('loading')
    answersRef.current = []
    try {
      const params = new URLSearchParams({ year: String(year), limit: String(qCount) })
      if (discipline) params.set('discipline', discipline)
      const res = await fetch(`/api/questoes?${params}`)
      const data = await res.json()
      const all: Question[] = data.questions || []
      const picked = shuffle(all).slice(0, qCount)
      setQuestions(picked)
      setCurrent(0)
      setSelected(null)
      setRevealed(false)
      setTimeLeft(qCount * 60)
      questionStartRef.current = Date.now()
      setState('active')
    } catch {
      setState('setup')
    }
  }

  function handleSelect(letter: string) {
    if (revealed) return
    setSelected(letter)
    setRevealed(true)
    const q = questions[current]
    const time_ms = Date.now() - questionStartRef.current
    const answer: Answer = {
      question_id: `${q.year}-${q.index}`,
      selected_alternative: letter,
      correct_alternative: q.correctAlternative,
      discipline: q.discipline,
      year: q.year,
      is_correct: letter === q.correctAlternative,
      time_ms,
    }
    answersRef.current = [...answersRef.current, answer]
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      const elapsed = qCount * 60 - timeLeft
      finishSimulado(answersRef.current, elapsed)
      return
    }
    setCurrent((c) => c + 1)
    setSelected(null)
    setRevealed(false)
    questionStartRef.current = Date.now()
  }

  async function saveResults(answers: Answer[]) {
    if (!token || saving) return
    setSaving(true)
    try {
      await fetch('/api/simulado/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      })
    } finally {
      setSaving(false)
    }
  }

  // Auto-save when finished
  useEffect(() => {
    if (state === 'finished' && finalAnswers.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- saveResults persists to API, setSaving is incidental
      saveResults(finalAnswers)
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-zinc-400 animate-pulse">Carregando...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-indigo-600 font-bold text-xl">ENEM Pro</Link>
          {state === 'active' && (
            <div className="flex items-center gap-6">
              <span className="text-sm text-zinc-500">{current + 1}/{questions.length}</span>
              <span className={`font-mono font-bold text-lg ${timeLeft < 120 ? 'text-red-500' : 'text-zinc-700'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
          {state !== 'active' && (
            <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-800">← Dashboard</Link>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* ── SETUP ── */}
        {state === 'setup' && (
          <SetupScreen
            qCount={qCount} setQCount={setQCount}
            year={year} setYear={setYear}
            discipline={discipline} setDiscipline={setDiscipline}
            onStart={startSimulado}
          />
        )}

        {/* ── LOADING ── */}
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500">Carregando questões...</p>
          </div>
        )}

        {/* ── ACTIVE ── */}
        {state === 'active' && questions.length > 0 && (
          <ActiveScreen
            question={questions[current]}
            current={current}
            total={questions.length}
            selected={selected}
            revealed={revealed}
            onSelect={handleSelect}
            onNext={handleNext}
          />
        )}

        {/* ── FINISHED ── */}
        {state === 'finished' && (
          <FinishedScreen
            answers={finalAnswers}
            totalTime={totalTime}
            onRestart={() => setState('setup')}
          />
        )}
      </main>
    </div>
  )
}

function SetupScreen({
  qCount, setQCount, year, setYear, discipline, setDiscipline, onStart,
}: {
  qCount: 10 | 20 | 45
  setQCount: (n: 10 | 20 | 45) => void
  year: number
  setYear: (y: number) => void
  discipline: string
  setDiscipline: (d: string) => void
  onStart: () => void
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Modo Simulado</h1>
      <p className="text-zinc-500 mb-8">Pratique com timer, veja seu desempenho e nota estimada.</p>

      <div className="bg-white rounded-2xl border border-zinc-200 p-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-3">Quantidade de questões</label>
          <div className="grid grid-cols-3 gap-3">
            {([10, 20, 45] as const).map((n) => (
              <button
                key={n}
                onClick={() => setQCount(n)}
                className={`py-4 rounded-xl font-bold text-sm border transition-all ${qCount === n ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-zinc-700 border-zinc-200 hover:border-indigo-400'}`}
              >
                {n} questões
                <div className={`text-xs font-normal mt-1 ${qCount === n ? 'text-indigo-200' : 'text-zinc-400'}`}>
                  {n === 10 ? '~10 min' : n === 20 ? '~20 min' : '~45 min'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">Ano</label>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">Disciplina</label>
            <select value={discipline} onChange={(e) => setDiscipline(e.target.value)}
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Todas</option>
              {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <button onClick={onStart}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors">
          Iniciar Simulado
        </button>
      </div>
    </div>
  )
}

function ActiveScreen({
  question, current, total, selected, revealed, onSelect, onNext,
}: {
  question: Question
  current: number
  total: number
  selected: string | null
  revealed: boolean
  onSelect: (l: string) => void
  onNext: () => void
}) {
  const progress = ((current) / total) * 100

  return (
    <div>
      {/* Progress bar */}
      <div className="h-1.5 bg-zinc-200 rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="text-xs text-zinc-400 mb-3 flex gap-3">
        <span>ENEM {question.year}</span>
        <span>·</span>
        <span>{question.discipline}</span>
        <span>·</span>
        <span>Questão {current + 1} de {total}</span>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
        {/* Imagens da questão */}
        {question.files?.filter((f) => f.type === 'image').map((f, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={f.src} alt="" className="max-w-full rounded-lg mb-4" />
        ))}
        <p className="text-zinc-800 text-sm leading-relaxed">{question.alternativesIntroduction}</p>
      </div>

      <div className="space-y-3 mb-6">
        {question.alternatives.map((alt) => {
          const isCorrect = revealed && alt.letter === question.correctAlternative
          const isWrong = revealed && alt.letter === selected && alt.letter !== question.correctAlternative
          return (
            <button
              key={alt.letter}
              onClick={() => onSelect(alt.letter)}
              disabled={revealed}
              className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex gap-3 ${
                isCorrect ? 'bg-green-50 border-green-400 text-green-800' :
                isWrong ? 'bg-red-50 border-red-400 text-red-800' :
                selected === alt.letter && !revealed ? 'bg-indigo-50 border-indigo-400' :
                'bg-white border-zinc-200 hover:border-indigo-300 disabled:cursor-default'
              }`}
            >
              <span className={`font-bold w-6 shrink-0 ${isCorrect ? 'text-green-600' : isWrong ? 'text-red-500' : 'text-indigo-600'}`}>
                {alt.letter}
              </span>
              <span>{alt.text}</span>
              {isCorrect && <span className="ml-auto text-green-500 shrink-0">✓</span>}
              {isWrong && <span className="ml-auto text-red-400 shrink-0">✗</span>}
            </button>
          )
        })}
      </div>

      {revealed && (
        <button onClick={onNext}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
          {current + 1 >= total ? 'Ver resultado' : 'Próxima questão →'}
        </button>
      )}
    </div>
  )
}

function FinishedScreen({ answers, totalTime, onRestart }: {
  answers: Answer[]
  totalTime: number
  onRestart: () => void
}) {
  const [shared, setShared] = useState(false)
  const correct = answers.filter((a) => a.is_correct).length
  const total = answers.length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const avgTime = total > 0 ? Math.round(answers.reduce((s, a) => s + a.time_ms, 0) / total / 1000) : 0
  const estimatedScore = Math.round(300 + (accuracy / 100) * 600)

  function handleShare() {
    const emoji = estimatedScore >= 700 ? '🏆' : estimatedScore >= 500 ? '📈' : '💪'
    const text = `${emoji} Fiz um simulado ENEM no ENEM Pro!\n\nNota estimada: ${estimatedScore} pts\nAcertos: ${correct}/${total} (${accuracy}%)\nTempo médio: ${avgTime}s/questão\n\nPratique grátis: https://enem-pro-eight.vercel.app`
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => { setShared(true); setTimeout(() => setShared(false), 2000) })
    }
  }

  // Breakdown por disciplina
  const byDisc: Record<string, { correct: number; total: number; color: string }> = {}
  let colorIdx = 0
  for (const a of answers) {
    if (!a.discipline) continue
    if (!byDisc[a.discipline]) byDisc[a.discipline] = { correct: 0, total: 0, color: DISC_COLORS[colorIdx++ % DISC_COLORS.length] }
    byDisc[a.discipline].total++
    if (a.is_correct) byDisc[a.discipline].correct++
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Resultado do Simulado</h1>
      <p className="text-zinc-500 mb-8">Você completou {total} questões em {formatTime(totalTime)}.</p>

      {/* Nota estimada */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center mb-6">
        <div className="text-zinc-500 text-sm mb-1">Nota estimada</div>
        <div className={`text-6xl font-black mb-2 ${estimatedScore >= 700 ? 'text-green-600' : estimatedScore >= 500 ? 'text-amber-500' : 'text-red-500'}`}>
          {estimatedScore}
        </div>
        <div className="text-zinc-400 text-xs">Baseado na sua taxa de acerto — não é nota TRI oficial</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 text-center">
          <div className="text-2xl font-bold text-indigo-600">{correct}/{total}</div>
          <div className="text-xs text-zinc-500 mt-1">Acertos</div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 text-center">
          <div className={`text-2xl font-bold ${accuracy >= 70 ? 'text-green-600' : accuracy >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
            {accuracy}%
          </div>
          <div className="text-xs text-zinc-500 mt-1">Taxa de acerto</div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 text-center">
          <div className="text-2xl font-bold text-zinc-700">{avgTime}s</div>
          <div className="text-xs text-zinc-500 mt-1">Média/questão</div>
        </div>
      </div>

      {/* Breakdown por disciplina */}
      {Object.keys(byDisc).length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
          <h3 className="font-bold text-zinc-900 mb-4">Desempenho por disciplina</h3>
          <div className="space-y-3">
            {Object.entries(byDisc).map(([disc, stat]) => {
              const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
              return (
                <div key={disc}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-700 truncate max-w-[60%]">{disc}</span>
                    <span className={`font-semibold ${pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {pct}% ({stat.correct}/{stat.total})
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${stat.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button onClick={handleShare}
        className="w-full mb-3 border border-zinc-300 text-zinc-700 py-3 rounded-xl font-semibold hover:bg-zinc-50 flex items-center justify-center gap-2">
        <span>{shared ? '✓ Copiado!' : '↗ Compartilhar resultado'}</span>
      </button>

      <div className="flex gap-3">
        <button onClick={onRestart}
          className="flex-1 border border-indigo-300 text-indigo-600 py-3 rounded-xl font-semibold hover:bg-indigo-50">
          Novo simulado
        </button>
        <Link href="/dashboard"
          className="flex-1 text-center bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700">
          Ver progresso →
        </Link>
      </div>
    </div>
  )
}
