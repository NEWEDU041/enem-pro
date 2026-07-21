'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { DISCIPLINES, YEARS, disciplineToSlug } from '@/lib/enem-constants'

const supabase = createBrowserClient()

type AnswerRow = {
  question_id: string
  discipline: string
  year: number
  answered_at: string
  is_correct: boolean
  selected_alternative: string
}

type Filter = 'all' | 'correct' | 'wrong'

function HistoricoContent() {
  const router = useRouter()
  const pathname = usePathname()
  const [answers, setAnswers] = useState<AnswerRow[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [discipline, setDiscipline] = useState('')
  const [year, setYear] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const PER_PAGE = 25

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/auth/login?next=${encodeURIComponent(pathname)}`); return }

      const { data } = await supabase
        .from('user_answers')
        .select('question_id, discipline, year, answered_at, is_correct, selected_alternative')
        .eq('user_id', user.id)
        .order('answered_at', { ascending: false })
        .limit(1000)

      setAnswers((data || []) as AnswerRow[])
      setLoading(false)
    }
    load()
  }, [router])

  const filtered = useMemo(() => {
    let res = answers
    if (filter === 'correct') res = res.filter((a) => a.is_correct)
    if (filter === 'wrong') res = res.filter((a) => !a.is_correct)
    if (discipline) res = res.filter((a) => a.discipline.includes(discipline))
    if (year) res = res.filter((a) => String(a.year) === year)
    return res
  }, [answers, filter, discipline, year])

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const correct = answers.filter((a) => a.is_correct).length
  const accuracy = answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
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
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">Histórico completo</h1>
          <p className="text-zinc-500 text-sm">
            {answers.length} {answers.length === 1 ? 'questão' : 'questões'} respondida{answers.length !== 1 ? 's' : ''} · {accuracy}% de acerto
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 text-center">
            <div className="text-3xl font-bold text-zinc-900">{answers.length}</div>
            <div className="text-xs text-zinc-400 mt-1">Total respondidas</div>
          </div>
          <div className="bg-white rounded-2xl border border-green-200 p-5 text-center">
            <div className="text-3xl font-bold text-green-600">{correct}</div>
            <div className="text-xs text-zinc-400 mt-1">Corretas</div>
          </div>
          <div className="bg-white rounded-2xl border border-red-200 p-5 text-center">
            <div className="text-3xl font-bold text-red-500">{answers.length - correct}</div>
            <div className="text-xs text-zinc-400 mt-1">Erradas</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
          {/* Resultado */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Resultado</label>
            <div className="flex gap-1.5">
              {(['all', 'correct', 'wrong'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setPage(1) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                >
                  {f === 'all' ? 'Todas' : f === 'correct' ? 'Acertos' : 'Erros'}
                </button>
              ))}
            </div>
          </div>

          {/* Disciplina */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Disciplina</label>
            <select
              value={discipline}
              onChange={(e) => { setDiscipline(e.target.value); setPage(1) }}
              className="border border-zinc-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todas</option>
              {DISCIPLINES.map((d) => (
                <option key={d} value={d}>{d.split(',')[0]}</option>
              ))}
            </select>
          </div>

          {/* Ano */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Ano</label>
            <select
              value={year}
              onChange={(e) => { setYear(e.target.value); setPage(1) }}
              className="border border-zinc-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos</option>
              {YEARS.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>

          {(filter !== 'all' || discipline || year) && (
            <button
              onClick={() => { setFilter('all'); setDiscipline(''); setYear(''); setPage(1) }}
              className="text-xs text-zinc-400 hover:text-zinc-700 underline ml-auto"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Lista */}
        {answers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-lg font-bold mb-2">Nenhuma questão respondida ainda</h2>
            <p className="text-zinc-500 text-sm mb-6">Comece a praticar para ver seu histórico aqui.</p>
            <Link href="/questoes" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700">
              Ir para questões →
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden mb-6">
              <div className="px-6 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
                </span>
                <Link href="/revisao" className="text-xs text-indigo-600 font-semibold hover:underline">
                  Só erros → Modo Revisão
                </Link>
              </div>
              {paginated.length === 0 ? (
                <div className="px-6 py-10 text-center text-zinc-400 text-sm">Nenhum resultado com esse filtro.</div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {paginated.map((a, i) => {
                    const shortDisc = a.discipline.split(',')[0].replace('e suas Tecnologias', '').trim()
                    const discSlug = disciplineToSlug(a.discipline)
                    const href = discSlug ? `/questoes/${discSlug}/${a.year}/${a.question_id.split('-')[1]}` : `/gabarito/${a.year}`
                    return (
                      <Link
                        key={`${a.question_id}-${i}`}
                        href={href}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors"
                      >
                        <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${a.is_correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                          {a.is_correct ? '✓' : '✗'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-zinc-800">
                            <span className="font-medium">{shortDisc}</span>
                            <span className="text-zinc-400 mx-1.5">·</span>
                            <span>ENEM {a.year}</span>
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            Resposta: <span className="font-semibold">{a.selected_alternative}</span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xs text-zinc-400">{formatDate(a.answered_at)}</div>
                          <div className="text-xs font-semibold text-indigo-500 mt-0.5">Ver →</div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

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

export default function HistoricoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Carregando...</div>}>
      <HistoricoContent />
    </Suspense>
  )
}
