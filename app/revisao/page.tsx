'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { DISCIPLINES } from '@/lib/enem-constants'

const supabase = createBrowserClient()

type WrongAnswer = {
  question_id: string
  discipline: string
  year: number
  answered_at: string
  selected_alternative: string
}

function RevisaoContent() {
  const router = useRouter()
  const [answers, setAnswers] = useState<WrongAnswer[]>([])
  const [discipline, setDiscipline] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data } = await supabase
        .from('user_answers')
        .select('question_id, discipline, year, answered_at, selected_alternative')
        .eq('user_id', user.id)
        .eq('is_correct', false)
        .order('answered_at', { ascending: false })
        .limit(500)

      const rows = (data || []) as WrongAnswer[]
      // Deduplicate by question_id (keep most recent)
      const seen = new Set<string>()
      const deduped = rows.filter((r) => {
        if (seen.has(r.question_id)) return false
        seen.add(r.question_id)
        return true
      })
      setAnswers(deduped)
      setLoading(false)
    }
    load()
  }, [router])

  const filtered = useMemo(
    () => (discipline ? answers.filter((a) => a.discipline.includes(discipline)) : answers),
    [answers, discipline]
  )

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  const byDisc = DISCIPLINES.reduce<Record<string, number>>((acc, d) => {
    acc[d] = answers.filter((a) => a.discipline.includes(d)).length
    return acc
  }, {})

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-zinc-400">Carregando...</div>

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-900">← Dashboard</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">Modo Revisão</h1>
          <p className="text-zinc-500 text-sm">
            {answers.length === 0
              ? 'Nenhuma questão errada ainda. Continue praticando!'
              : `${answers.length} questão${answers.length > 1 ? 'ões' : ''} errada${answers.length > 1 ? 's' : ''} — foque nos pontos fracos.`}
          </p>
        </div>

        {answers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-lg font-bold mb-2">Nenhum erro registrado ainda</h2>
            <p className="text-zinc-500 text-sm mb-6">Responda questões e volte aqui para revisar os erros.</p>
            <Link href="/questoes" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700">
              Ir para questões →
            </Link>
          </div>
        ) : (
          <>
            {/* Breakdown por disciplina */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <button
                onClick={() => { setDiscipline(''); setPage(1) }}
                className={`rounded-xl border p-4 text-left transition-all ${!discipline ? 'border-indigo-400 bg-indigo-50' : 'border-zinc-200 bg-white hover:border-indigo-300'}`}
              >
                <div className="text-xl font-bold text-zinc-900">{answers.length}</div>
                <div className="text-xs text-zinc-500 mt-1">Todas as disciplinas</div>
              </button>
              {DISCIPLINES.map((d) => {
                const short = d.split(',')[0].replace('e suas Tecnologias', '').trim()
                const count = byDisc[d] || 0
                return (
                  <button
                    key={d}
                    onClick={() => { setDiscipline(d); setPage(1) }}
                    className={`rounded-xl border p-4 text-left transition-all ${discipline === d ? 'border-indigo-400 bg-indigo-50' : 'border-zinc-200 bg-white hover:border-indigo-300'}`}
                  >
                    <div className={`text-xl font-bold ${count === 0 ? 'text-zinc-300' : count > 10 ? 'text-red-600' : 'text-amber-600'}`}>{count}</div>
                    <div className="text-xs text-zinc-500 mt-1 leading-tight">{short}</div>
                  </button>
                )
              })}
            </div>

            {/* Lista */}
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-700">
                  {filtered.length} questão{filtered.length !== 1 ? 'ões' : ''}
                  {discipline ? ` em ${discipline.split(',')[0]}` : ''}
                </span>
                <span className="text-xs text-zinc-400">Clique para rever</span>
              </div>
              {paginated.length === 0 ? (
                <div className="px-6 py-10 text-center text-zinc-400 text-sm">Nenhum erro nessa disciplina.</div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {paginated.map((a, i) => {
                    const shortDisc = a.discipline.split(',')[0].replace('e suas Tecnologias', '').trim()
                    return (
                      <Link
                        key={`${a.question_id}-${i}`}
                        href={`/questoes/${a.question_id}?year=${a.year}`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-indigo-50 transition-colors"
                      >
                        <div className="shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                          ✗
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-zinc-900">
                            {shortDisc} — ENEM {a.year}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            Respondeu: <span className="font-semibold">{a.selected_alternative}</span> · Errada em {formatDate(a.answered_at)}
                          </div>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-indigo-600">Revisar →</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-3">
                {page > 1 && (
                  <button onClick={() => setPage(page - 1)} className="px-4 py-2 border border-zinc-300 rounded-lg text-sm hover:bg-zinc-50">
                    ← Anterior
                  </button>
                )}
                <span className="px-4 py-2 text-sm text-zinc-500">Página {page} de {totalPages}</span>
                {page < totalPages && (
                  <button onClick={() => setPage(page + 1)} className="px-4 py-2 border border-zinc-300 rounded-lg text-sm hover:bg-zinc-50">
                    Próxima →
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default function RevisaoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Carregando...</div>}>
      <RevisaoContent />
    </Suspense>
  )
}
