'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Question } from '@/lib/types'
import { YEARS, DISCIPLINES } from '@/lib/enem-api'

function QuestoesContent() {
  const params = useSearchParams()
  const [year, setYear] = useState(params.get('year') || '2023')
  const [discipline, setDiscipline] = useState(params.get('discipline') || '')
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const p = new URLSearchParams({ year, page: page.toString() })
      if (discipline) p.set('discipline', discipline)
      const res = await fetch(`/api/questoes?${p}`)
      const data = await res.json()
      setQuestions(data.questions || [])
      setTotal(data.total || 0)
      setLoading(false)
    }
    load()
  }, [year, discipline, page])

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-900">← Voltar</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6">Questões do ENEM</h1>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-8 grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Ano</label>
            <select
              value={year}
              onChange={(e) => { setYear(e.target.value); setPage(1) }}
              className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Disciplina</label>
            <select
              value={discipline}
              onChange={(e) => { setDiscipline(e.target.value); setPage(1) }}
              className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todas</option>
              {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-zinc-400 py-20">Carregando questões...</div>
        ) : questions.length === 0 ? (
          <div className="text-center text-zinc-400 py-20">Nenhuma questão encontrada para esse filtro.</div>
        ) : (
          <>
            <p className="text-sm text-zinc-500 mb-4">{total} questões encontradas</p>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <Link
                  key={q.id}
                  href={`/questoes/${q.id}?year=${year}`}
                  className="block bg-white rounded-xl border border-zinc-200 px-6 py-4 hover:border-indigo-400 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{q.discipline}</span>
                        <span className="text-xs text-zinc-400">ENEM {q.year} — Questão {((page - 1) * 20) + i + 1}</span>
                      </div>
                      <p className="text-sm text-zinc-700 line-clamp-2 leading-relaxed">
                        {q.title || 'Ver questão completa'}
                      </p>
                    </div>
                    <span className="text-zinc-300 text-lg shrink-0">→</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-3 mt-8">
              {page > 1 && (
                <button onClick={() => setPage(page - 1)} className="px-4 py-2 border border-zinc-300 rounded-lg text-sm hover:bg-zinc-50">
                  ← Anterior
                </button>
              )}
              <span className="px-4 py-2 text-sm text-zinc-500">Página {page}</span>
              {questions.length === 20 && (
                <button onClick={() => setPage(page + 1)} className="px-4 py-2 border border-zinc-300 rounded-lg text-sm hover:bg-zinc-50">
                  Próxima →
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default function QuestoesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Carregando...</div>}>
      <QuestoesContent />
    </Suspense>
  )
}
