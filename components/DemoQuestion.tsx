'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Alt { letter: string; text: string }
interface Q {
  index: number
  year: number
  discipline: string
  alternativesIntroduction: string
  alternatives: Alt[]
  correctAlternative: string
  files?: { type: string; src: string }[]
}

// Rotação diária: 4 disciplinas × 15 anos = 60 combos, ciclo de 60 dias
const COMBOS = [
  { year: 2023, discipline: 'Matemática' },
  { year: 2023, discipline: 'Ciências Humanas' },
  { year: 2023, discipline: 'Linguagens' },
  { year: 2023, discipline: 'Ciências da Natureza' },
  { year: 2022, discipline: 'Matemática' },
  { year: 2022, discipline: 'Ciências Humanas' },
  { year: 2022, discipline: 'Linguagens' },
  { year: 2022, discipline: 'Ciências da Natureza' },
  { year: 2021, discipline: 'Matemática' },
  { year: 2021, discipline: 'Ciências Humanas' },
  { year: 2021, discipline: 'Linguagens' },
  { year: 2021, discipline: 'Ciências da Natureza' },
  { year: 2020, discipline: 'Matemática' },
  { year: 2020, discipline: 'Ciências Humanas' },
  { year: 2020, discipline: 'Linguagens' },
  { year: 2020, discipline: 'Ciências da Natureza' },
  { year: 2019, discipline: 'Matemática' },
  { year: 2019, discipline: 'Ciências Humanas' },
  { year: 2018, discipline: 'Matemática' },
  { year: 2018, discipline: 'Linguagens' },
]

function getDailyCombo() {
  const daysSinceEpoch = Math.floor(Date.now() / 86400000)
  return COMBOS[daysSinceEpoch % COMBOS.length]
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
}

export default function DemoQuestion() {
  const [q, setQ] = useState<Q | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const revealed = selected !== null
  const combo = getDailyCombo()
  const today = formatDate(new Date())

  useEffect(() => {
    const disc = encodeURIComponent(combo.discipline)
    fetch(`/api/questoes?year=${combo.year}&limit=20&discipline=${disc}`)
      .then(r => r.json())
      .then(data => {
        const list: Q[] = data.questions || []
        // Determinístico no dia: usa o dayOfYear para escolher o índice
        const dayOfYear = Math.floor(Date.now() / 86400000)
        const eligible = list.filter(
          (q) =>
            q.alternativesIntroduction &&
            q.alternativesIntroduction.length >= 60 &&
            q.alternativesIntroduction.length < 320 &&
            q.alternatives?.length === 5 &&
            !q.files?.length
        )
        const pick = eligible.length > 0 ? eligible[dayOfYear % eligible.length] : list[0]
        setQ(pick || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [combo.discipline, combo.year])

  if (loading) return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-32 bg-zinc-100 rounded mb-4" />
      <div className="h-20 bg-zinc-100 rounded-xl" />
      {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-zinc-100 rounded-xl" />)}
    </div>
  )

  if (!q) return null

  const isCorrect = selected === q.correctAlternative

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Questão do Dia</span>
          <span className="text-xs text-zinc-400">{today}</span>
        </div>
        <span className="text-xs text-zinc-400">ENEM {q.year} · {q.discipline.split(',')[0]}</span>
      </div>

      {revealed && (
        <div className={`rounded-xl px-5 py-3 mb-4 flex items-center gap-3 border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <span className="text-xl">{isCorrect ? '🎉' : '😅'}</span>
          <span className={`font-semibold text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {isCorrect ? 'Correto! Você acertou.' : `Errou — a correta era ${q.correctAlternative}`}
          </span>
        </div>
      )}

      <div className="bg-zinc-50 rounded-xl p-4 mb-4">
        <p className="text-sm text-zinc-800 leading-relaxed">{q.alternativesIntroduction}</p>
      </div>

      <div className="space-y-2 mb-5">
        {q.alternatives.map(alt => {
          const right = revealed && alt.letter === q.correctAlternative
          const wrong = revealed && alt.letter === selected && !right
          return (
            <button
              key={alt.letter}
              onClick={() => !revealed && setSelected(alt.letter)}
              disabled={revealed}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm flex gap-3 transition-all ${
                right ? 'bg-green-50 border-green-400 text-green-800' :
                wrong ? 'bg-red-50 border-red-400 text-red-800' :
                selected === alt.letter ? 'bg-indigo-50 border-indigo-400' :
                'bg-white border-zinc-200 hover:border-indigo-300 disabled:cursor-default'
              }`}
            >
              <span className={`font-bold w-5 shrink-0 ${right ? 'text-green-600' : wrong ? 'text-red-500' : 'text-indigo-600'}`}>
                {alt.letter}
              </span>
              <span className="flex-1">{alt.text}</span>
              {right && <span className="ml-auto text-green-500 shrink-0">✓</span>}
              {wrong && <span className="ml-auto text-red-400 shrink-0">✗</span>}
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
          <p className="text-sm font-semibold text-indigo-900 mb-1.5">No Pro, a IA explica o raciocínio completo:</p>
          <p className="text-sm text-indigo-700 italic mb-4 leading-relaxed">
            {isCorrect
              ? `"A alternativa ${q.correctAlternative} é correta porque... [a IA detalha passo a passo para cada questão que você responder]"`
              : `"A alternativa ${q.correctAlternative} é a correta. Você errou porque... [a IA identifica o gap e explica como não repetir o erro]"`}
          </p>
          <Link href="/auth/register"
            className="block text-center bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 text-sm transition-colors">
            Criar conta grátis — 10 questões/dia
          </Link>
          <p className="text-xs text-center text-indigo-400 mt-2">Nova questão do dia amanhã. Sem cartão de crédito.</p>
        </div>
      )}

      {!revealed && (
        <p className="text-xs text-center text-zinc-400 mt-2">Selecione uma alternativa para ver o gabarito</p>
      )}
    </div>
  )
}
