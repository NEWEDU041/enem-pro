'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { Question } from '@/lib/types'
import { ENEM_DATE, daysUntil } from '@/lib/utils'
import { toggleFavorito, isFavorito } from '@/app/favoritos/page'

function MarkdownText({ text, className }: { text: string; className?: string }) {
  const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|!\[[^\]]*\]\([^)]+\))/g
  return (
    <div className={className}>
      {text.split('\n').map((line, li) => (
        <p key={li} className={li > 0 ? 'mt-2' : ''}>
          {line.split(TOKEN).map((part, i) => {
            if (/^\*\*(.+)\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>
            if (/^\*(.+)\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>
            const img = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
            if (img) {
              const src = img[2]
              if (src.includes('enem.dev') || src.includes('broken-image')) return null
              return (
                <img key={i} src={src} alt={img[1] || 'imagem'} className="max-w-full my-2 rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              )
            }
            return part
          })}
        </p>
      ))}
    </div>
  )
}

const supabase = createBrowserClient()

type Status = 'idle' | 'answered' | 'explaining' | 'explained'

export default function QuestionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Carregando questão...</div>}>
      <QuestionContent />
    </Suspense>
  )
}

function QuestionContent() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const year = searchParams.get('year') || id.split('-')[0]
  const router = useRouter()

  const [question, setQuestion] = useState<Question | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [isCorrect, setIsCorrect] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [limitReached, setLimitReached] = useState(false)
  const [freeExplainAvailable, setFreeExplainAvailable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [starred, setStarred] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      const [qRes, subRes] = await Promise.all([
        fetch(`/api/questoes/${id}?year=${year}`),
        supabase.from('subscriptions').select('plan, expires_at').eq('user_id', user.id).single(),
      ])

      const qData = await qRes.json()
      setQuestion(qData.question || null)

      const sub = subRes.data
      setIsPro(!!sub && sub.plan === 'pro' && sub.expires_at && new Date(sub.expires_at) > new Date())
      setStarred(isFavorito(id))
      setLoading(false)
    }
    load()
  }, [id, year, router])

  // Timer
  useEffect(() => {
    if (loading || status !== 'idle') return
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [loading, status])

  const handleAnswer = useCallback(async (letter: string) => {
    if (status !== 'idle' || !user || !question) return
    setSelected(letter)

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/responder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        question_id: question.id,
        selected_alternative: letter,
        correct_alternative: question.correctAlternative,
        discipline: question.discipline,
        year: question.year,
      }),
    })

    const data = await res.json()

    if (data.limitReached) {
      setLimitReached(true)
      return
    }

    setIsCorrect(data.is_correct)
    setStatus('answered')
  }, [status, user, question])

  // Keyboard shortcuts: A–E to answer, Enter/→ for next
  useEffect(() => {
    if (loading || !question) return
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toUpperCase()
      const letters = question!.alternatives.map((a) => a.letter)
      if (letters.includes(key) && status === 'idle') {
        handleAnswer(key)
      }
      if ((key === 'ENTER' || key === 'ARROWRIGHT') && status === 'answered') {
        const parts = id.split('-')
        const nextNum = parseInt(parts[1]) + 1
        router.push(`/questoes/${parts[0]}-${nextNum}?year=${year}`)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, question, status, handleAnswer, id, year, router])

  async function handleExplain() {
    if (!user || !question) return
    setStatus('explaining')

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/explicar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        question_title: question.title,
        correct_alternative: question.correctAlternative,
        alternatives: question.alternatives,
        discipline: question.discipline,
        year: question.year,
      }),
    })

    const data = await res.json()
    if (data.freeTrialUsed) {
      setFreeExplainAvailable(false)
      setStatus('answered')
      return
    }
    if (!data.explanation) {
      setFreeExplainAvailable(false)
      setStatus('answered')
      return
    }
    setFreeExplainAvailable(false)
    setExplanation(data.explanation)
    setStatus('explained')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-zinc-400">Carregando questão...</div>
  if (!question) return <div className="min-h-screen flex items-center justify-center text-zinc-400">Questão não encontrada.</div>

  if (limitReached) {
    const daysToEnem = daysUntil(ENEM_DATE)
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center mb-4">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold mb-2">Você treinou suas 10 questões hoje</h2>
            <p className="text-zinc-500 text-sm mb-6">Você está no caminho certo. Mas o ENEM não para.</p>

            {daysToEnem > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
                <p className="text-amber-800 font-semibold text-sm">
                  Faltam <span className="text-2xl font-bold">{daysToEnem}</span> dias para o ENEM 2026
                </p>
                <p className="text-amber-600 text-xs mt-1">Cada dia conta. Não perca o ritmo.</p>
              </div>
            )}

            <div className="bg-indigo-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-indigo-900 mb-2">Com o Pro você teria recebido:</p>
              <ul className="space-y-1 text-sm text-indigo-700">
                <li>✓ Explicação da IA para cada questão que errou</li>
                <li>✓ Questões ilimitadas — sem parar no limite</li>
                <li>✓ Menos que 1 aula particular por mês</li>
              </ul>
            </div>

            <Link href="/planos" className="block w-full bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors mb-3">
              Assinar Pro — R$14,90/mês
            </Link>
            <Link href="/planos" className="block w-full border border-indigo-200 text-indigo-600 px-6 py-3 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors mb-4">
              Plano anual — R$99/ano (economize 45%)
            </Link>
            <p className="text-xs text-zinc-400">Garantia de 30 dias. Cancele quando quiser.</p>
          </div>
          <div className="text-center">
            <Link href="/dashboard" className="text-zinc-400 text-sm hover:text-zinc-600">← Voltar ao dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-zinc-400">{mm}:{ss}</span>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">{question.discipline.split(',')[0]}</span>
            <span className="text-xs text-zinc-400">ENEM {question.year}</span>
            <button
              onClick={() => {
                const next = toggleFavorito({ id: question.id, year: question.year, discipline: question.discipline, title: question.title })
                setStarred(next)
              }}
              title={starred ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
              className={`text-xl transition-colors ${starred ? 'text-amber-400' : 'text-zinc-300 hover:text-amber-300'}`}
            >
              {starred ? '⭐' : '☆'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Keyboard hint */}
        {status === 'idle' && (
          <p className="text-xs text-zinc-400 text-right mb-4">Atalho: pressione a letra da alternativa para responder</p>
        )}

        {/* Question */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 mb-6">
          {question.context && (
            <MarkdownText
              text={question.context}
              className="text-sm text-zinc-600 leading-relaxed mb-6 pb-6 border-b border-zinc-100"
            />
          )}
          {question.alternativesIntroduction && (
            <p className="text-sm text-zinc-600 mb-4 italic">{question.alternativesIntroduction}</p>
          )}
          <MarkdownText
            text={question.title}
            className="text-zinc-900 leading-relaxed font-medium mb-8"
          />

          {/* Alternatives */}
          <div className="space-y-3">
            {question.alternatives.map((alt) => {
              const isSelected = selected === alt.letter
              const isCorrectAlt = alt.letter === question.correctAlternative

              let cls = 'w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all '
              if (status === 'idle') {
                cls += 'border-zinc-200 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer'
              } else if (isCorrectAlt) {
                cls += 'border-green-400 bg-green-50'
              } else if (isSelected && !isCorrectAlt) {
                cls += 'border-red-300 bg-red-50'
              } else {
                cls += 'border-zinc-100 bg-zinc-50 opacity-60'
              }

              return (
                <button
                  key={alt.letter}
                  onClick={() => handleAnswer(alt.letter)}
                  disabled={status !== 'idle'}
                  className={cls}
                >
                  <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    status !== 'idle' && isCorrectAlt
                      ? 'bg-green-500 text-white'
                      : status !== 'idle' && isSelected && !isCorrectAlt
                      ? 'bg-red-400 text-white'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {alt.letter}
                  </span>
                  <span className="text-sm text-zinc-700 leading-relaxed pt-1">{alt.text}</span>
                  {status !== 'idle' && isCorrectAlt && (
                    <span className="ml-auto shrink-0 text-green-600 text-lg">✓</span>
                  )}
                  {status !== 'idle' && isSelected && !isCorrectAlt && (
                    <span className="ml-auto shrink-0 text-red-400 text-lg">✗</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Result + Explanation */}
        {status === 'answered' && (
          <div className={`rounded-2xl border p-6 mb-6 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{isCorrect ? '🎉' : '😅'}</span>
              <h3 className={`text-lg font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? 'Resposta correta!' : `Errou — a correta era ${question.correctAlternative}`}
              </h3>
              <span className="ml-auto text-xs text-zinc-400 font-mono">{mm}:{ss}</span>
            </div>

            {isPro ? (
              <button
                onClick={handleExplain}
                className="mt-3 bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Ver explicação completa (IA)
              </button>
            ) : freeExplainAvailable ? (
              <div className="mt-3">
                <button
                  onClick={handleExplain}
                  className="w-full bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Ver explicação grátis (1x por dia)
                </button>
                <p className="text-xs text-zinc-400 mt-1.5 text-center">Pro: ilimitado — R$14,90/mês</p>
              </div>
            ) : (
              <div className="mt-3 bg-white border border-dashed border-indigo-300 rounded-xl p-4 text-center">
                <p className="text-sm text-zinc-600 mb-1 font-medium">Gostou da explicação?</p>
                <p className="text-xs text-zinc-400 mb-3">Pro: IA explica todas as questões, sem limite diário.</p>
                <Link
                  href="/planos"
                  className="inline-block bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Assinar Pro — R$14,90/mês
                </Link>
              </div>
            )}
          </div>
        )}

        {status === 'explaining' && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-6 text-center text-zinc-400 text-sm">
            A IA está gerando a explicação...
          </div>
        )}

        {status === 'explained' && explanation && (
          <div className="bg-white border border-indigo-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🤖</span>
              <h3 className="font-semibold text-zinc-900">Explicação da IA</h3>
            </div>
            <p className="text-zinc-700 leading-relaxed text-sm whitespace-pre-wrap">{explanation}</p>
          </div>
        )}

        {/* Navigation */}
        {status !== 'idle' && (
          <div className="flex gap-3">
            <Link
              href={`/questoes?year=${year}`}
              className="flex-1 text-center border border-zinc-300 text-zinc-700 py-3 rounded-xl font-medium hover:bg-zinc-50 transition-colors text-sm"
            >
              ← Ver outras questões
            </Link>
            <button
              onClick={() => {
                const parts = id.split('-')
                const nextNum = parseInt(parts[1]) + 1
                router.push(`/questoes/${parts[0]}-${nextNum}?year=${year}`)
              }}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm"
            >
              Próxima questão → <span className="text-indigo-300 text-xs ml-1">[Enter]</span>
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
