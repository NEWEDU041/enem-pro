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

export default function DemoQuestion() {
  const [q, setQ] = useState<Q | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const revealed = selected !== null

  useEffect(() => {
    fetch('/api/questoes?year=2022&limit=10&discipline=Matem%C3%A1tica')
      .then(r => r.json())
      .then(data => {
        const list: Q[] = data.questions || []
        const candidate = list.find(
          (q) =>
            q.alternativesIntroduction &&
            q.alternativesIntroduction.length >= 60 &&
            q.alternativesIntroduction.length < 280 &&
            q.alternatives?.length === 5 &&
            !q.files?.length
        )
        setQ(candidate || list[0] || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="animate-pulse space-y-3">
      <div className="h-16 bg-zinc-100 rounded-xl" />
      {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-zinc-100 rounded-xl" />)}
    </div>
  )

  if (!q) return null

  const isCorrect = selected === q.correctAlternative

  return (
    <div>
      {revealed && (
        <div className={`rounded-xl px-5 py-3 mb-4 flex items-center gap-3 border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <span className="text-xl">{isCorrect ? '🎉' : '😅'}</span>
          <span className={`font-semibold text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {isCorrect ? 'Certo! Você acertou.' : `Errou — a correta era ${q.correctAlternative}`}
          </span>
        </div>
      )}

      <div className="bg-zinc-50 rounded-xl p-4 mb-4">
        <div className="text-xs text-zinc-400 mb-2">ENEM {q.year} · {q.discipline.split(',')[0]}</div>
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
          <p className="text-sm font-semibold text-indigo-900 mb-2">No Pro, a IA explica o raciocínio completo:</p>
          <p className="text-sm text-indigo-700 italic mb-4">
            {isCorrect
              ? `"Exato! A alternativa ${q.correctAlternative} é correta porque... [a IA detalha o raciocínio completo, passo a passo, para cada questão]"`
              : `"A alternativa ${q.correctAlternative} é a correta porque... [a IA explica por que você errou e como nunca mais cometer esse erro]"`}
          </p>
          <Link href="/auth/register"
            className="block text-center bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 text-sm transition-colors">
            Ver explicação completa — Criar conta grátis
          </Link>
        </div>
      )}

      {!revealed && (
        <p className="text-xs text-center text-zinc-400 mt-2">Selecione uma alternativa para responder</p>
      )}
    </div>
  )
}
